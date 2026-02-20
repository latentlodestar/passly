using Microsoft.EntityFrameworkCore;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Core.ChatImports;
using Passly.Persistence;
using Passly.Persistence.Models;
using Pgvector;
using System.Text;
using System.Text.Json;

namespace Passly.Core.Tests.ChatImports;

public sealed class GetRepresentativeMessagesHandlerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption;
    private readonly IMessageCurator _curator;
    private readonly GetRepresentativeMessagesHandler _sut;

    private const string UserId = "user-1";
    private const string Passphrase = "test-passphrase-123";

    public GetRepresentativeMessagesHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _encryption = Substitute.For<IEncryptionService>();
        _curator = Substitute.For<IMessageCurator>();

        _sut = new GetRepresentativeMessagesHandler(_db, _encryption, _curator);
    }

    [Fact]
    public async Task HandleAsync_ImportNotFound_ReturnsNotFoundError()
    {
        var (response, error) = await _sut.HandleAsync(
            Guid.NewGuid(), UserId, Passphrase, 50);

        response.Should().BeNull();
        error.Should().Be(GetRepresentativeMessagesError.NotFound);
    }

    [Fact]
    public async Task HandleAsync_WrongDeviceId_ReturnsNotFoundError()
    {
        var import = await SeedParsedImport();

        var (response, error) = await _sut.HandleAsync(
            import.Id, "wrong-device", Passphrase, 50);

        response.Should().BeNull();
        error.Should().Be(GetRepresentativeMessagesError.NotFound);
    }

    [Fact]
    public async Task HandleAsync_ImportNotParsed_ReturnsNotParsedError()
    {
        var import = await SeedImport(ChatImportStatus.Pending);

        var (response, error) = await _sut.HandleAsync(
            import.Id, UserId, Passphrase, 50);

        response.Should().BeNull();
        error.Should().Be(GetRepresentativeMessagesError.NotParsed);
    }

    [Fact]
    public async Task HandleAsync_ParsedImport_DecryptsAndCurates()
    {
        var import = await SeedParsedImport();
        await SeedMessages(import.Id, 10);

        SetupDecryption();

        var curationResult = new CurationResult(
            [
                new CuratedMessage(
                    Guid.NewGuid(), "Alice", "Hello",
                    new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero),
                    0, "2025-01-01 to 2025-01-07", 0.95f),
            ],
            []);

        _curator.CurateAsync(
                Arg.Any<IReadOnlyList<DecryptedMessage>>(),
                Arg.Any<float[][]>(),
                Arg.Any<CurationOptions>(),
                Arg.Any<CancellationToken>())
            .Returns(curationResult);

        var (response, error) = await _sut.HandleAsync(
            import.Id, UserId, Passphrase, 50);

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.ChatImportId.Should().Be(import.Id);
        response.TotalMessages.Should().Be(10);
        response.SelectedCount.Should().Be(1);
        response.Messages.Should().HaveCount(1);
    }

    [Fact]
    public async Task HandleAsync_PassesCorrectTargetCountToCurator()
    {
        var import = await SeedParsedImport();
        await SeedMessages(import.Id, 5);
        SetupDecryption();

        _curator.CurateAsync(
                Arg.Any<IReadOnlyList<DecryptedMessage>>(),
                Arg.Any<float[][]>(),
                Arg.Any<CurationOptions>(),
                Arg.Any<CancellationToken>())
            .Returns(new CurationResult([], []));

        await _sut.HandleAsync(import.Id, UserId, Passphrase, 42);

        await _curator.Received(1).CurateAsync(
            Arg.Any<IReadOnlyList<DecryptedMessage>>(),
            Arg.Any<float[][]>(),
            Arg.Is<CurationOptions>(o => o.TargetCount == 42),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_DecryptsAllMessages()
    {
        var import = await SeedParsedImport();
        await SeedMessages(import.Id, 3);
        SetupDecryption();

        _curator.CurateAsync(
                Arg.Any<IReadOnlyList<DecryptedMessage>>(),
                Arg.Any<float[][]>(),
                Arg.Any<CurationOptions>(),
                Arg.Any<CancellationToken>())
            .Returns(new CurationResult([], []));

        await _sut.HandleAsync(import.Id, UserId, Passphrase, 50);

        _encryption.Received(3).Decrypt(
            Arg.Any<byte[]>(), Passphrase, Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>());
    }

    private async Task<ChatImport> SeedParsedImport()
    {
        return await SeedImport(ChatImportStatus.Parsed);
    }

    private async Task<ChatImport> SeedImport(ChatImportStatus status)
    {
        var import = new ChatImport
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            SubmissionId = Guid.NewGuid(),
            FileName = "chat.txt",
            FileHash = "abc123",
            ContentType = "text/plain",
            Status = status,
            EncryptedRawContent = [1, 2, 3],
            Salt = new byte[32],
            Iv = new byte[12],
            Tag = new byte[16],
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        _db.ChatImports.Add(import);
        await _db.SaveChangesAsync();
        return import;
    }

    private async Task SeedMessages(Guid importId, int count)
    {
        for (var i = 0; i < count; i++)
        {
            var msgId = Guid.NewGuid();
            _db.ChatMessages.Add(new ChatMessage
            {
                Id = msgId,
                ChatImportId = importId,
                EncryptedSenderName = [1],
                EncryptedContent = [1, 2, 3],
                Salt = new byte[32],
                Iv = new byte[12],
                Tag = new byte[16],
                Timestamp = DateTimeOffset.UtcNow.AddHours(i),
                MessageIndex = i,
                CreatedAt = DateTimeOffset.UtcNow,
            });
            _db.ChatMessageEmbeddings.Add(new ChatMessageEmbedding
            {
                Id = Guid.NewGuid(),
                ChatMessageId = msgId,
                Embedding = new Vector(new float[384]),
                CreatedAt = DateTimeOffset.UtcNow,
            });
        }
        await _db.SaveChangesAsync();
    }

    private void SetupDecryption()
    {
        var payload = JsonSerializer.SerializeToUtf8Bytes(
            new { SenderName = "Alice", Content = "Hello" });

        _encryption.Decrypt(
                Arg.Any<byte[]>(), Arg.Any<string>(),
                Arg.Any<byte[]>(), Arg.Any<byte[]>(), Arg.Any<byte[]>())
            .Returns(payload);
    }

    public void Dispose() => _db.Dispose();
}
