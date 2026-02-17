using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Passly.Persistence.Models.Ingest;

namespace Passly.Persistence.Configurations.Ingest;

internal sealed class ChatImportConfiguration : IEntityTypeConfiguration<ChatImport>
{
    public void Configure(EntityTypeBuilder<ChatImport> builder)
    {
        builder.ToTable("chat_imports", "ingest");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.DeviceId).IsRequired();
        builder.Property(e => e.FileName).IsRequired();
        builder.Property(e => e.FileHash).IsRequired();
        builder.Property(e => e.ContentType).IsRequired();
        builder.Property(e => e.Status).HasConversion<string>().IsRequired();
        builder.Property(e => e.EncryptedRawContent).IsRequired();
        builder.Property(e => e.Salt).IsRequired();
        builder.Property(e => e.Iv).IsRequired();
        builder.Property(e => e.Tag).IsRequired();

        builder.HasIndex(e => e.DeviceId);
        builder.HasIndex(e => new { e.DeviceId, e.FileHash }).IsUnique();

        builder.HasMany(e => e.Messages)
            .WithOne(e => e.ChatImport)
            .HasForeignKey(e => e.ChatImportId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
