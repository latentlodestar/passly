using Microsoft.EntityFrameworkCore;
using Passly.Persistence;

namespace Passly.MigrationRunner;

public class MigrationWorker(
    IServiceProvider serviceProvider,
    IHostApplicationLifetime lifetime,
    ILogger<MigrationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Starting database migrations");

        await MigrateAsync<IngestDbContext>(stoppingToken);
        await MigrateAsync<ModelingDbContext>(stoppingToken);

        logger.LogInformation("Database migrations completed");
        lifetime.StopApplication();
    }

    private async Task MigrateAsync<TContext>(CancellationToken stoppingToken) where TContext : DbContext
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TContext>();

        if (!context.Database.IsRelational()) return;

        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(ct => context.Database.MigrateAsync(ct), stoppingToken);

        logger.LogInformation("Applied migrations for {Context}", typeof(TContext).Name);
    }
}
