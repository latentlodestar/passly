using Microsoft.EntityFrameworkCore;

namespace Passly.Persistence;

public sealed class ModelingDbContext(DbContextOptions<ModelingDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("modeling");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ModelingDbContext).Assembly);
    }
}
