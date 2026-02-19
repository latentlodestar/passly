using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.ChatImports;

public sealed class ParseChatImportHandler(
    AppDbContext db,
    IEncryptionService encryption,
    WhatsAppChatParser parser,
    IClock clock,
    ILogger<ParseChatImportHandler> logger)
{
    public async Task HandleAsync(Guid chatImportId, string passphrase, CancellationToken ct = default)
    {
        var import = await db.ChatImports
            .FirstOrDefaultAsync(c => c.Id == chatImportId, ct);

        if (import is null)
        {
            logger.LogWarning("ChatImport {ChatImportId} not found", chatImportId);
            return;
        }

        if (import.Status != ChatImportStatus.Pending)
        {
            logger.LogWarning("ChatImport {ChatImportId} has status {Status}, expected Pending", chatImportId, import.Status);
            return;
        }

        import.Status = ChatImportStatus.Parsing;
        import.UpdatedAt = clock.UtcNow;
        await db.SaveChangesAsync(ct);

        try
        {
            var rawBytes = encryption.Decrypt(import.EncryptedRawContent, passphrase, import.Salt, import.Iv, import.Tag);
            var rawContent = Encoding.UTF8.GetString(rawBytes);

            var messages = parser.Parse(rawContent);

            logger.LogInformation("Parsed {MessageCount} messages from ChatImport {ChatImportId}", messages.Count, chatImportId);

            var now = clock.UtcNow;

            foreach (var msg in messages)
            {
                var payload = JsonSerializer.Serialize(new { msg.SenderName, msg.Content });
                var payloadBytes = Encoding.UTF8.GetBytes(payload);
                var result = encryption.Encrypt(payloadBytes, passphrase);

                var entity = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    ChatImportId = chatImportId,
                    EncryptedSenderName = [],
                    EncryptedContent = result.Ciphertext,
                    Salt = result.Salt,
                    Iv = result.Iv,
                    Tag = result.Tag,
                    Timestamp = msg.Timestamp,
                    MessageIndex = msg.MessageIndex,
                    CreatedAt = now,
                };

                db.ChatMessages.Add(entity);
            }

            import.Status = ChatImportStatus.Parsed;
            import.UpdatedAt = clock.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse ChatImport {ChatImportId}", chatImportId);

            db.ChangeTracker.Clear();
            import = await db.ChatImports.FirstAsync(c => c.Id == chatImportId, ct);
            import.Status = ChatImportStatus.Failed;
            import.UpdatedAt = clock.UtcNow;
            await db.SaveChangesAsync(ct);

            throw;
        }
    }
}
