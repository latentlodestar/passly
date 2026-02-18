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
        builder.Property(e => e.EncryptedPdf).IsRequired();
        builder.Property(e => e.Salt).IsRequired();
        builder.Property(e => e.Iv).IsRequired();
        builder.Property(e => e.Tag).IsRequired();

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
