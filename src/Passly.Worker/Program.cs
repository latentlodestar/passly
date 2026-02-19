using Amazon.SQS;
using Passly.Abstractions.Contracts;
using Passly.Core;
using Passly.Core.ChatImports;
using Passly.Infrastructure;
using Passly.Persistence;
using Rebus.Config;
using Rebus.Routing.TypeBased;

var builder = Host.CreateApplicationBuilder(args);

builder.AddInfrastructure();
builder.AddPersistence();
builder.Services.AddCore();

var accessKey = builder.Configuration["Messaging:AccessKey"] ?? "";
var secretKey = builder.Configuration["Messaging:SecretKey"] ?? "";
var region = Amazon.RegionEndpoint.GetBySystemName(builder.Configuration["Messaging:Region"] ?? "us-east-1");
var queueName = builder.Configuration["Messaging:QueueName"] ?? "passly-imports";
var sqsConfig = new AmazonSQSConfig { RegionEndpoint = region };

builder.Services.AddRebus(cfg => cfg
    .Transport(t =>
    {
        if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
        {
            t.UseAmazonSQS(accessKey, secretKey, sqsConfig, queueName, new AmazonSQSTransportOptions());
        }
        else
        {
            // On ECS Fargate, IAM task role provides credentials via the default credential chain
            t.UseAmazonSQS(queueName, sqsConfig, new AmazonSQSTransportOptions());
        }
    })
    .Routing(r => r.TypeBased().Map<ChatImportCreated>("passly-imports")));

builder.Services.AutoRegisterHandlersFromAssemblyOf<ChatImportCreatedHandler>();

builder.Build().Run();
