using Passly.Abstractions.Contracts;
using Passly.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Passly.Core.ChatImports;

public sealed class GetChatImportsHandler(AppDbContext db)
{
    public async Task<IReadOnlyList<ChatImportSummaryResponse>> HandleAsync(
        string deviceId,
        Guid submissionId,
        CancellationToken ct = default)
    {
        return await db.ChatImports
            .Where(c => c.DeviceId == deviceId && c.SubmissionId == submissionId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ChatImportSummaryResponse(
                c.Id,
                c.SubmissionId,
                c.FileName,
                c.ContentType,
                c.Status.ToString(),
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);
    }
}
