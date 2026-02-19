using Pgvector;

namespace Passly.Persistence.Models;

public sealed class ChatMessageEmbedding
{
    public Guid Id { get; set; }
    public Guid ChatMessageId { get; set; }
    public required Vector Embedding { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ChatMessage ChatMessage { get; set; } = null!;
}
