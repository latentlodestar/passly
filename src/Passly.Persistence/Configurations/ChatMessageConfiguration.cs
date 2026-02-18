using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Passly.Persistence.Models;

namespace Passly.Persistence.Configurations;

internal sealed class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("chat_messages", "app");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.EncryptedSenderName).IsRequired();
        builder.Property(e => e.EncryptedContent).IsRequired();
        builder.Property(e => e.Salt).IsRequired();
        builder.Property(e => e.Iv).IsRequired();
        builder.Property(e => e.Tag).IsRequired();

        builder.HasIndex(e => e.ChatImportId);
        builder.HasIndex(e => new { e.ChatImportId, e.Timestamp });
    }
}
