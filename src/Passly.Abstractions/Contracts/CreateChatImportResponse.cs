namespace Passly.Abstractions.Contracts;

public sealed record CreateChatImportResponse(
    Guid Id,
    string FileName,
    string Status,
    DateTimeOffset CreatedAt);
