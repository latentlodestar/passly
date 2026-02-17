namespace Passly.Persistence.Models.Ingest;

public sealed class ChatMessage
{
    public Guid Id { get; set; }
    public Guid ChatImportId { get; set; }
    public required byte[] EncryptedSenderName { get; set; }
    public required byte[] EncryptedContent { get; set; }
    public required byte[] Salt { get; set; }
    public required byte[] Iv { get; set; }
    public required byte[] Tag { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public int MessageIndex { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ChatImport ChatImport { get; set; } = null!;
}
