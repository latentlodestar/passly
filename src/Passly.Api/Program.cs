using Passly.Abstractions.Contracts;
using Passly.Api.Endpoints;
using Passly.Core;
using Passly.Core.Ingest;
using Passly.Infrastructure;
using Passly.Persistence;
using Rebus.Config;
using Rebus.Routing.TypeBased;
using Rebus.Transport.InMem;

var builder = WebApplication.CreateBuilder(args);

builder.AddInfrastructure();
builder.AddPersistence();
builder.Services.AddCore();

builder.Services.AddRebus(cfg => cfg
    .Transport(t => t.UseInMemoryTransport(new InMemNetwork(), "passly-imports"))
    .Routing(r => r.TypeBased().Map<ChatImportCreated>("passly-imports")));

builder.Services.AutoRegisterHandlersFromAssemblyOf<ChatImportCreatedHandler>();

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

app.UseCors();
app.MapDefaultEndpoints();
app.MapStatusEndpoints();
app.MapLogEndpoints();
app.MapImportEndpoints();
app.MapSubmissionEndpoints();

app.Run();

public partial class Program;
