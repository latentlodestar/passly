using Passly.Abstractions.Contracts;

namespace Passly.Persistence.Models.Modeling;

public sealed class Submission
{
    public Guid Id { get; set; }
    public required string DeviceId { get; set; }
    public required string Label { get; set; }
    public SubmissionStatus Status { get; set; }
    public SubmissionStep CurrentStep { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public SubmissionSummary? Summary { get; set; }
}
