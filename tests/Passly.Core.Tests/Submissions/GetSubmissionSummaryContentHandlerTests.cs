using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NSubstitute.ExceptionExtensions;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.Submissions;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.Submissions;

public sealed class GetSubmissionSummaryContentHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption = Substitute.For<IEncryptionService>();
    private readonly GetSubmissionSummaryContentHandler _sut;

    public GetSubmissionSummaryContentHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"app-{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options);
        _sut = new GetSubmissionSummaryContentHandler(_db, _encryption);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task HandleAsync_SubmissionNotFound_ReturnsError()
    {
        var (content, error) = await _sut.HandleAsync(Guid.NewGuid(), "user-1", "pass");

        error.Should().Be(GetSubmissionSummaryError.SubmissionNotFound);
        content.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_SummaryNotFound_ReturnsError()
    {
        var submissionId = Guid.NewGuid();
        _db.Submissions.Add(new Submission
        {
            Id = submissionId,
            UserId = "user-1",
            Label = "Test",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        var (content, error) = await _sut.HandleAsync(submissionId, "user-1", "pass");

        error.Should().Be(GetSubmissionSummaryError.SummaryNotFound);
        content.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WrongPassphrase_ReturnsError()
    {
        var submissionId = Guid.NewGuid();
        _db.Submissions.Add(new Submission
        {
            Id = submissionId,
            UserId = "user-1",
            Label = "Test",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Summary = new SubmissionSummary
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                ChatImportId = Guid.NewGuid(),
                EncryptedPdf = [1, 2, 3],
                Salt = [1],
                Iv = [2],
                Tag = [3],
                EncryptedContent = [4, 5, 6],
                ContentSalt = [7],
                ContentIv = [8],
                ContentTag = [9],
                TotalMessages = 10,
                SelectedMessages = 5,
                GapCount = 1,
                CreatedAt = DateTimeOffset.UtcNow,
            },
        });
        await _db.SaveChangesAsync();

        _encryption.Decrypt(Arg.Any<byte[]>(), Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Throws(new AuthenticationTagMismatchException());

        var (content, error) = await _sut.HandleAsync(submissionId, "user-1", "wrong");

        error.Should().Be(GetSubmissionSummaryError.WrongPassphrase);
        content.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_HappyPath_ReturnsDecryptedContent()
    {
        var submissionId = Guid.NewGuid();
        var importId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var expectedContent = new SummaryContentResponse(
            "My Submission",
            now.AddDays(-30),
            now,
            100,
            [
                new SummaryMessageResponse("Alice", "Hello!", now.AddDays(-10), "2026-01-01 to 2026-01-07"),
                new SummaryMessageResponse("Bob", "Hi there!", now.AddDays(-5), "2026-01-08 to 2026-01-14"),
            ],
            [new SummaryGapResponse(now.AddDays(-25), now.AddDays(-15), 10)],
            new Dictionary<string, int> { ["2026-01-01 to 2026-01-07"] = 1, ["2026-01-08 to 2026-01-14"] = 1 });

        var contentJson = JsonSerializer.SerializeToUtf8Bytes(expectedContent);

        _db.Submissions.Add(new Submission
        {
            Id = submissionId,
            UserId = "user-1",
            Label = "My Submission",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = now,
            UpdatedAt = now,
            Summary = new SubmissionSummary
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                ChatImportId = importId,
                EncryptedPdf = [1, 2, 3],
                Salt = [1],
                Iv = [2],
                Tag = [3],
                EncryptedContent = [4, 5, 6],
                ContentSalt = [7],
                ContentIv = [8],
                ContentTag = [9],
                TotalMessages = 100,
                SelectedMessages = 2,
                GapCount = 1,
                CreatedAt = now,
            },
        });
        await _db.SaveChangesAsync();

        _encryption.Decrypt(
                Arg.Is<byte[]>(b => b.SequenceEqual(new byte[] { 4, 5, 6 })),
                Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Returns(contentJson);

        var (content, error) = await _sut.HandleAsync(submissionId, "user-1", "pass");

        error.Should().BeNull();
        content.Should().NotBeNull();
        content!.SubmissionLabel.Should().Be("My Submission");
        content.TotalMessages.Should().Be(100);
        content.RepresentativeMessages.Should().HaveCount(2);
        content.Gaps.Should().HaveCount(1);
        content.Gaps[0].DurationDays.Should().Be(10);
        content.MessageCountByTimeWindow.Should().HaveCount(2);
    }
}
