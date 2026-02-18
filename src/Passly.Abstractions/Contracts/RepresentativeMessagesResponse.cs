namespace Passly.Abstractions.Contracts;

public sealed record RepresentativeMessagesResponse(
    Guid ChatImportId,
    int TotalMessages,
    int SelectedCount,
    IReadOnlyList<CuratedMessageResponse> Messages,
    IReadOnlyList<CommunicationGapResponse> Gaps);

public sealed record CuratedMessageResponse(
    string Id,
    string SenderName,
    string Content,
    string Timestamp,
    int MessageIndex,
    string TimeWindow,
    float RepresentativenessScore);

public sealed record CommunicationGapResponse(
    string Start,
    string End,
    string Duration);
