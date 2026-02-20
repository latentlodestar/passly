using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Passly.Core.Submissions;

public sealed class UpdateSubmissionStepHandler(AppDbContext db, IClock clock)
{
    public async Task<SubmissionResponse?> HandleAsync(
        Guid id,
        string userId,
        UpdateSubmissionStepRequest request,
        CancellationToken ct = default)
    {
        if (!Enum.TryParse<SubmissionStep>(request.CurrentStep, out var step))
            return null;

        var entity = await db.Submissions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct);

        if (entity is null)
            return null;

        entity.CurrentStep = step;
        entity.UpdatedAt = clock.UtcNow;
        await db.SaveChangesAsync(ct);

        return CreateSubmissionHandler.ToResponse(entity);
    }
}
