using Passly.Infrastructure;
using Passly.MigrationRunner;
using Passly.Persistence;

var builder = Host.CreateApplicationBuilder(args);

builder.AddInfrastructure();
builder.AddPersistence();

builder.Services.AddHostedService<MigrationWorker>();

builder.Build().Run();
