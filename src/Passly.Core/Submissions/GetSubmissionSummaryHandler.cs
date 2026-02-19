using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;

namespace Passly.Core.Submissions;

public sealed class GetSubmissionSummaryHandler(
    AppDbContext db,
    IEncryptionService encryption)
{
    public async Task<(byte[]? PdfBytes, SubmissionSummaryResponse? Metadata, GetSubmissionSummaryError? Error)> HandleAsync(
        Guid submissionId,
        string deviceId,
        string passphrase,
        CancellationToken ct = default)
    {
        var submission = await db.Submissions
            .Include(s => s.Summary)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.DeviceId == deviceId, ct);

        if (submission is null)
            return (null, null, GetSubmissionSummaryError.SubmissionNotFound);

        if (submission.Summary is null)
            return (null, null, GetSubmissionSummaryError.SummaryNotFound);

        var summary = submission.Summary;

        byte[] pdfBytes;
        try
        {
            pdfBytes = encryption.Decrypt(
                summary.EncryptedPdf, passphrase, summary.Salt, summary.Iv, summary.Tag);
        }
        catch (AuthenticationTagMismatchException)
        {
            return (null, null, GetSubmissionSummaryError.WrongPassphrase);
        }

        return (pdfBytes, GenerateSubmissionSummaryHandler.ToResponse(summary), null);
    }
}

public enum GetSubmissionSummaryError
{
    SubmissionNotFound,
    SummaryNotFound,
    WrongPassphrase,
}
