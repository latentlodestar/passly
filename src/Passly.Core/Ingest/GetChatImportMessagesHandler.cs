using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;

namespace Passly.Core.Ingest;

public sealed class GetChatImportMessagesHandler(
    IngestDbContext db,
    IEncryptionService encryption)
{
    public async Task<ChatImportDetailResponse?> HandleAsync(
        Guid importId,
        string deviceId,
        string passphrase,
        int skip,
        int take,
        CancellationToken ct = default)
    {
        var import = await db.ChatImports
            .Where(c => c.Id == importId && c.DeviceId == deviceId)
            .Select(c => new
            {
                c.Id,
                c.FileName,
                c.ContentType,
                Status = c.Status.ToString(),
                c.CreatedAt,
                c.UpdatedAt,
            })
            .FirstOrDefaultAsync(ct);

        if (import is null)
            return null;

        var totalMessages = await db.ChatMessages
            .CountAsync(m => m.ChatImportId == importId, ct);

        var encryptedMessages = await db.ChatMessages
            .Where(m => m.ChatImportId == importId)
            .OrderBy(m => m.MessageIndex)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);

        var messages = new List<ChatMessageResponse>(encryptedMessages.Count);

        foreach (var msg in encryptedMessages)
        {
            var decryptedBytes = encryption.Decrypt(msg.EncryptedContent, passphrase, msg.Salt, msg.Iv, msg.Tag);
            var payload = JsonSerializer.Deserialize<MessagePayload>(Encoding.UTF8.GetString(decryptedBytes));

            messages.Add(new ChatMessageResponse(
                msg.Id,
                payload?.SenderName ?? "",
                payload?.Content ?? "",
                msg.Timestamp,
                msg.MessageIndex));
        }

        return new ChatImportDetailResponse(
            import.Id,
            import.FileName,
            import.ContentType,
            import.Status,
            totalMessages,
            import.CreatedAt,
            import.UpdatedAt,
            messages);
    }

    private sealed record MessagePayload(string SenderName, string Content);
}
