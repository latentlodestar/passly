using Microsoft.EntityFrameworkCore;

namespace Passly.Persistence;

public sealed class IngestDbContext(DbContextOptions<IngestDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("ingest");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(IngestDbContext).Assembly);
    }
}
