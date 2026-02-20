using Microsoft.EntityFrameworkCore;
using Passly.Persistence;

namespace Passly.Core.Submissions;

public sealed class DeleteSubmissionHandler(AppDbContext db)
{
    public async Task<bool> HandleAsync(
        Guid id,
        string userId,
        CancellationToken ct = default)
    {
        var submission = await db.Submissions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct);

        if (submission is null)
            return false;

        db.Submissions.Remove(submission);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
