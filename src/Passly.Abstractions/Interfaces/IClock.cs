namespace Passly.Abstractions.Interfaces;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
