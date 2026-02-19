using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Passly.Persistence.Models;

namespace Passly.Persistence.Configurations;

internal sealed class SubmissionSummaryConfiguration : IEntityTypeConfiguration<SubmissionSummary>
{
    public void Configure(EntityTypeBuilder<SubmissionSummary> builder)
    {
        builder.ToTable("submission_summaries", "app");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.SubmissionId).IsRequired();
        builder.Property(e => e.ChatImportId).IsRequired();
        builder.Property(e => e.EncryptedPdf).IsRequired(false);
        builder.Property(e => e.Salt).IsRequired(false);
        builder.Property(e => e.Iv).IsRequired(false);
        builder.Property(e => e.Tag).IsRequired(false);
        builder.Property(e => e.EncryptedContent).IsRequired();
        builder.Property(e => e.ContentSalt).IsRequired();
        builder.Property(e => e.ContentIv).IsRequired();
        builder.Property(e => e.ContentTag).IsRequired();
        builder.Property(e => e.EncryptedSignature).IsRequired(false);
        builder.Property(e => e.SignatureSalt).IsRequired(false);
        builder.Property(e => e.SignatureIv).IsRequired(false);
        builder.Property(e => e.SignatureTag).IsRequired(false);

        builder.HasIndex(e => e.SubmissionId).IsUnique();

        builder.HasOne(e => e.Submission)
            .WithOne(s => s.Summary)
            .HasForeignKey<SubmissionSummary>(e => e.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ChatImport)
            .WithMany()
            .HasForeignKey(e => e.ChatImportId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
