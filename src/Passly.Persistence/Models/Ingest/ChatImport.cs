using Passly.Abstractions.Contracts;

namespace Passly.Persistence.Models.Ingest;

public sealed class ChatImport
{
    public Guid Id { get; set; }
    public required string DeviceId { get; set; }
    public required string FileName { get; set; }
    public required string FileHash { get; set; }
    public required string ContentType { get; set; }
    public ChatImportStatus Status { get; set; }
    public required byte[] EncryptedRawContent { get; set; }
    public required byte[] Salt { get; set; }
    public required byte[] Iv { get; set; }
    public required byte[] Tag { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
