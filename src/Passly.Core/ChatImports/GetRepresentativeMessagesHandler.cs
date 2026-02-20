using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;

namespace Passly.Core.ChatImports;

public sealed class GetRepresentativeMessagesHandler(
    AppDbContext db,
    IEncryptionService encryption,
    IMessageCurator curator)
{
    public async Task<(RepresentativeMessagesResponse? Response, GetRepresentativeMessagesError? Error)> HandleAsync(
        Guid chatImportId,
        string userId,
        string passphrase,
        int targetCount,
        CancellationToken ct = default)
    {
        var import = await db.ChatImports
            .Where(c => c.Id == chatImportId && c.UserId == userId)
            .Select(c => new { c.Id, c.Status })
            .FirstOrDefaultAsync(ct);

        if (import is null)
            return (null, GetRepresentativeMessagesError.NotFound);

        if (import.Status != ChatImportStatus.Parsed)
            return (null, GetRepresentativeMessagesError.NotParsed);

        var encryptedMessages = await db.ChatMessages
            .Include(m => m.Embedding)
            .Where(m => m.ChatImportId == chatImportId)
            .OrderBy(m => m.MessageIndex)
            .ToListAsync(ct);

        var decrypted = new List<DecryptedMessage>(encryptedMessages.Count);
        var precomputedEmbeddings = new float[encryptedMessages.Count][];

        for (var i = 0; i < encryptedMessages.Count; i++)
        {
            var msg = encryptedMessages[i];
            var decryptedBytes = encryption.Decrypt(
                msg.EncryptedContent, passphrase, msg.Salt, msg.Iv, msg.Tag);
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

        var result = await curator.CurateAsync(
            decrypted, precomputedEmbeddings, new CurationOptions(targetCount), ct);

        var response = new RepresentativeMessagesResponse(
            chatImportId,
            encryptedMessages.Count,
            result.Messages.Count,
            result.Messages.Select(m => new CuratedMessageResponse(
                m.Id.ToString(),
                m.SenderName,
                m.Content,
                m.Timestamp.ToString("O"),
                m.MessageIndex,
                m.TimeWindow,
                m.RepresentativenessScore)).ToList(),
            result.Gaps.Select(g => new CommunicationGapResponse(
                g.Start.ToString("O"),
                g.End.ToString("O"),
                g.Duration.ToString())).ToList());

        return (response, null);
    }

    private sealed record MessagePayload(string SenderName, string Content);
}

public enum GetRepresentativeMessagesError
{
    NotFound,
    NotParsed,
}
