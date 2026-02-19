using Passly.Abstractions.Contracts;
using Passly.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Passly.Core.Submissions;

public sealed class GetSubmissionHandler(AppDbContext db)
{
    public async Task<SubmissionResponse?> HandleAsync(
        Guid id,
        string deviceId,
        CancellationToken ct = default)
    {
        return await db.Submissions
            .Where(s => s.Id == id && s.DeviceId == deviceId)
            .Select(s => new SubmissionResponse(
                s.Id,
                s.Label,
                s.Status.ToString(),
                s.CurrentStep.ToString(),
                s.CreatedAt,
                s.UpdatedAt))
            .FirstOrDefaultAsync(ct);
    }
}
