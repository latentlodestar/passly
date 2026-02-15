using System.Reflection;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;

namespace Passly.Core.Status;

public sealed class GetStatusHandler(IClock clock, IDbContextChecker dbChecker)
{
    public async Task<ApiStatusResponse> HandleAsync(CancellationToken ct = default)
    {
        var version = Assembly.GetEntryAssembly()?.GetName().Version?.ToString() ?? "0.0.0";
        var dbConnected = await dbChecker.CanConnectAsync(ct);

        return new ApiStatusResponse(version, dbConnected, clock.UtcNow);
    }
}
