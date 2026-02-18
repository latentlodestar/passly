using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Persistence;

namespace Passly.Core.Modeling;

public sealed class GetSubmissionSummaryMetadataHandler(AppDbContext db)
{
    public async Task<SubmissionSummaryResponse?> HandleAsync(
        Guid submissionId,
        string deviceId,
        CancellationToken ct = default)
    {
        return await db.Submissions
            .Where(s => s.Id == submissionId && s.DeviceId == deviceId)
            .Select(s => s.Summary)
            .Where(ss => ss != null)
            .Select(ss => new SubmissionSummaryResponse(
                ss!.Id,
                ss.SubmissionId,
                ss.ChatImportId,
                ss.TotalMessages,
                ss.SelectedMessages,
                ss.GapCount,
                ss.CreatedAt))
            .FirstOrDefaultAsync(ct);
    }
}
