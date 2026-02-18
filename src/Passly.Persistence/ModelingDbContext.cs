using Microsoft.EntityFrameworkCore;
using Passly.Persistence.Models.Modeling;

namespace Passly.Persistence;

public sealed class ModelingDbContext(DbContextOptions<ModelingDbContext> options) : DbContext(options)
{
    public DbSet<Submission> Submissions => Set<Submission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("modeling");
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ModelingDbContext).Assembly,
            t => t.Namespace?.StartsWith("Passly.Persistence.Configurations.Modeling") == true);
    }
}
