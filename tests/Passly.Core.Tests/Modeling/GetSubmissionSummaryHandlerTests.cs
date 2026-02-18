using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using NSubstitute.ExceptionExtensions;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.Modeling;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.Modeling;

public sealed class GetSubmissionSummaryHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption = Substitute.For<IEncryptionService>();
    private readonly GetSubmissionSummaryHandler _sut;

    public GetSubmissionSummaryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"app-{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options);
        _sut = new GetSubmissionSummaryHandler(_db, _encryption);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task HandleAsync_SubmissionNotFound_ReturnsError()
    {
        var (pdf, meta, error) = await _sut.HandleAsync(Guid.NewGuid(), "device-1", "pass");

        error.Should().Be(GetSubmissionSummaryError.SubmissionNotFound);
        pdf.Should().BeNull();
        meta.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_SummaryNotFound_ReturnsError()
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

        var (pdf, meta, error) = await _sut.HandleAsync(submissionId, "device-1", "pass");

        error.Should().Be(GetSubmissionSummaryError.SummaryNotFound);
        pdf.Should().BeNull();
        meta.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WrongPassphrase_ReturnsError()
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
                GapCount = 1,
                CreatedAt = DateTimeOffset.UtcNow,
            },
        });
        await _db.SaveChangesAsync();

        _encryption.Decrypt(Arg.Any<byte[]>(), Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Throws(new AuthenticationTagMismatchException());

        var (pdf, meta, error) = await _sut.HandleAsync(submissionId, "device-1", "wrong");

        error.Should().Be(GetSubmissionSummaryError.WrongPassphrase);
        pdf.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_HappyPath_ReturnsPdfBytesAndMetadata()
    {
        var submissionId = Guid.NewGuid();
        var importId = Guid.NewGuid();
        var expectedPdf = new byte[] { 0x25, 0x50, 0x44, 0x46 };

        _db.Submissions.Add(new Submission
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
                ChatImportId = importId,
                EncryptedPdf = [1, 2, 3],
                Salt = [1],
                Iv = [2],
                Tag = [3],
                TotalMessages = 100,
                SelectedMessages = 50,
                GapCount = 2,
                CreatedAt = DateTimeOffset.UtcNow,
            },
        });
        await _db.SaveChangesAsync();

        _encryption.Decrypt(Arg.Any<byte[]>(), Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Returns(expectedPdf);

        var (pdf, meta, error) = await _sut.HandleAsync(submissionId, "device-1", "pass");

        error.Should().BeNull();
        pdf.Should().BeEquivalentTo(expectedPdf);
        meta.Should().NotBeNull();
        meta!.SubmissionId.Should().Be(submissionId);
        meta.TotalMessages.Should().Be(100);
        meta.SelectedMessages.Should().Be(50);
        meta.GapCount.Should().Be(2);
    }
}
