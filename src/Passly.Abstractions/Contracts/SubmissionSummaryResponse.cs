namespace Passly.Abstractions.Contracts;

public sealed record SubmissionSummaryResponse(
    Guid Id,
    Guid SubmissionId,
    Guid ChatImportId,
    int TotalMessages,
    int SelectedMessages,
    int GapCount,
    DateTimeOffset CreatedAt);
