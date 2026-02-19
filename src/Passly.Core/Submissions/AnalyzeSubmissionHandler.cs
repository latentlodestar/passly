using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Submissions;

public sealed class AnalyzeSubmissionHandler(
    AppDbContext db,
    IEncryptionService encryption,
    IMessageCurator curator,
    IClock clock)
{
    public async Task<(SubmissionSummaryResponse? Response, AnalyzeSubmissionError? Error)> HandleAsync(
        Guid submissionId,
        AnalyzeSubmissionRequest request,
        CancellationToken ct = default)
    {
        var submission = await db.Submissions
            .Include(s => s.Summary)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.DeviceId == request.DeviceId, ct);

        if (submission is null)
            return (null, AnalyzeSubmissionError.SubmissionNotFound);

        if (submission.Summary is not null)
            return (null, AnalyzeSubmissionError.AnalysisAlreadyExists);

        var import = await db.ChatImports
            .Where(c => c.Id == request.ChatImportId && c.DeviceId == request.DeviceId)
            .Select(c => new { c.Id, c.Status })
            .FirstOrDefaultAsync(ct);

        if (import is null)
            return (null, AnalyzeSubmissionError.ImportNotFound);

        if (import.Status != ChatImportStatus.Parsed)
            return (null, AnalyzeSubmissionError.ImportNotParsed);

        // Decrypt messages
        var encryptedMessages = await db.ChatMessages
            .Include(m => m.Embedding)
            .Where(m => m.ChatImportId == request.ChatImportId)
            .OrderBy(m => m.MessageIndex)
            .ToListAsync(ct);

        var decrypted = new List<DecryptedMessage>(encryptedMessages.Count);
        var precomputedEmbeddings = new float[encryptedMessages.Count][];

        for (var i = 0; i < encryptedMessages.Count; i++)
        {
            var msg = encryptedMessages[i];
            var decryptedBytes = encryption.Decrypt(
                msg.EncryptedContent, request.Passphrase, msg.Salt, msg.Iv, msg.Tag);
            var payload = JsonSerializer.Deserialize<MessagePayload>(
                Encoding.UTF8.GetString(decryptedBytes));

            decrypted.Add(new DecryptedMessage(
                msg.Id,
                payload?.SenderName ?? "",
                payload?.Content ?? "",
                msg.Timestamp,
                msg.MessageIndex));

            precomputedEmbeddings[i] = msg.Embedding!.Embedding.ToArray();
        }

        // Curate messages
        var curationResult = await curator.CurateAsync(
            decrypted, precomputedEmbeddings, new CurationOptions(200), ct);

        // Build structured content
        var messageCountByWindow = curationResult.Messages
            .GroupBy(m => m.TimeWindow)
            .ToDictionary(g => g.Key, g => g.Count());

        var contentResponse = new SummaryContentResponse(
            submission.Label,
            decrypted.Count > 0 ? decrypted[0].Timestamp : clock.UtcNow,
            decrypted.Count > 0 ? decrypted[^1].Timestamp : clock.UtcNow,
            decrypted.Count,
            curationResult.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new SummaryMessageResponse(
                    m.SenderName, m.Content, m.Timestamp, m.TimeWindow))
                .ToList(),
            curationResult.Gaps
                .OrderBy(g => g.Start)
                .Select(g => new SummaryGapResponse(g.Start, g.End, g.Duration.Days))
                .ToList(),
            messageCountByWindow);

        var contentJson = JsonSerializer.SerializeToUtf8Bytes(contentResponse);
        var contentEncResult = encryption.Encrypt(contentJson, request.Passphrase);

        var summary = new SubmissionSummary
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            ChatImportId = request.ChatImportId,
            EncryptedContent = contentEncResult.Ciphertext,
            ContentSalt = contentEncResult.Salt,
            ContentIv = contentEncResult.Iv,
            ContentTag = contentEncResult.Tag,
            TotalMessages = decrypted.Count,
            SelectedMessages = curationResult.Messages.Count,
            GapCount = curationResult.Gaps.Count,
            CreatedAt = clock.UtcNow,
        };

        db.SubmissionSummaries.Add(summary);
        await db.SaveChangesAsync(ct);

        return (ToResponse(summary), null);
    }

    internal static SubmissionSummaryResponse ToResponse(SubmissionSummary entity) =>
        new(entity.Id, entity.SubmissionId, entity.ChatImportId,
            entity.TotalMessages, entity.SelectedMessages, entity.GapCount,
            entity.HasPdf, entity.HasSignature, entity.CreatedAt);

    private sealed record MessagePayload(string SenderName, string Content);
}

public sealed record AnalyzeSubmissionRequest(string DeviceId, string Passphrase, Guid ChatImportId);

public enum AnalyzeSubmissionError
{
    SubmissionNotFound,
    AnalysisAlreadyExists,
    ImportNotFound,
    ImportNotParsed,
}
