using Passly.Abstractions.Interfaces;

namespace Passly.Infrastructure.Services;

internal sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
