using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.Modeling;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.Modeling;

public sealed class GenerateSubmissionSummaryHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption = Substitute.For<IEncryptionService>();
    private readonly IEmbeddingService _embeddings = Substitute.For<IEmbeddingService>();
    private readonly IMessageCurator _curator = Substitute.For<IMessageCurator>();
    private readonly ISummaryPdfGenerator _pdfGenerator = Substitute.For<ISummaryPdfGenerator>();
    private readonly IClock _clock = Substitute.For<IClock>();
    private readonly GenerateSubmissionSummaryHandler _sut;

    public GenerateSubmissionSummaryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"app-{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options);

        _clock.UtcNow.Returns(DateTimeOffset.UtcNow);

        _sut = new GenerateSubmissionSummaryHandler(
            _db, _encryption, _embeddings, _curator, _pdfGenerator, _clock);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task HandleAsync_SubmissionNotFound_ReturnsError()
    {
        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Guid.NewGuid());

        var (response, error) = await _sut.HandleAsync(Guid.NewGuid(), request);

        error.Should().Be(GenerateSubmissionSummaryError.SubmissionNotFound);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_SummaryAlreadyExists_ReturnsError()
    {
        var submissionId = Guid.NewGuid();
        var submission = new Submission
        {
            Id = submissionId,
            DeviceId = "device-1",
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
                TotalMessages = 10,
                SelectedMessages = 5,
                GapCount = 0,
                CreatedAt = DateTimeOffset.UtcNow,
            },
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Guid.NewGuid());

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.SummaryAlreadyExists);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_ImportNotFound_ReturnsError()
    {
        var submissionId = Guid.NewGuid();
        _db.Submissions.Add(new Submission
        {
            Id = submissionId,
            DeviceId = "device-1",
            Label = "Test",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Guid.NewGuid());

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.ImportNotFound);
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
            DeviceId = "device-1",
            Label = "Test",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        _db.ChatImports.Add(new ChatImport
        {
            Id = importId,
            DeviceId = "device-1",
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

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", importId);

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.ImportNotParsed);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_HappyPath_PersistsSummaryAndReturnsResponse()
    {
        var submissionId = Guid.NewGuid();
        var importId = Guid.NewGuid();

        _db.Submissions.Add(new Submission
        {
            Id = submissionId,
            DeviceId = "device-1",
            Label = "My Submission",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        _db.ChatImports.Add(new ChatImport
        {
            Id = importId,
            DeviceId = "device-1",
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
                Arg.Any<IEmbeddingService>(),
                Arg.Any<CurationOptions>(),
                Arg.Any<CancellationToken>())
            .Returns(new CurationResult([], []));

        _pdfGenerator.Generate(Arg.Any<SummaryPdfData>()).Returns([0x25, 0x50, 0x44, 0x46]);

        _encryption.Encrypt(Arg.Any<byte[]>(), Arg.Any<string>())
            .Returns(new EncryptionResult([1, 2], [3], [4], [5]));

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", importId);

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.SubmissionId.Should().Be(submissionId);
        response.ChatImportId.Should().Be(importId);
        response.TotalMessages.Should().Be(0);
        response.SelectedMessages.Should().Be(0);
        response.GapCount.Should().Be(0);

        var persisted = await _db.SubmissionSummaries.FirstOrDefaultAsync();
        persisted.Should().NotBeNull();
        persisted!.SubmissionId.Should().Be(submissionId);
    }
}
