using Microsoft.Extensions.DependencyInjection;
using Passly.Abstractions.Interfaces;
using Passly.Core.Ingest;
using Passly.Core.Modeling;
using Passly.Core.Services;
using Passly.Core.Status;

namespace Passly.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        services.AddScoped<GetStatusHandler>();
        services.AddScoped<CreateChatImportHandler>();
        services.AddScoped<GetChatImportsHandler>();
        services.AddScoped<ParseChatImportHandler>();
        services.AddSingleton<WhatsAppChatParser>();
        services.AddScoped<IEncryptionService, AesGcmEncryptionService>();
        services.AddScoped<CreateSubmissionHandler>();
        services.AddScoped<GetSubmissionsHandler>();
        services.AddScoped<GetSubmissionHandler>();
        services.AddScoped<UpdateSubmissionStepHandler>();
        return services;
    }
}
