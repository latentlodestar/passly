using Microsoft.Extensions.DependencyInjection;
using Passly.Core.Status;

namespace Passly.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        services.AddScoped<GetStatusHandler>();
        return services;
    }
}
