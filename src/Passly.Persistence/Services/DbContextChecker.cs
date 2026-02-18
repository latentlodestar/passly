using Passly.Abstractions.Interfaces;

namespace Passly.Persistence.Services;

internal sealed class DbContextChecker(AppDbContext context) : IDbContextChecker
{
    public async Task<bool> CanConnectAsync(CancellationToken ct = default)
    {
        try
        {
            return await context.Database.CanConnectAsync(ct);
        }
        catch
        {
            return false;
        }
    }
}
