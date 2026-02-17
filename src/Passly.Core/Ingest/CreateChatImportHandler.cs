using System.Security.Cryptography;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Passly.Persistence.Models.Ingest;
using Microsoft.EntityFrameworkCore;

namespace Passly.Core.Ingest;

public sealed class CreateChatImportHandler(
    IngestDbContext db,
    IEncryptionService encryption,
    IClock clock)
{
    public async Task<(CreateChatImportResponse? Response, bool IsDuplicate)> HandleAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string deviceId,
        string passphrase,
        CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        await fileStream.CopyToAsync(ms, ct);
        var rawContent = ms.ToArray();

        var fileHash = Convert.ToHexString(SHA256.HashData(rawContent)).ToLowerInvariant();

        var exists = await db.ChatImports
            .AnyAsync(c => c.DeviceId == deviceId && c.FileHash == fileHash, ct);

        if (exists)
            return (null, true);

        var result = encryption.Encrypt(rawContent, passphrase);
        var now = clock.UtcNow;

        var entity = new ChatImport
        {
            Id = Guid.NewGuid(),
            DeviceId = deviceId,
            FileName = fileName,
            FileHash = fileHash,
            ContentType = contentType,
            Status = ChatImportStatus.Pending,
            EncryptedRawContent = result.Ciphertext,
            Salt = result.Salt,
            Iv = result.Iv,
            Tag = result.Tag,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.ChatImports.Add(entity);
        await db.SaveChangesAsync(ct);

        return (new CreateChatImportResponse(entity.Id, entity.FileName, entity.Status.ToString(), entity.CreatedAt), false);
    }
}
