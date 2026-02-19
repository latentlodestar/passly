using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;

namespace Passly.Core.Submissions;

public sealed class GenerateSubmissionSummaryHandler(
    AppDbContext db,
    IEncryptionService encryption,
    ISummaryPdfGenerator pdfGenerator)
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

        if (submission.Summary is null)
            return (null, GenerateSubmissionSummaryError.AnalysisNotFound);

        var summary = submission.Summary;

        if (summary.HasPdf)
            return (null, GenerateSubmissionSummaryError.PdfAlreadyExists);

        if (string.IsNullOrWhiteSpace(request.SignatureBase64))
            return (null, GenerateSubmissionSummaryError.SignatureRequired);

        byte[] signatureBytes;
        try
        {
            signatureBytes = Convert.FromBase64String(request.SignatureBase64);
        }
        catch (FormatException)
        {
            return (null, GenerateSubmissionSummaryError.InvalidSignature);
        }

        // Decrypt the stored analysis content
        SummaryContentResponse content;
        try
        {
            var contentBytes = encryption.Decrypt(
                summary.EncryptedContent, request.Passphrase,
                summary.ContentSalt, summary.ContentIv, summary.ContentTag);
            content = JsonSerializer.Deserialize<SummaryContentResponse>(contentBytes)!;
        }
        catch (AuthenticationTagMismatchException)
        {
            return (null, GenerateSubmissionSummaryError.WrongPassphrase);
        }

        // Build PDF data from stored analysis
        var representativeMessages = content.RepresentativeMessages
            .Select(m => new CuratedMessage(
                Guid.Empty, m.SenderName, m.Content, m.Timestamp, 0, m.TimeWindow, 0f))
            .ToList();

        var gaps = content.Gaps
            .Select(g => new CommunicationGap(g.Start, g.End, TimeSpan.FromDays(g.DurationDays)))
            .ToList();

        var pdfData = new SummaryPdfData(
            content.SubmissionLabel,
            content.EarliestMessage,
            content.LatestMessage,
            content.TotalMessages,
            representativeMessages,
            gaps,
            content.MessageCountByTimeWindow,
            signatureBytes);

        var pdfBytes = pdfGenerator.Generate(pdfData);

        // Encrypt and store the PDF
        var encResult = encryption.Encrypt(pdfBytes, request.Passphrase);
        summary.EncryptedPdf = encResult.Ciphertext;
        summary.Salt = encResult.Salt;
        summary.Iv = encResult.Iv;
        summary.Tag = encResult.Tag;

        // Encrypt and store the signature
        var sigEncResult = encryption.Encrypt(signatureBytes, request.Passphrase);
        summary.EncryptedSignature = sigEncResult.Ciphertext;
        summary.SignatureSalt = sigEncResult.Salt;
        summary.SignatureIv = sigEncResult.Iv;
        summary.SignatureTag = sigEncResult.Tag;

        await db.SaveChangesAsync(ct);

        return (AnalyzeSubmissionHandler.ToResponse(summary), null);
    }
}

public enum GenerateSubmissionSummaryError
{
    SubmissionNotFound,
    AnalysisNotFound,
    PdfAlreadyExists,
    WrongPassphrase,
    SignatureRequired,
    InvalidSignature,
}
