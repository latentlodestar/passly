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
        services.AddScoped<GetChatImportMessagesHandler>();
        services.AddScoped<GetRepresentativeMessagesHandler>();
        services.AddScoped<ParseChatImportHandler>();
        services.AddSingleton<WhatsAppChatParser>();
        services.AddScoped<IEncryptionService, AesGcmEncryptionService>();
        services.AddScoped<CreateSubmissionHandler>();
        services.AddScoped<GetSubmissionsHandler>();
        services.AddScoped<GetSubmissionHandler>();
        services.AddScoped<UpdateSubmissionStepHandler>();

        // Embedding & curation
        services.AddSingleton<IEmbeddingService>(sp =>
        {
            var modelDir = Path.Combine(AppContext.BaseDirectory, "Models");
            var modelPath = Path.Combine(modelDir, "all-MiniLM-L6-v2.onnx");
            var vocabPath = Path.Combine(modelDir, "vocab.txt");
            return new OnnxEmbeddingService(modelPath, vocabPath);
        });
        services.AddSingleton<IMessageCurator, MessageCurator>();

        return services;
    }
}
