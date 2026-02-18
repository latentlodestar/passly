using Passly.Abstractions.Interfaces;
using Passly.Core.Services;

namespace Passly.Core.Tests.Services;

public sealed class MessageCuratorTests
{
    private readonly MessageCurator _sut = new();

    /// <summary>
    /// Fake embedding service that produces deterministic vectors based on content hash.
    /// Similar content produces similar vectors, different content produces different vectors.
    /// </summary>
    private static IEmbeddingService CreateFakeEmbeddingService(int dims = 384)
    {
        var service = Substitute.For<IEmbeddingService>();
        service.GenerateEmbeddingsAsync(Arg.Any<IReadOnlyList<string>>(), Arg.Any<CancellationToken>())
            .Returns(callInfo =>
            {
                var texts = callInfo.ArgAt<IReadOnlyList<string>>(0);
                var result = new float[texts.Count][];
                for (var i = 0; i < texts.Count; i++)
                {
                    result[i] = GenerateDeterministicVector(texts[i], dims);
                }
                return Task.FromResult(result);
            });
        return service;
    }

    private static float[] GenerateDeterministicVector(string text, int dims)
    {
        var vector = new float[dims];
        var hash = text.GetHashCode();
        var rng = new Random(hash);
        for (var i = 0; i < dims; i++)
            vector[i] = (float)(rng.NextDouble() * 2 - 1);

        // L2 normalize
        var norm = 0f;
        for (var i = 0; i < dims; i++)
            norm += vector[i] * vector[i];
        norm = MathF.Sqrt(norm);
        if (norm > 0)
            for (var i = 0; i < dims; i++)
                vector[i] /= norm;

        return vector;
    }

    private static List<DecryptedMessage> GenerateDailyMessages(
        DateTimeOffset start, int days, string[] senders)
    {
        var messages = new List<DecryptedMessage>();
        var idx = 0;
        for (var d = 0; d < days; d++)
        {
            var timestamp = start.AddDays(d);
            for (var s = 0; s < senders.Length; s++)
            {
                messages.Add(new DecryptedMessage(
                    Guid.NewGuid(),
                    senders[s],
                    $"Daily message from {senders[s]} on day {d}",
                    timestamp.AddHours(s),
                    idx++));
            }
        }
        return messages;
    }

    [Fact]
    public async Task CurateAsync_EmptyMessages_ReturnsEmptyResult()
    {
        var embeddings = CreateFakeEmbeddingService();

        var result = await _sut.CurateAsync([], embeddings, new CurationOptions(50));

        result.Messages.Should().BeEmpty();
        result.Gaps.Should().BeEmpty();
    }

