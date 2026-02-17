using System.Text;
using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.Ingest;
using Passly.Persistence;

namespace Passly.Core.Tests.Ingest;

public sealed class CreateChatImportHandlerTests : IDisposable
{
    private readonly IngestDbContext _db;
    private readonly IEncryptionService _encryption;
    private readonly IClock _clock;
    private readonly CreateChatImportHandler _sut;

    public CreateChatImportHandlerTests()
    {
        var options = new DbContextOptionsBuilder<IngestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new IngestDbContext(options);

        _encryption = Substitute.For<IEncryptionService>();
        _encryption.Encrypt(Arg.Any<byte[]>(), Arg.Any<string>())
            .Returns(new EncryptionResult(
                [1, 2, 3],
                new byte[32],
                new byte[12],
                new byte[16]));

        _clock = Substitute.For<IClock>();
        _clock.UtcNow.Returns(new DateTimeOffset(2025, 6, 1, 0, 0, 0, TimeSpan.Zero));

        _sut = new CreateChatImportHandler(_db, _encryption, _clock);
    }

    [Fact]
    public async Task HandleAsync_NewFile_ReturnsResponseAndSavesToDb()
    {
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("chat content"));

        var (response, isDuplicate) = await _sut.HandleAsync(
            stream, "chat.txt", "text/plain", "device-1", "passphrase123");

        isDuplicate.Should().BeFalse();
        response.Should().NotBeNull();
        response!.FileName.Should().Be("chat.txt");
        response.Status.Should().Be("Pending");

        var saved = await _db.ChatImports.SingleAsync();
        saved.DeviceId.Should().Be("device-1");
        saved.FileName.Should().Be("chat.txt");
    }

    [Fact]
    public async Task HandleAsync_DuplicateFile_ReturnsIsDuplicate()
    {
        var content = Encoding.UTF8.GetBytes("same content");

        using var stream1 = new MemoryStream(content);
        await _sut.HandleAsync(stream1, "chat.txt", "text/plain", "device-1", "passphrase123");

        using var stream2 = new MemoryStream(content);
        var (response, isDuplicate) = await _sut.HandleAsync(
            stream2, "chat-copy.txt", "text/plain", "device-1", "passphrase123");

        isDuplicate.Should().BeTrue();
        response.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_SameFileFromDifferentDevice_Succeeds()
    {
        var content = Encoding.UTF8.GetBytes("shared content");

        using var stream1 = new MemoryStream(content);
        await _sut.HandleAsync(stream1, "chat.txt", "text/plain", "device-1", "passphrase123");

        using var stream2 = new MemoryStream(content);
        var (response, isDuplicate) = await _sut.HandleAsync(
            stream2, "chat.txt", "text/plain", "device-2", "passphrase456");

        isDuplicate.Should().BeFalse();
        response.Should().NotBeNull();
    }

    public void Dispose() => _db.Dispose();
}
