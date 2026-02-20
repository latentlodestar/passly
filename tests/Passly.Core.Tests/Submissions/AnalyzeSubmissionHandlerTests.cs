using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.Submissions;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.Submissions;

public sealed class AnalyzeSubmissionHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption = Substitute.For<IEncryptionService>();
    private readonly IMessageCurator _curator = Substitute.For<IMessageCurator>();
    private readonly IClock _clock = Substitute.For<IClock>();
    private readonly AnalyzeSubmissionHandler _sut;

    public AnalyzeSubmissionHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"app-{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options);

        _clock.UtcNow.Returns(DateTimeOffset.UtcNow);

        _sut = new AnalyzeSubmissionHandler(_db, _encryption, _curator, _clock);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task HandleAsync_SubmissionNotFound_ReturnsError()
    {
        var request = new AnalyzeSubmissionRequest("pass", Guid.NewGuid());

        var (response, error) = await _sut.HandleAsync(Guid.NewGuid(), "user-1", request);

        error.Should().Be(AnalyzeSubmissionError.SubmissionNotFound);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_AnalysisAlreadyExists_ReturnsError()
    {
        var submissionId = Guid.NewGuid();
        var submission = new Submission
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
                EncryptedContent = [4, 5, 6],
                ContentSalt = [7],
                ContentIv = [8],
                ContentTag = [9],
                TotalMessages = 10,
                SelectedMessages = 5,
                GapCount = 0,
                CreatedAt = DateTimeOffset.UtcNow,
            },
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        var request = new AnalyzeSubmissionRequest("pass", Guid.NewGuid());

        var (response, error) = await _sut.HandleAsync(submissionId, "user-1", request);

        error.Should().Be(AnalyzeSubmissionError.AnalysisAlreadyExists);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_ImportNotFound_ReturnsError()
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

        var request = new AnalyzeSubmissionRequest("pass", Guid.NewGuid());

        var (response, error) = await _sut.HandleAsync(submissionId, "user-1", request);

        error.Should().Be(AnalyzeSubmissionError.ImportNotFound);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_ImportNotParsed_ReturnsError()
    {
        var submissionId = Guid.NewGuid();
        var importId = Guid.NewGuid();

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

        _db.ChatImports.Add(new ChatImport
        {
            Id = importId,
            UserId = "user-1",
            SubmissionId = submissionId,
            FileName = "chat.txt",
            FileHash = "abc",
            ContentType = "text/plain",
            Status = ChatImportStatus.Pending,
            EncryptedRawContent = [1],
            Salt = [2],
            Iv = [3],
            Tag = [4],
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        var request = new AnalyzeSubmissionRequest("pass", importId);

        var (response, error) = await _sut.HandleAsync(submissionId, "user-1", request);

        error.Should().Be(AnalyzeSubmissionError.ImportNotParsed);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_HappyPath_PersistsAnalysisAndReturnsResponse()
    {
        var submissionId = Guid.NewGuid();
        var importId = Guid.NewGuid();

        _db.Submissions.Add(new Submission
        {
            Id = submissionId,
            UserId = "user-1",
            Label = "My Submission",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        _db.ChatImports.Add(new ChatImport
        {
            Id = importId,
            UserId = "user-1",
            SubmissionId = submissionId,
            FileName = "chat.txt",
            FileHash = "abc",
            ContentType = "text/plain",
            Status = ChatImportStatus.Parsed,
            EncryptedRawContent = [1],
            Salt = [2],
            Iv = [3],
            Tag = [4],
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        // No chat messages — curation returns empty
        _curator.CurateAsync(
                Arg.Any<IReadOnlyList<DecryptedMessage>>(),
                Arg.Any<float[][]>(),
                Arg.Any<CurationOptions>(),
                Arg.Any<CancellationToken>())
            .Returns(new CurationResult([], []));

        _encryption.Encrypt(Arg.Any<byte[]>(), Arg.Any<string>())
            .Returns(new EncryptionResult([1, 2], [3], [4], [5]));

        var request = new AnalyzeSubmissionRequest("pass", importId);

        var (response, error) = await _sut.HandleAsync(submissionId, "user-1", request);

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.SubmissionId.Should().Be(submissionId);
        response.ChatImportId.Should().Be(importId);
        response.TotalMessages.Should().Be(0);
        response.SelectedMessages.Should().Be(0);
        response.GapCount.Should().Be(0);
        response.HasPdf.Should().BeFalse();

        var persisted = await _db.SubmissionSummaries.FirstOrDefaultAsync();
        persisted.Should().NotBeNull();
        persisted!.SubmissionId.Should().Be(submissionId);
        persisted.EncryptedContent.Should().NotBeEmpty();
        persisted.ContentSalt.Should().NotBeEmpty();
        persisted.EncryptedPdf.Should().BeNull();

        // Encrypt called once for content JSON only (no PDF)
        _encryption.Received(1).Encrypt(Arg.Any<byte[]>(), Arg.Any<string>());
    }
}
