using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Passly.Abstractions.Interfaces;
using Passly.Persistence.Services;
using Pgvector.EntityFrameworkCore;

namespace Passly.Persistence;

public static class DependencyInjection
{
    public static TBuilder AddPersistence<TBuilder>(this TBuilder builder, string connectionName = "passlydb")
        where TBuilder : IHostApplicationBuilder
    {
        AppendDbPasswordIfPresent(builder, connectionName);

        builder.AddNpgsqlDbContext<AppDbContext>(connectionName,
            configureDbContextOptions: options => options.UseNpgsql(o => o.UseVector()));

        builder.Services.AddScoped<IDbContextChecker, DbContextChecker>();

        return builder;
    }

    /// <summary>
    /// On ECS, the base connection string comes from ConnectionStrings__passlydb (host/port/db/user)
    /// and the password comes separately from Secrets Manager as DB_PASSWORD.
    /// This appends the password to the connection string so Npgsql can authenticate.
    /// </summary>
    private static void AppendDbPasswordIfPresent<TBuilder>(TBuilder builder, string connectionName)
        where TBuilder : IHostApplicationBuilder
    {
        var dbPassword = builder.Configuration["DB_PASSWORD"];
        if (string.IsNullOrEmpty(dbPassword)) return;

        var connStr = builder.Configuration.GetConnectionString(connectionName);
        if (string.IsNullOrEmpty(connStr)) return;

        builder.Configuration[$"ConnectionStrings:{connectionName}"] = $"{connStr};Password={dbPassword}";
    }
}
