using Microsoft.AspNetCore.Mvc;
using Passly.Abstractions.Contracts;
using Passly.Api.Auth;
using Passly.Core.ChatImports;
using Rebus.Bus;

namespace Passly.Api.Endpoints;

public static class ImportEndpoints
{
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50 MB
    private static readonly HashSet<string> AllowedExtensions = [".txt", ".zip"];

    public static WebApplication MapImportEndpoints(this WebApplication app)
    {
        app.MapPost("/api/imports", async (
            IFormFile file,
            [FromForm] string submissionId,
            [FromForm] string passphrase,
            HttpContext httpContext,
            CreateChatImportHandler handler,
            IBus bus,
            CancellationToken ct) =>
        {
            if (file.Length == 0)
                return Results.BadRequest(new { error = "File is empty." });

            if (file.Length > MaxFileSizeBytes)
                return Results.BadRequest(new { error = "File exceeds 50 MB limit." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return Results.BadRequest(new { error = "Only .txt and .zip files are accepted." });

            if (!Guid.TryParse(submissionId, out var parsedSubmissionId))
                return Results.BadRequest(new { error = "submissionId is required." });

            if (string.IsNullOrWhiteSpace(passphrase) || passphrase.Length < 8)
                return Results.BadRequest(new { error = "Passphrase must be at least 8 characters." });

            var userId = httpContext.GetUserId();

            using var stream = file.OpenReadStream();
            var (response, isDuplicate, error) = await handler.HandleAsync(
                stream, file.FileName, file.ContentType, userId, parsedSubmissionId, passphrase, ct);

            if (error is not null)
                return Results.NotFound(new { error });

            if (isDuplicate)
                return Results.Conflict(new { error = "This file has already been imported." });

            await bus.Send(new ChatImportCreated(response!.Id, passphrase));

            return Results.Created($"/api/imports/{response.Id}", response);
        })
        .DisableAntiforgery()
        .RequireAuthorization()
        .WithName("CreateChatImport")
        .WithTags("Imports");

        app.MapGet("/api/imports", async (
            Guid submissionId,
            HttpContext httpContext,
            GetChatImportsHandler handler,
            CancellationToken ct) =>
        {
            if (submissionId == Guid.Empty)
                return Results.BadRequest(new { error = "submissionId is required." });

            var userId = httpContext.GetUserId();
            return Results.Ok(await handler.HandleAsync(userId, submissionId, ct));
        })
        .RequireAuthorization()
        .WithName("GetChatImports")
        .WithTags("Imports");

        app.MapGet("/api/imports/{id:guid}/representative-messages", async (
            Guid id,
            string passphrase,
            int? targetCount,
            HttpContext httpContext,
            GetRepresentativeMessagesHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(passphrase) || passphrase.Length < 8)
                return Results.BadRequest(new { error = "Passphrase must be at least 8 characters." });

            var count = targetCount ?? 200;
            if (count is < 1 or > 1000)
                return Results.BadRequest(new { error = "targetCount must be between 1 and 1000." });

            var userId = httpContext.GetUserId();
            var (response, error) = await handler.HandleAsync(id, userId, passphrase, count, ct);

            return error switch
            {
                GetRepresentativeMessagesError.NotFound => Results.NotFound(),
                GetRepresentativeMessagesError.NotParsed => Results.Conflict(
                    new { error = "Chat import has not been parsed yet." }),
                _ => Results.Ok(response),
            };
        })
        .RequireAuthorization()
        .WithName("GetRepresentativeMessages")
        .WithTags("Imports");

        app.MapGet("/api/imports/{id:guid}/messages", async (
            Guid id,
            string passphrase,
            int skip,
            int take,
            HttpContext httpContext,
            GetChatImportMessagesHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(passphrase) || passphrase.Length < 8)
                return Results.BadRequest(new { error = "Passphrase must be at least 8 characters." });

            if (take is < 1 or > 500)
                return Results.BadRequest(new { error = "take must be between 1 and 500." });

            var userId = httpContext.GetUserId();
            var response = await handler.HandleAsync(id, userId, passphrase, skip, take, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("GetChatImportMessages")
        .WithTags("Imports");

        return app;
    }
}
