using Amazon.Runtime;
using Amazon.SecurityToken;
using Amazon.SQS;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Passly.Abstractions.Contracts;
using Passly.Api.Endpoints;
using Passly.Core;
using Passly.Core.ChatImports;
using Passly.Infrastructure;
using Passly.Persistence;
using Rebus.Config;
using Rebus.Routing.TypeBased;
using Rebus.Transport.InMem;

var builder = WebApplication.CreateBuilder(args);

builder.AddInfrastructure();
builder.AddPersistence();
builder.Services.AddCore();

var messagingTransport = builder.Configuration["Messaging:Transport"] ?? "inmemory";

builder.Services.AddRebus(cfg =>
{
    cfg.Routing(r => r.TypeBased().Map<ChatImportCreated>("passly-imports"));

    if (messagingTransport == "sqs")
    {
        var region = builder.Configuration["Messaging:Region"] ?? "us-east-1";
        var assumeRoleArn = builder.Configuration["AWS:AssumeRoleArn"];
        var regionEndpoint = Amazon.RegionEndpoint.GetBySystemName(region);
        var sqsConfig = new AmazonSQSConfig { RegionEndpoint = regionEndpoint };
        var sqsCredentials = FallbackCredentialsFactory.GetCredentials();

        if (!string.IsNullOrWhiteSpace(assumeRoleArn))
        {
            sqsCredentials = new AssumeRoleAWSCredentials(
                sqsCredentials,
                assumeRoleArn,
                $"passly-{builder.Environment.EnvironmentName.ToLowerInvariant()}");
        }

        cfg.Transport(t => t.UseAmazonSQSAsOneWayClient(
            sqsCredentials,
            sqsConfig,
            new AmazonSQSTransportOptions()));
    }
    else
    {
        cfg.Transport(t => t.UseInMemoryTransport(new InMemNetwork(), "passly-imports"));
    }

    return cfg;
});

builder.Services.AutoRegisterHandlersFromAssemblyOf<ChatImportCreatedHandler>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:CognitoAuthority"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Auth:CognitoClientId"],
            ValidateLifetime = true,
        };
    });
builder.Services.AddAuthorization();

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
app.UseAuthentication();
app.UseAuthorization();
app.MapDefaultEndpoints();
app.MapStatusEndpoints();
app.MapLogEndpoints();
app.MapImportEndpoints();
app.MapSubmissionEndpoints();

app.Run();

public partial class Program;
