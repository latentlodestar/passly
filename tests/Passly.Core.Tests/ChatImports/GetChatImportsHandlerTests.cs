using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Core.ChatImports;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.ChatImports;

public sealed class GetChatImportsHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly GetChatImportsHandler _sut;

    public GetChatImportsHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _sut = new GetChatImportsHandler(_db);
    }

    [Fact]
    public async Task HandleAsync_FiltersByDeviceIdAndSubmissionId()
    {
        var submissionId = Guid.NewGuid();
        var otherSubmissionId = Guid.NewGuid();
        _db.ChatImports.AddRange(
            MakeImport("device-1", "chat-a.txt", submissionId: submissionId),
            MakeImport("device-2", "chat-b.txt", submissionId: submissionId),
            MakeImport("device-1", "chat-c.txt", submissionId: submissionId),
            MakeImport("device-1", "chat-d.txt", submissionId: otherSubmissionId));
        await _db.SaveChangesAsync();

        var result = await _sut.HandleAsync("device-1", submissionId);

        result.Should().HaveCount(2);
        result.Should().OnlyContain(r => r.FileName == "chat-a.txt" || r.FileName == "chat-c.txt");
    }

    [Fact]
    public async Task HandleAsync_OrderedByCreatedAtDescending()
    {
        var submissionId = Guid.NewGuid();
        var baseTime = new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero);
        _db.ChatImports.AddRange(
            MakeImport("device-1", "older.txt", createdAt: baseTime, submissionId: submissionId),
            MakeImport("device-1", "newer.txt", createdAt: baseTime.AddHours(1), submissionId: submissionId));
        await _db.SaveChangesAsync();

        var result = await _sut.HandleAsync("device-1", submissionId);

        result[0].FileName.Should().Be("newer.txt");
        result[1].FileName.Should().Be("older.txt");
    }

    [Fact]
    public async Task HandleAsync_NoImports_ReturnsEmptyList()
    {
        var result = await _sut.HandleAsync("unknown-device", Guid.NewGuid());

        result.Should().BeEmpty();
    }

    private static ChatImport MakeImport(string deviceId, string fileName, DateTimeOffset? createdAt = null, Guid? submissionId = null) => new()
    {
        Id = Guid.NewGuid(),
        DeviceId = deviceId,
        SubmissionId = submissionId ?? Guid.NewGuid(),
        FileName = fileName,
        FileHash = Guid.NewGuid().ToString(),
        ContentType = "text/plain",
        Status = ChatImportStatus.Pending,
        EncryptedRawContent = [1],
        Salt = new byte[32],
        Iv = new byte[12],
        Tag = new byte[16],
        CreatedAt = createdAt ?? DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public void Dispose() => _db.Dispose();
}
