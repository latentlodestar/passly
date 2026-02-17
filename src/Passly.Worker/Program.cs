using Passly.Abstractions.Contracts;
using Passly.Core;
using Passly.Core.Ingest;
using Passly.Infrastructure;
using Passly.Persistence;
using Rebus.Config;
using Rebus.Routing.TypeBased;

var builder = Host.CreateApplicationBuilder(args);

builder.AddInfrastructure();
builder.AddPersistence();
builder.Services.AddCore();

builder.Services.AddRebus(cfg => cfg
    .Transport(t => t.UseAmazonSQS(
        builder.Configuration["Messaging:AccessKey"] ?? "",
        builder.Configuration["Messaging:SecretKey"] ?? "",
        Amazon.RegionEndpoint.GetBySystemName(builder.Configuration["Messaging:Region"] ?? "us-east-1"),
        "passly-imports",
        new AmazonSQSTransportOptions()))
    .Routing(r => r.TypeBased().Map<ChatImportCreated>("passly-imports")));

builder.Services.AutoRegisterHandlersFromAssemblyOf<ChatImportCreatedHandler>();

builder.Build().Run();
