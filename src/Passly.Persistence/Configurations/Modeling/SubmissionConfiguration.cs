using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Passly.Persistence.Models.Modeling;

namespace Passly.Persistence.Configurations.Modeling;

internal sealed class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.ToTable("submissions", "modeling");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.DeviceId).IsRequired();
        builder.Property(e => e.Label).IsRequired();
        builder.Property(e => e.Status).HasConversion<string>().IsRequired();
        builder.Property(e => e.CurrentStep).HasConversion<string>().IsRequired();

        builder.HasIndex(e => e.DeviceId);
    }
}
