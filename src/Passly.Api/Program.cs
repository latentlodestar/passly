using Microsoft.EntityFrameworkCore;
using Passly.Api.Endpoints;
using Passly.Core;
using Passly.Infrastructure;
using Passly.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.AddInfrastructure();
builder.AddPersistence();
builder.Services.AddCore();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

await MigrateAsync<IngestDbContext>(app);
await MigrateAsync<ModelingDbContext>(app);

app.UseCors();
app.MapDefaultEndpoints();
app.MapStatusEndpoints();
app.MapLogEndpoints();

app.Run();

static async Task MigrateAsync<TContext>(WebApplication app) where TContext : DbContext
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<TContext>();
    if (!context.Database.IsRelational()) return;
    var strategy = context.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(() => context.Database.MigrateAsync());
}

public partial class Program;
