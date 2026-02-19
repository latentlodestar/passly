using Microsoft.EntityFrameworkCore;
using Passly.Persistence.Models;
using Pgvector;

namespace Passly.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionSummary> SubmissionSummaries => Set<SubmissionSummary>();
    public DbSet<ChatImport> ChatImports => Set<ChatImport>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatMessageEmbedding> ChatMessageEmbeddings => Set<ChatMessageEmbedding>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("app");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        if (Database.ProviderName?.Contains("Npgsql") == true)
        {
            modelBuilder.HasPostgresExtension("vector");

            modelBuilder.Entity<ChatMessageEmbedding>()
                .Property(e => e.Embedding)
                .HasColumnType("vector(384)")
                .IsRequired();

            modelBuilder.Entity<ChatMessageEmbedding>()
                .HasIndex(e => e.Embedding)
                .HasMethod("hnsw")
                .HasOperators("vector_cosine_ops");
        }
        else
        {
            // InMemory provider: convert Vector to string for storage
            modelBuilder.Entity<ChatMessageEmbedding>()
                .Property(e => e.Embedding)
                .HasConversion(
                    v => string.Join(',', v.ToArray()),
                    v => new Vector(v.Split(',').Select(float.Parse).ToArray()));
        }
    }
}
