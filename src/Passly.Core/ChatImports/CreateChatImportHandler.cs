using System.Security.Cryptography;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Passly.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Passly.Core.ChatImports;

public sealed class CreateChatImportHandler(
    AppDbContext db,
    IEncryptionService encryption,
    IClock clock)
{
    public async Task<(CreateChatImportResponse? Response, bool IsDuplicate, string? Error)> HandleAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string deviceId,
        Guid submissionId,
        string passphrase,
        CancellationToken ct = default)
    {
        var submissionExists = await db.Submissions
            .AnyAsync(s => s.Id == submissionId && s.DeviceId == deviceId, ct);

        if (!submissionExists)
            return (null, false, "Submission not found.");

        using var ms = new MemoryStream();
        await fileStream.CopyToAsync(ms, ct);
        var rawContent = ms.ToArray();

        var fileHash = Convert.ToHexString(SHA256.HashData(rawContent)).ToLowerInvariant();

        var exists = await db.ChatImports
            .AnyAsync(c => c.DeviceId == deviceId && c.FileHash == fileHash, ct);

        if (exists)
            return (null, true, null);

        var result = encryption.Encrypt(rawContent, passphrase);
        var now = clock.UtcNow;

        var entity = new ChatImport
        {
            Id = Guid.NewGuid(),
            DeviceId = deviceId,
            SubmissionId = submissionId,
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

        return (new CreateChatImportResponse(entity.Id, entity.FileName, entity.Status.ToString(), entity.CreatedAt), false, null);
    }
}
