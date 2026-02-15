using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Passly.Abstractions.Interfaces;
using Passly.Persistence.Services;

namespace Passly.Persistence;

public static class DependencyInjection
{
    public static TBuilder AddPersistence<TBuilder>(this TBuilder builder, string connectionName = "passlydb")
        where TBuilder : IHostApplicationBuilder
    {
        builder.AddNpgsqlDbContext<IngestDbContext>(connectionName);
        builder.AddNpgsqlDbContext<ModelingDbContext>(connectionName);

        builder.Services.AddScoped<IDbContextChecker, DbContextChecker>();

        return builder;
    }
}
