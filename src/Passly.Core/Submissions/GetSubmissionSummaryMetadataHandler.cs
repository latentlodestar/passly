using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Persistence;

namespace Passly.Core.Submissions;

public sealed class GetSubmissionSummaryMetadataHandler(AppDbContext db)
{
    public async Task<SubmissionSummaryResponse?> HandleAsync(
        Guid submissionId,
        string userId,
        CancellationToken ct = default)
    {
        return await db.Submissions
            .Where(s => s.Id == submissionId && s.UserId == userId)
            .Select(s => s.Summary)
            .Where(ss => ss != null)
            .Select(ss => new SubmissionSummaryResponse(
                ss!.Id,
                ss.SubmissionId,
                ss.ChatImportId,
                ss.TotalMessages,
                ss.SelectedMessages,
                ss.GapCount,
                ss.HasPdf,
                ss.HasSignature,
                ss.CreatedAt))
            .FirstOrDefaultAsync(ct);
    }
}
