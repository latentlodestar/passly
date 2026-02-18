using Passly.Abstractions.Contracts;
using Passly.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Passly.Core.Modeling;

public sealed class GetSubmissionsHandler(AppDbContext db)
{
    public async Task<IReadOnlyList<SubmissionResponse>> HandleAsync(
        string deviceId,
        CancellationToken ct = default)
    {
        return await db.Submissions
            .Where(s => s.DeviceId == deviceId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SubmissionResponse(
                s.Id,
                s.Label,
                s.Status.ToString(),
                s.CurrentStep.ToString(),
                s.CreatedAt,
                s.UpdatedAt))
            .ToListAsync(ct);
    }
}
