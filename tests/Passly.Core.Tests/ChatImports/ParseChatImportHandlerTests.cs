using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.ChatImports;
using Passly.Persistence;
using Passly.Persistence.Models;

namespace Passly.Core.Tests.ChatImports;

public sealed class ParseChatImportHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption;
    private readonly IClock _clock;
    private readonly ParseChatImportHandler _sut;
    private readonly DateTimeOffset _now = new(2025, 6, 1, 0, 0, 0, TimeSpan.Zero);

    public ParseChatImportHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _encryption = Substitute.For<IEncryptionService>();

        // Encrypt returns predictable bytes
        _encryption.Encrypt(Arg.Any<byte[]>(), Arg.Any<string>())
            .Returns(ci => new EncryptionResult(
                (byte[])ci[0],
                new byte[32],
                new byte[12],
                new byte[16]));

        // Decrypt returns the "raw content" as chat text
        _encryption.Decrypt(Arg.Any<byte[]>(), Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Returns(ci => (byte[])ci[0]);

        _clock = Substitute.For<IClock>();
        _clock.UtcNow.Returns(_now);

        var parser = new WhatsAppChatParser();
        _sut = new ParseChatImportHandler(_db, _encryption, parser, _clock, NullLogger<ParseChatImportHandler>.Instance);
    }

    [Fact]
    public async Task HandleAsync_PendingImport_ParsesAndSavesMessages()
    {
        var chatContent = """
            [06/15/23, 9:41:23 AM] Alex Johnson: Hey! I just landed
            [06/15/23, 9:42:01 AM] Sam Rivera: How was the flight?
            """;
        var import = await SeedImport(chatContent);

        await _sut.HandleAsync(import.Id, "passphrase123");

        var updated = await _db.ChatImports.FindAsync(import.Id);
        updated!.Status.Should().Be(ChatImportStatus.Parsed);

        var messages = await _db.ChatMessages.Where(m => m.ChatImportId == import.Id).ToListAsync();
        messages.Should().HaveCount(2);
        messages[0].MessageIndex.Should().Be(0);
        messages[1].MessageIndex.Should().Be(1);
    }

    [Fact]
    public async Task HandleAsync_PendingImport_SetsParsingStatusFirst()
    {
        var chatContent = "[06/15/23, 9:41:23 AM] Alex Johnson: Hey!";
        var import = await SeedImport(chatContent);

        // Track status transitions via encryption.Decrypt being called while status is Parsing
        ChatImportStatus? statusDuringDecrypt = null;
        _encryption.Decrypt(Arg.Any<byte[]>(), Arg.Any<string>(), Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Returns(ci =>
            {
                statusDuringDecrypt = _db.ChatImports.Find(import.Id)!.Status;
                return (byte[])ci[0];
            });

        await _sut.HandleAsync(import.Id, "passphrase123");

        statusDuringDecrypt.Should().Be(ChatImportStatus.Parsing);
    }

    [Fact]
    public async Task HandleAsync_NonPendingImport_DoesNothing()
    {
        var chatContent = "[06/15/23, 9:41:23 AM] Alex Johnson: Hey!";
        var import = await SeedImport(chatContent, ChatImportStatus.Parsed);

        await _sut.HandleAsync(import.Id, "passphrase123");

        var messages = await _db.ChatMessages.Where(m => m.ChatImportId == import.Id).ToListAsync();
        messages.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_NonExistentImport_DoesNotThrow()
    {
        await _sut.HandleAsync(Guid.NewGuid(), "passphrase123");
    }

    [Fact]
    public async Task HandleAsync_MessagesHaveCorrectTimestamps()
    {
        var chatContent = """
            [06/15/23, 9:41:23 AM] Alex Johnson: Morning
            [07/04/23, 11:45:22 PM] Sam Rivera: Evening
            """;
        var import = await SeedImport(chatContent);

        await _sut.HandleAsync(import.Id, "passphrase123");

        var messages = await _db.ChatMessages
            .Where(m => m.ChatImportId == import.Id)
            .OrderBy(m => m.MessageIndex)
            .ToListAsync();

        messages[0].Timestamp.Month.Should().Be(6);
        messages[0].Timestamp.Day.Should().Be(15);
        messages[1].Timestamp.Month.Should().Be(7);
        messages[1].Timestamp.Hour.Should().Be(23);
    }

    [Fact]
    public async Task HandleAsync_EncryptedSenderNameIsEmpty()
    {
        var chatContent = "[06/15/23, 9:41:23 AM] Alex Johnson: Hey!";
        var import = await SeedImport(chatContent);

        await _sut.HandleAsync(import.Id, "passphrase123");

        var message = await _db.ChatMessages.FirstAsync(m => m.ChatImportId == import.Id);
        message.EncryptedSenderName.Should().BeEmpty();
    }

    private async Task<ChatImport> SeedImport(string chatContent, ChatImportStatus status = ChatImportStatus.Pending)
    {
        var rawBytes = Encoding.UTF8.GetBytes(chatContent);
        var entity = new ChatImport
        {
            Id = Guid.NewGuid(),
            DeviceId = "device-1",
            SubmissionId = Guid.NewGuid(),
            FileName = "chat.txt",
            FileHash = "abc123",
            ContentType = "text/plain",
            Status = status,
            EncryptedRawContent = rawBytes,
            Salt = new byte[32],
            Iv = new byte[12],
            Tag = new byte[16],
            CreatedAt = _now,
            UpdatedAt = _now,
        };
        _db.ChatImports.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public void Dispose() => _db.Dispose();
}
