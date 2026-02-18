namespace Passly.Abstractions.Contracts;

public sealed record ChatImportSummaryResponse(
    Guid Id,
    Guid SubmissionId,
    string FileName,
    string ContentType,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
