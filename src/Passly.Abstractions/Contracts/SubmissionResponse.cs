namespace Passly.Abstractions.Contracts;

public sealed record SubmissionResponse(
    Guid Id,
    string Label,
    string Status,
    string CurrentStep,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
