namespace Passly.Abstractions.Interfaces;

public interface ISummaryPdfGenerator
{
    byte[] Generate(SummaryPdfData data);
}

public sealed record SummaryPdfData(
    string SubmissionLabel,
    DateTimeOffset EarliestMessage,
    DateTimeOffset LatestMessage,
    int TotalMessages,
    IReadOnlyList<CuratedMessage> RepresentativeMessages,
    IReadOnlyList<CommunicationGap> Gaps,
    IReadOnlyDictionary<string, int> MessageCountByTimeWindow,
    byte[]? SignatureImageBytes = null);