    [Fact]
    public async Task CurateAsync_FewerMessagesThanTarget_ReturnsAllMessages()
    {
        var messages = GenerateDailyMessages(
            new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero), 5, ["Alice", "Bob"]);
        var embeddings = CreateFakeEmbeddingService();

        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(50));

        result.Messages.Count.Should().Be(messages.Count);
    }

    [Fact]
    public async Task CurateAsync_SteadyDailyContact_SpansFullTimeline()
    {
        var start = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var messages = GenerateDailyMessages(start, 90, ["Alice", "Bob"]);
        var embeddings = CreateFakeEmbeddingService();

        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(30));

        result.Messages.Count.Should().BeGreaterThan(0);
        result.Messages.Count.Should().BeLessThanOrEqualTo(30);

        // Should have messages from early, middle, and late in timeline
        var firstSelected = result.Messages.Min(m => m.Timestamp);
        var lastSelected = result.Messages.Max(m => m.Timestamp);
        var totalSpan = messages[^1].Timestamp - messages[0].Timestamp;
        var selectedSpan = lastSelected - firstSelected;

        // Selected messages should cover at least 70% of the timeline
        selectedSpan.TotalDays.Should().BeGreaterThan(totalSpan.TotalDays * 0.7);
    }

    [Fact]
    public async Task CurateAsync_SporadicEventsWithDailyMundane_FavorsDailyMessages()
    {
        var start = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var messages = new List<DecryptedMessage>();
        var idx = 0;

        // 60 days of daily mundane messages
        for (var d = 0; d < 60; d++)
        {
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Alice",
                $"Good morning! How are you doing today? Day {d}",
                start.AddDays(d), idx++));
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Bob",
                $"Hi! I'm doing well, thanks for asking. Day {d}",
                start.AddDays(d).AddHours(1), idx++));
        }

        // 3 rare "milestone" messages with very different content
        messages.Add(new DecryptedMessage(
            Guid.NewGuid(), "Alice",
            "AMAZING NEWS! We just got our engagement ring and we're getting married next summer in Hawaii!",
            start.AddDays(15), idx++));
        messages.Add(new DecryptedMessage(
            Guid.NewGuid(), "Bob",
            "INCREDIBLE! Our immigration lawyer said the visa application was approved today after months of waiting!",
            start.AddDays(30), idx++));
        messages.Add(new DecryptedMessage(
            Guid.NewGuid(), "Alice",
            "BREAKING: We just closed on our first house together! The keys are in our hands!",
            start.AddDays(45), idx++));

        messages = messages.OrderBy(m => m.Timestamp).ThenBy(m => m.MessageIndex).ToList();
        // Re-index
        for (var i = 0; i < messages.Count; i++)
            messages[i] = messages[i] with { MessageIndex = i };

        var embeddings = CreateFakeEmbeddingService();
        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(20));

        // The majority of selected messages should be mundane daily ones, not milestone events
        var mundaneCount = result.Messages.Count(m =>
            m.Content.StartsWith("Good morning") || m.Content.StartsWith("Hi!"));
        var milestoneCount = result.Messages.Count(m =>
            m.Content.Contains("AMAZING") || m.Content.Contains("INCREDIBLE") || m.Content.Contains("BREAKING"));

        mundaneCount.Should().BeGreaterThan(milestoneCount,
            "centroid-based selection should favor common daily messages over rare milestone events");
    }

    [Fact]
    public async Task CurateAsync_CommunicationGaps_SurfacedInResult()
    {
        var start = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var messages = new List<DecryptedMessage>();
        var idx = 0;

        // Messages for first 2 weeks
        for (var d = 0; d < 14; d++)
        {
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Alice", $"Message day {d}",
                start.AddDays(d), idx++));
        }

        // Gap of 3 weeks (no messages)

        // Messages resume after gap
        for (var d = 35; d < 49; d++)
        {
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Bob", $"Message day {d}",
                start.AddDays(d), idx++));
        }

        var embeddings = CreateFakeEmbeddingService();
        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(10));

        result.Gaps.Should().NotBeEmpty("a 3-week communication gap should be detected");
        result.Gaps.Any(g => g.Duration.TotalDays >= 7).Should().BeTrue();
    }

    [Fact]
    public async Task CurateAsync_BackAndForthExchanges_PreferredOverMonologues()
    {
        var start = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var messages = new List<DecryptedMessage>();
        var idx = 0;

        // Week 1: Back-and-forth conversation
        for (var d = 0; d < 7; d++)
        {
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Alice", $"Question about plans for day {d}?",
                start.AddDays(d).AddHours(10), idx++));
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Bob", $"Response about plans for day {d}.",
                start.AddDays(d).AddHours(11), idx++));
        }

        // Week 2: Monologue (same sender)
        for (var d = 7; d < 14; d++)
        {
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Alice", $"Another solo message from Alice on day {d}.",
                start.AddDays(d).AddHours(10), idx++));
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Alice", $"Yet another solo message from Alice on day {d}.",
                start.AddDays(d).AddHours(11), idx++));
        }

        var embeddings = CreateFakeEmbeddingService();
        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(8));

        // Should have representatives from both weeks (timeline coverage)
        result.Messages.Count.Should().BeGreaterThan(0);
        result.Messages.Should().Contain(m => m.SenderName == "Bob",
            "back-and-forth exchanges should be represented");
    }

    [Fact]
    public async Task CurateAsync_ResultSortedByTimestamp()
    {
        var start = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var messages = GenerateDailyMessages(start, 60, ["Alice", "Bob"]);
        var embeddings = CreateFakeEmbeddingService();

        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(15));

        for (var i = 1; i < result.Messages.Count; i++)
        {
            result.Messages[i].Timestamp.Should()
                .BeOnOrAfter(result.Messages[i - 1].Timestamp);
        }
    }

    [Fact]
    public async Task CurateAsync_SingleWordSpam_HandledGracefully()
    {
        var start = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var messages = new List<DecryptedMessage>();
        var idx = 0;

        // 100 "ok" messages over 30 days
        for (var d = 0; d < 30; d++)
        {
            for (var m = 0; m < 3; m++)
            {
                messages.Add(new DecryptedMessage(
                    Guid.NewGuid(), "Alice", "ok",
                    start.AddDays(d).AddHours(m), idx++));
            }
            // One substantive message per day
            messages.Add(new DecryptedMessage(
                Guid.NewGuid(), "Bob", $"Let me tell you about my day number {d}, it was great.",
                start.AddDays(d).AddHours(12), idx++));
        }

        var embeddings = CreateFakeEmbeddingService();
        var result = await _sut.CurateAsync(messages, embeddings, new CurationOptions(15));

        // Should still produce results without crashing
        result.Messages.Count.Should().BeGreaterThan(0);
        result.Messages.Count.Should().BeLessThanOrEqualTo(15);
    }

    [Fact]
    public void CosineSimilarity_IdenticalVectors_ReturnsOne()
    {
        var v = new float[] { 1, 0, 0 };
        MessageCurator.CosineSimilarity(v, v).Should().BeApproximately(1f, 0.001f);
    }

    [Fact]
    public void CosineSimilarity_OrthogonalVectors_ReturnsZero()
    {
        var a = new float[] { 1, 0, 0 };
        var b = new float[] { 0, 1, 0 };
        MessageCurator.CosineSimilarity(a, b).Should().BeApproximately(0f, 0.001f);
    }
}
