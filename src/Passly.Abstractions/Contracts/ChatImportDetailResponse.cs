namespace Passly.Abstractions.Contracts;

public sealed record ChatImportDetailResponse(
    Guid Id,
    string FileName,
    string ContentType,
    string Status,
    int TotalMessages,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<ChatMessageResponse> Messages);
