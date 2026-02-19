using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Passly.Persistence.Models;

namespace Passly.Persistence.Configurations;

internal sealed class ChatMessageEmbeddingConfiguration : IEntityTypeConfiguration<ChatMessageEmbedding>
{
    public void Configure(EntityTypeBuilder<ChatMessageEmbedding> builder)
    {
        builder.ToTable("chat_message_embeddings", "app");

        builder.HasKey(e => e.Id);

        builder.HasIndex(e => e.ChatMessageId).IsUnique();

        builder.HasOne(e => e.ChatMessage)
            .WithOne(m => m.Embedding)
            .HasForeignKey<ChatMessageEmbedding>(e => e.ChatMessageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
