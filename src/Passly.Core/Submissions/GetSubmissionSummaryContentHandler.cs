using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;

namespace Passly.Core.Submissions;

public sealed class GetSubmissionSummaryContentHandler(
    AppDbContext db,
    IEncryptionService encryption)
{
    public async Task<(SummaryContentResponse? Content, GetSubmissionSummaryError? Error)> HandleAsync(
        Guid submissionId,
        string userId,
        string passphrase,
        CancellationToken ct = default)
    {
        var submission = await db.Submissions
            .Include(s => s.Summary)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.UserId == userId, ct);

        if (submission is null)
            return (null, GetSubmissionSummaryError.SubmissionNotFound);

        if (submission.Summary is null)
            return (null, GetSubmissionSummaryError.SummaryNotFound);

        var summary = submission.Summary;

        byte[] contentBytes;
        try
        {
            contentBytes = encryption.Decrypt(
                summary.EncryptedContent, passphrase,
                summary.ContentSalt, summary.ContentIv, summary.ContentTag);
        }
        catch (AuthenticationTagMismatchException)
        {
            return (null, GetSubmissionSummaryError.WrongPassphrase);
        }

        var content = JsonSerializer.Deserialize<SummaryContentResponse>(contentBytes);
        return (content, null);
    }
}
