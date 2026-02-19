using Passly.Abstractions.Interfaces;

namespace Passly.Core.Services;

internal sealed class MessageCurator : IMessageCurator
{
    private const float DeduplicationThreshold = 0.95f;
    private const int MinMessagesForClustering = 3;
    private const int KMeansMaxIterations = 20;

    public async Task<CurationResult> CurateAsync(
        IReadOnlyList<DecryptedMessage> messages,
        IEmbeddingService embeddingService,
        CurationOptions options,
        CancellationToken ct = default)
    {
        if (messages.Count == 0)
            return new CurationResult([], []);

        if (messages.Count <= options.TargetCount)
            return ReturnAll(messages);

        // Phase 1: Time-window segmentation
        var windows = SegmentIntoWindows(messages);
        var budgets = AllocateBudgets(windows, options.TargetCount);
        var gaps = DetectGapsFromWindows(windows);

        // Phase 2 & 3: Per-window embedding, clustering, and selection
        var selected = new List<CuratedMessage>();
        var selectedEmbeddings = new List<float[]>();

        for (var i = 0; i < windows.Count; i++)
        {
            ct.ThrowIfCancellationRequested();

            var window = windows[i];
            var budget = budgets[i];

            if (window.Messages.Count == 0 || budget == 0)
                continue;

            if (window.Messages.Count <= budget)
            {
                AddAllFromWindow(window, selected);
                continue;
            }

            var texts = window.Messages.Select(m => m.Content).ToList();
            var windowEmbeddings = await embeddingService.GenerateEmbeddingsAsync(texts, ct);

            AddRepresentatives(window, windowEmbeddings, budget, messages, selected, selectedEmbeddings);
        }

        selected.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));
        return new CurationResult(selected, gaps);
    }

    public Task<CurationResult> CurateAsync(
        IReadOnlyList<DecryptedMessage> messages,
        float[][] embeddings,
        CurationOptions options,
        CancellationToken ct = default)
    {
        if (messages.Count == 0)
            return Task.FromResult(new CurationResult([], []));

        if (messages.Count <= options.TargetCount)
            return Task.FromResult(ReturnAll(messages));

        // Build lookup from message Id to index in the pre-computed embeddings array
        var embeddingIndex = new Dictionary<Guid, int>(messages.Count);
        for (var i = 0; i < messages.Count; i++)
            embeddingIndex[messages[i].Id] = i;

        // Phase 1: Time-window segmentation
        var windows = SegmentIntoWindows(messages);
        var budgets = AllocateBudgets(windows, options.TargetCount);
        var gaps = DetectGapsFromWindows(windows);

        // Phase 2 & 3: Per-window selection using pre-computed embeddings
        var selected = new List<CuratedMessage>();
        var selectedEmbeddings = new List<float[]>();

        for (var i = 0; i < windows.Count; i++)
        {
            ct.ThrowIfCancellationRequested();

            var window = windows[i];
            var budget = budgets[i];

            if (window.Messages.Count == 0 || budget == 0)
                continue;

            if (window.Messages.Count <= budget)
            {
                AddAllFromWindow(window, selected);
                continue;
            }

            // Slice pre-computed embeddings for this window's messages
            var windowEmbeddings = window.Messages
                .Select(m => embeddings[embeddingIndex[m.Id]])
                .ToArray();

            AddRepresentatives(window, windowEmbeddings, budget, messages, selected, selectedEmbeddings);
        }

        selected.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));
        return Task.FromResult(new CurationResult(selected, gaps));
    }

    private static CurationResult ReturnAll(IReadOnlyList<DecryptedMessage> messages)
    {
        var all = messages.Select(m => new CuratedMessage(
            m.Id, m.SenderName, m.Content, m.Timestamp, m.MessageIndex,
            FormatTimeWindow(m.Timestamp), 1.0f)).ToList();
        var gaps = DetectGaps(messages);
        return new CurationResult(all, gaps);
    }

    private static void AddAllFromWindow(TimeWindow window, List<CuratedMessage> selected)
    {
        foreach (var msg in window.Messages)
        {
            selected.Add(new CuratedMessage(
                msg.Id, msg.SenderName, msg.Content, msg.Timestamp,
                msg.MessageIndex, window.Label, 1.0f));
        }
    }

    private static void AddRepresentatives(
        TimeWindow window,
        float[][] windowEmbeddings,
        int budget,
        IReadOnlyList<DecryptedMessage> allMessages,
        List<CuratedMessage> selected,
        List<float[]> selectedEmbeddings)
    {
        var representatives = SelectRepresentatives(
            window.Messages, windowEmbeddings, budget, window.Label,
            allMessages, selectedEmbeddings);

        foreach (var (msg, embedding) in representatives)
        {
            selected.Add(msg);
            selectedEmbeddings.Add(embedding);
        }
    }

    private static List<TimeWindow> SegmentIntoWindows(IReadOnlyList<DecryptedMessage> messages)
    {
        var first = messages[0].Timestamp;
        var last = messages[^1].Timestamp;
        var totalSpan = last - first;

        // Adaptive window size: weekly for < 6 months, bi-weekly for 6-18 months, monthly for > 18 months
        var windowDays = totalSpan.TotalDays switch
        {
            < 180 => 7,
            < 540 => 14,
            _ => 30,
        };

        var windows = new List<TimeWindow>();
        var windowStart = first;

        while (windowStart <= last)
        {
            var windowEnd = windowStart.AddDays(windowDays);
            var windowMessages = messages
                .Where(m => m.Timestamp >= windowStart && m.Timestamp < windowEnd)
                .ToList();

            var label = $"{windowStart:yyyy-MM-dd} to {windowEnd.AddDays(-1):yyyy-MM-dd}";
            windows.Add(new TimeWindow(windowStart, windowEnd, label, windowMessages));
            windowStart = windowEnd;
        }

        return windows;
    }

    private static int[] AllocateBudgets(List<TimeWindow> windows, int totalBudget)
    {
        var totalMessages = windows.Sum(w => w.Messages.Count);
        var budgets = new int[windows.Count];

        if (totalMessages == 0)
            return budgets;

        var allocated = 0;

        // First pass: proportional allocation with minimum of 1 per non-empty window
        for (var i = 0; i < windows.Count; i++)
        {
            if (windows[i].Messages.Count == 0)
                continue;

            budgets[i] = Math.Max(1,
                (int)Math.Round((double)windows[i].Messages.Count / totalMessages * totalBudget));
            allocated += budgets[i];
        }

        // Adjust for over/under allocation
        var nonEmptyWindows = windows
            .Select((w, i) => (Index: i, Count: w.Messages.Count))
            .Where(x => x.Count > 0)
            .OrderByDescending(x => x.Count)
            .ToList();

        while (allocated > totalBudget && nonEmptyWindows.Count > 0)
        {
            foreach (var w in nonEmptyWindows)
            {
                if (allocated <= totalBudget) break;
                if (budgets[w.Index] > 1)
                {
                    budgets[w.Index]--;
                    allocated--;
                }
            }
        }

        while (allocated < totalBudget && nonEmptyWindows.Count > 0)
        {
            foreach (var w in nonEmptyWindows)
            {
                if (allocated >= totalBudget) break;
                if (budgets[w.Index] < windows[w.Index].Messages.Count)
                {
                    budgets[w.Index]++;
                    allocated++;
                }
            }
        }

        return budgets;
    }

    private static List<(CuratedMessage Message, float[] Embedding)> SelectRepresentatives(
        IReadOnlyList<DecryptedMessage> windowMessages,
        float[][] embeddings,
        int budget,
        string windowLabel,
        IReadOnlyList<DecryptedMessage> allMessages,
        List<float[]> alreadySelectedEmbeddings)
    {
        var k = Math.Min(budget, windowMessages.Count);

        int[] assignments;
        float[][] centroids;

        if (windowMessages.Count < MinMessagesForClustering || k <= 1)
        {
            // Too few messages for meaningful clustering — assign all to one cluster
            assignments = new int[windowMessages.Count];
            centroids = [ComputeCentroid(embeddings, Enumerable.Range(0, embeddings.Length).ToList())];
            k = 1;
        }
        else
        {
            (assignments, centroids) = KMeans(embeddings, k);
        }

        var result = new List<(CuratedMessage, float[])>();

        for (var c = 0; c < centroids.Length; c++)
        {
            var clusterIndices = new List<int>();
            for (var i = 0; i < assignments.Length; i++)
            {
                if (assignments[i] == c)
                    clusterIndices.Add(i);
            }

            if (clusterIndices.Count == 0)
                continue;

            // Score each message in the cluster
            var scored = clusterIndices.Select(idx =>
            {
                var msg = windowMessages[idx];
                var embedding = embeddings[idx];

                // Centroid proximity (cosine similarity with centroid)
                var centroidSim = CosineSimilarity(embedding, centroids[c]);

                // Conversational context bonus
                var contextBonus = HasConversationalContext(msg, allMessages) ? 0.1f : 0f;

                // Length normalization: prefer moderate length (20-500 chars)
                var lengthScore = msg.Content.Length switch
                {
                    < 5 => 0.5f,
                    < 20 => 0.8f,
                    <= 500 => 1.0f,
                    <= 1000 => 0.9f,
                    _ => 0.7f,
                };

                var score = centroidSim * 0.7f + contextBonus + lengthScore * 0.2f;

                return (Index: idx, Score: score, Embedding: embedding, Message: msg);
            })
            .OrderByDescending(x => x.Score)
            .ToList();

            // Pick the best message that isn't too similar to already-selected ones
            foreach (var candidate in scored)
            {
                var isDuplicate = result.Any(r =>
                    CosineSimilarity(candidate.Embedding, r.Item2) > DeduplicationThreshold)
                    || alreadySelectedEmbeddings.Any(e =>
                    CosineSimilarity(candidate.Embedding, e) > DeduplicationThreshold);

                if (isDuplicate)
                    continue;

                result.Add((
                    new CuratedMessage(
                        candidate.Message.Id,
                        candidate.Message.SenderName,
                        candidate.Message.Content,
                        candidate.Message.Timestamp,
                        candidate.Message.MessageIndex,
                        windowLabel,
                        candidate.Score),
                    candidate.Embedding));
                break;
            }
        }

        return result;
    }

    private static bool HasConversationalContext(
        DecryptedMessage msg, IReadOnlyList<DecryptedMessage> allMessages)
    {
        var idx = msg.MessageIndex;

        for (var offset = -2; offset <= 2; offset++)
        {
            if (offset == 0) continue;

            var neighbor = allMessages.FirstOrDefault(m => m.MessageIndex == idx + offset);
            if (neighbor != null && neighbor.SenderName != msg.SenderName)
                return true;
        }

        return false;
    }

    private static (int[] Assignments, float[][] Centroids) KMeans(float[][] embeddings, int k)
    {
        var n = embeddings.Length;
        var dims = embeddings[0].Length;

        // Initialize centroids using k-means++ style: spread initial picks
        var centroids = new float[k][];
        var rng = new Random(42); // deterministic for reproducibility
        centroids[0] = (float[])embeddings[rng.Next(n)].Clone();

        for (var c = 1; c < k; c++)
        {
            var distances = new float[n];
            for (var i = 0; i < n; i++)
            {
                var minDist = float.MaxValue;
                for (var j = 0; j < c; j++)
                {
                    var dist = 1f - CosineSimilarity(embeddings[i], centroids[j]);
                    minDist = Math.Min(minDist, dist);
                }
                distances[i] = minDist * minDist;
            }

            var totalDist = distances.Sum();
            var threshold = rng.NextSingle() * totalDist;
            var cumulative = 0f;
            for (var i = 0; i < n; i++)
            {
                cumulative += distances[i];
                if (cumulative >= threshold)
                {
                    centroids[c] = (float[])embeddings[i].Clone();
                    break;
                }
            }

            centroids[c] ??= (float[])embeddings[rng.Next(n)].Clone();
        }

        // Iterate
        var assignments = new int[n];
        for (var iter = 0; iter < KMeansMaxIterations; iter++)
        {
            // Assign
            var changed = false;
            for (var i = 0; i < n; i++)
            {
                var bestCluster = 0;
                var bestSim = float.MinValue;
                for (var c = 0; c < k; c++)
                {
                    var sim = CosineSimilarity(embeddings[i], centroids[c]);
                    if (sim > bestSim)
                    {
                        bestSim = sim;
                        bestCluster = c;
                    }
                }

                if (assignments[i] != bestCluster)
                {
                    assignments[i] = bestCluster;
                    changed = true;
                }
            }

            if (!changed) break;

            // Update centroids
            for (var c = 0; c < k; c++)
            {
                var members = new List<int>();
                for (var i = 0; i < n; i++)
                {
                    if (assignments[i] == c)
                        members.Add(i);
                }

                if (members.Count > 0)
                    centroids[c] = ComputeCentroid(embeddings, members);
            }
        }

        return (assignments, centroids);
    }

    private static float[] ComputeCentroid(float[][] embeddings, List<int> indices)
    {
        var dims = embeddings[0].Length;
        var centroid = new float[dims];

        foreach (var idx in indices)
        {
            for (var d = 0; d < dims; d++)
                centroid[d] += embeddings[idx][d];
        }

        for (var d = 0; d < dims; d++)
            centroid[d] /= indices.Count;

        // L2 normalize
        var norm = 0f;
        for (var d = 0; d < dims; d++)
            norm += centroid[d] * centroid[d];
        norm = MathF.Sqrt(norm);

        if (norm > 0)
        {
            for (var d = 0; d < dims; d++)
                centroid[d] /= norm;
        }

        return centroid;
    }

    internal static float CosineSimilarity(float[] a, float[] b)
    {
        var dot = 0f;
        var normA = 0f;
        var normB = 0f;

        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        var denom = MathF.Sqrt(normA) * MathF.Sqrt(normB);
        return denom > 0 ? dot / denom : 0f;
    }

    private static IReadOnlyList<CommunicationGap> DetectGaps(IReadOnlyList<DecryptedMessage> messages)
    {
        var gaps = new List<CommunicationGap>();
        for (var i = 1; i < messages.Count; i++)
        {
            var gap = messages[i].Timestamp - messages[i - 1].Timestamp;
            if (gap.TotalDays >= 7)
            {
                gaps.Add(new CommunicationGap(
                    messages[i - 1].Timestamp,
                    messages[i].Timestamp,
                    gap));
            }
        }
        return gaps;
    }

    private static IReadOnlyList<CommunicationGap> DetectGapsFromWindows(List<TimeWindow> windows)
    {
        var gaps = new List<CommunicationGap>();
        DateTimeOffset? lastNonEmptyEnd = null;

        foreach (var window in windows)
        {
            if (window.Messages.Count > 0)
            {
                if (lastNonEmptyEnd.HasValue)
                {
                    var gap = window.Start - lastNonEmptyEnd.Value;
                    if (gap.TotalDays >= 7)
                    {
                        gaps.Add(new CommunicationGap(lastNonEmptyEnd.Value, window.Start, gap));
                    }
                }
                lastNonEmptyEnd = window.End;
            }
        }

        return gaps;
    }

    private static string FormatTimeWindow(DateTimeOffset timestamp)
    {
        var weekStart = timestamp.AddDays(-(int)timestamp.DayOfWeek);
        var weekEnd = weekStart.AddDays(6);
        return $"{weekStart:yyyy-MM-dd} to {weekEnd:yyyy-MM-dd}";
    }

    private sealed record TimeWindow(
        DateTimeOffset Start,
        DateTimeOffset End,
        string Label,
        IReadOnlyList<DecryptedMessage> Messages);
}
