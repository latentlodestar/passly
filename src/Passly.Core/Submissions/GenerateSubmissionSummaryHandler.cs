using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Submissions;

public sealed class GenerateSubmissionSummaryHandler(
    AppDbContext db,
    IEncryptionService encryption,
    IEmbeddingService embeddings,
    IMessageCurator curator,
    ISummaryPdfGenerator pdfGenerator,
    IClock clock)
{
    public async Task<(SubmissionSummaryResponse? Response, GenerateSubmissionSummaryError? Error)> HandleAsync(
        Guid submissionId,
        GenerateSubmissionSummaryRequest request,
        CancellationToken ct = default)
    {
        var submission = await db.Submissions
            .Include(s => s.Summary)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.DeviceId == request.DeviceId, ct);

        if (submission is null)
            return (null, GenerateSubmissionSummaryError.SubmissionNotFound);

        if (submission.Summary is not null)
            return (null, GenerateSubmissionSummaryError.SummaryAlreadyExists);

        var import = await db.ChatImports
            .Where(c => c.Id == request.ChatImportId && c.DeviceId == request.DeviceId)
            .Select(c => new { c.Id, c.Status })
            .FirstOrDefaultAsync(ct);

        if (import is null)
            return (null, GenerateSubmissionSummaryError.ImportNotFound);

        if (import.Status != ChatImportStatus.Parsed)
            return (null, GenerateSubmissionSummaryError.ImportNotParsed);

        // Decrypt messages
        var encryptedMessages = await db.ChatMessages
            .Where(m => m.ChatImportId == request.ChatImportId)
            .OrderBy(m => m.MessageIndex)
            .ToListAsync(ct);

        var decrypted = new List<DecryptedMessage>(encryptedMessages.Count);

        foreach (var msg in encryptedMessages)
        {
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
        }

        // Curate messages
        var curationResult = await curator.CurateAsync(
            decrypted, embeddings, new CurationOptions(200), ct);

        // Build PDF data
        var messageCountByWindow = curationResult.Messages
            .GroupBy(m => m.TimeWindow)
            .ToDictionary(g => g.Key, g => g.Count());

        var pdfData = new SummaryPdfData(
            submission.Label,
            decrypted.Count > 0 ? decrypted[0].Timestamp : clock.UtcNow,
            decrypted.Count > 0 ? decrypted[^1].Timestamp : clock.UtcNow,
            decrypted.Count,
            curationResult.Messages,
            curationResult.Gaps,
            messageCountByWindow);

        var pdfBytes = pdfGenerator.Generate(pdfData);

        // Encrypt PDF
        var encResult = encryption.Encrypt(pdfBytes, request.Passphrase);

        var summary = new SubmissionSummary
        {
            Id = Guid.NewGuid(),
            SubmissionId = submissionId,
            ChatImportId = request.ChatImportId,
            EncryptedPdf = encResult.Ciphertext,
            Salt = encResult.Salt,
            Iv = encResult.Iv,
            Tag = encResult.Tag,
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
            entity.TotalMessages, entity.SelectedMessages, entity.GapCount, entity.CreatedAt);

    private sealed record MessagePayload(string SenderName, string Content);
}

public enum GenerateSubmissionSummaryError
{
    SubmissionNotFound,
    SummaryAlreadyExists,
    ImportNotFound,
    ImportNotParsed,
}
