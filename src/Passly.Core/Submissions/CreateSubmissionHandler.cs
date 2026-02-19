using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Submissions;

public sealed class CreateSubmissionHandler(AppDbContext db, IClock clock)
{
    public async Task<SubmissionResponse> HandleAsync(
        CreateSubmissionRequest request,
        CancellationToken ct = default)
    {
        var now = clock.UtcNow;

        var entity = new Submission
        {
            Id = Guid.NewGuid(),
            DeviceId = request.DeviceId,
            Label = request.Label,
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Submissions.Add(entity);
        await db.SaveChangesAsync(ct);

        return ToResponse(entity);
    }

    internal static SubmissionResponse ToResponse(Submission entity) =>
        new(entity.Id, entity.Label, entity.Status.ToString(), entity.CurrentStep.ToString(), entity.CreatedAt, entity.UpdatedAt);
}
