namespace Passly.Abstractions.Contracts;

public sealed record ChatMessageResponse(
    Guid Id,
    string SenderName,
    string Content,
    DateTimeOffset Timestamp,
    int MessageIndex);
