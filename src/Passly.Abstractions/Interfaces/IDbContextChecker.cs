namespace Passly.Abstractions.Interfaces;

public interface IDbContextChecker
{
    Task<bool> CanConnectAsync(CancellationToken ct = default);
}
