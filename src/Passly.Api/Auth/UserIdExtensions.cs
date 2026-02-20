using System.Security.Claims;

namespace Passly.Api.Auth;

public static class UserIdExtensions
{
    public static string GetUserId(this HttpContext context)
    {
        return context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue("sub")
            ?? throw new InvalidOperationException("User ID claim not found.");
    }
}
