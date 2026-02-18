using Microsoft.EntityFrameworkCore;
using Passly.Persistence.Models;

namespace Passly.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionSummary> SubmissionSummaries => Set<SubmissionSummary>();
    public DbSet<ChatImport> ChatImports => Set<ChatImport>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("app");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
