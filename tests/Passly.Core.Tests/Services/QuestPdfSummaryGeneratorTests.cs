using Passly.Abstractions.Interfaces;
using Passly.Core.Services;

namespace Passly.Core.Tests.Services;

public sealed class QuestPdfSummaryGeneratorTests
{
    private readonly QuestPdfSummaryGenerator _sut = new();

    [Fact]
    public void Generate_WithEmptyData_ProducesPdfBytes()
    {
        var data = new SummaryPdfData(
            SubmissionLabel: "Test Submission",
            EarliestMessage: new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero),
            LatestMessage: new DateTimeOffset(2025, 6, 1, 0, 0, 0, TimeSpan.Zero),
            TotalMessages: 0,
            RepresentativeMessages: [],
            Gaps: [],
            MessageCountByTimeWindow: new Dictionary<string, int>());

        var result = _sut.Generate(data);

        result.Should().NotBeNull();
        result.Length.Should().BeGreaterThan(0);
        // PDF magic bytes: %PDF
        result[0].Should().Be(0x25);
        result[1].Should().Be(0x50);
        result[2].Should().Be(0x44);
        result[3].Should().Be(0x46);
    }

    [Fact]
    public void Generate_WithRepresentativeMessages_ProducesPdfBytes()
    {
        var messages = new List<CuratedMessage>
        {
            new(Guid.NewGuid(), "Alice", "Hello, how are you?",
                new DateTimeOffset(2025, 1, 15, 10, 0, 0, TimeSpan.Zero), 0, "2025-01", 0.9f),
            new(Guid.NewGuid(), "Bob", "I'm doing well, thanks!",
                new DateTimeOffset(2025, 1, 15, 11, 0, 0, TimeSpan.Zero), 1, "2025-01", 0.85f),
            new(Guid.NewGuid(), "Alice", "Let's make plans for the weekend.",
                new DateTimeOffset(2025, 2, 10, 14, 0, 0, TimeSpan.Zero), 2, "2025-02", 0.7f),
        };

        var gaps = new List<CommunicationGap>
        {
            new(new DateTimeOffset(2025, 1, 20, 0, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2025, 2, 5, 0, 0, 0, TimeSpan.Zero),
                TimeSpan.FromDays(16)),
        };

        var data = new SummaryPdfData(
            SubmissionLabel: "Relationship Evidence",
            EarliestMessage: new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero),
            LatestMessage: new DateTimeOffset(2025, 6, 1, 0, 0, 0, TimeSpan.Zero),
            TotalMessages: 500,
            RepresentativeMessages: messages,
            Gaps: gaps,
            MessageCountByTimeWindow: new Dictionary<string, int>
            {
                ["2025-01"] = 2,
                ["2025-02"] = 1,
            });

        var result = _sut.Generate(data);

        result.Should().NotBeNull();
        result.Length.Should().BeGreaterThan(0);
        result[0].Should().Be(0x25);
    }
}
