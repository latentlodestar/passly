namespace Passly.Abstractions.Contracts;

public sealed record SummaryContentResponse(
    string SubmissionLabel,
    DateTimeOffset EarliestMessage,
    DateTimeOffset LatestMessage,
    int TotalMessages,
    IReadOnlyList<SummaryMessageResponse> RepresentativeMessages,
    IReadOnlyList<SummaryGapResponse> Gaps,
    IReadOnlyDictionary<string, int> MessageCountByTimeWindow);

public sealed record SummaryMessageResponse(
    string SenderName,
    string Content,
    DateTimeOffset Timestamp,
    string TimeWindow);

public sealed record SummaryGapResponse(
    DateTimeOffset Start,
    DateTimeOffset End,
    int DurationDays);
