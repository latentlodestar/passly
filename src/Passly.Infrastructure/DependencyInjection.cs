using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Passly.Abstractions.Interfaces;
using Passly.Infrastructure.Services;

namespace Passly.Infrastructure;

public static class DependencyInjection
{
    public static TBuilder AddInfrastructure<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        builder.AddServiceDefaults();

        builder.Services.AddSingleton<IClock, SystemClock>();

        return builder;
    }
}
