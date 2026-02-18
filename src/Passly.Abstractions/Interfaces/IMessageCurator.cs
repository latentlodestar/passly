namespace Passly.Abstractions.Interfaces;

public interface IMessageCurator
{
    Task<CurationResult> CurateAsync(
        IReadOnlyList<DecryptedMessage> messages,
        IEmbeddingService embeddingService,
        CurationOptions options,
        CancellationToken ct = default);
}

public sealed record DecryptedMessage(
    Guid Id, string SenderName, string Content,
    DateTimeOffset Timestamp, int MessageIndex);

public sealed record CurationOptions(int TargetCount = 200);

public sealed record CurationResult(
    IReadOnlyList<CuratedMessage> Messages,
    IReadOnlyList<CommunicationGap> Gaps);

public sealed record CuratedMessage(
    Guid Id, string SenderName, string Content,
    DateTimeOffset Timestamp, int MessageIndex,
    string TimeWindow, float RepresentativenessScore);

public sealed record CommunicationGap(
    DateTimeOffset Start, DateTimeOffset End, TimeSpan Duration);
