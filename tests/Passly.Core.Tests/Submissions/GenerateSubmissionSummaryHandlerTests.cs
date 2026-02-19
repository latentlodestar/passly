using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.Submissions;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.Submissions;

public sealed class GenerateSubmissionSummaryHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption = Substitute.For<IEncryptionService>();
    private readonly ISummaryPdfGenerator _pdfGenerator = Substitute.For<ISummaryPdfGenerator>();
    private readonly GenerateSubmissionSummaryHandler _sut;

    public GenerateSubmissionSummaryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"app-{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options);

        _sut = new GenerateSubmissionSummaryHandler(_db, _encryption, _pdfGenerator);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task HandleAsync_SubmissionNotFound_ReturnsError()
    {
        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Convert.ToBase64String([0xFF, 0xD8]));

        var (response, error) = await _sut.HandleAsync(Guid.NewGuid(), request);

        error.Should().Be(GenerateSubmissionSummaryError.SubmissionNotFound);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_AnalysisNotFound_ReturnsError()
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

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Convert.ToBase64String([0xFF, 0xD8]));

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.AnalysisNotFound);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_PdfAlreadyExists_ReturnsError()
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

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Convert.ToBase64String([0xFF, 0xD8]));

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.PdfAlreadyExists);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_HappyPath_GeneratesPdfAndPersists()
    {
        var submissionId = Guid.NewGuid();
        var importId = Guid.NewGuid();

        var contentResponse = new SummaryContentResponse(
            "My Submission",
            DateTimeOffset.UtcNow.AddDays(-30),
            DateTimeOffset.UtcNow,
            100,
            [],
            [],
            new Dictionary<string, int>());

        var contentJson = JsonSerializer.SerializeToUtf8Bytes(contentResponse);

        var submission = new Submission
        {
            Id = submissionId,
            DeviceId = "device-1",
            Label = "My Submission",
            Status = SubmissionStatus.Active,
            CurrentStep = SubmissionStep.GetStarted,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Summary = new SubmissionSummary
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                ChatImportId = importId,
                EncryptedContent = [4, 5, 6],
                ContentSalt = [7],
                ContentIv = [8],
                ContentTag = [9],
                TotalMessages = 100,
                SelectedMessages = 10,
                GapCount = 0,
                CreatedAt = DateTimeOffset.UtcNow,
            },
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        _encryption.Decrypt(
                Arg.Any<byte[]>(), Arg.Any<string>(),
                Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Returns(contentJson);

        _pdfGenerator.Generate(Arg.Any<SummaryPdfData>()).Returns([0x25, 0x50, 0x44, 0x46]);

        _encryption.Encrypt(Arg.Any<byte[]>(), Arg.Any<string>())
            .Returns(new EncryptionResult([1, 2], [3], [4], [5]));

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", Convert.ToBase64String([0xFF, 0xD8]));

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.SubmissionId.Should().Be(submissionId);
        response.HasPdf.Should().BeTrue();
        response.HasSignature.Should().BeTrue();

        var persisted = await _db.SubmissionSummaries.FirstOrDefaultAsync();
        persisted.Should().NotBeNull();
        persisted!.EncryptedPdf.Should().NotBeNull();
        persisted.EncryptedSignature.Should().NotBeNull();
    }

    [Fact]
    public async Task HandleAsync_MissingSignature_ReturnsError()
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

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", null);

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.SignatureRequired);
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_InvalidBase64Signature_ReturnsError()
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

        var request = new GenerateSubmissionSummaryRequest("device-1", "pass", "not-valid-base64!!!");

        var (response, error) = await _sut.HandleAsync(submissionId, request);

        error.Should().Be(GenerateSubmissionSummaryError.InvalidSignature);
        response.Should().BeNull();
    }
}
