using Microsoft.EntityFrameworkCore;
using Passly.Persistence.Models.Ingest;

namespace Passly.Persistence;

public sealed class IngestDbContext(DbContextOptions<IngestDbContext> options) : DbContext(options)
{
    public DbSet<ChatImport> ChatImports => Set<ChatImport>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("ingest");
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(IngestDbContext).Assembly,
            t => t.Namespace?.StartsWith("Passly.Persistence.Configurations.Ingest") == true);
    }
}
