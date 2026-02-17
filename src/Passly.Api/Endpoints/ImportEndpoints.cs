using Microsoft.AspNetCore.Mvc;
using Passly.Abstractions.Contracts;
using Passly.Core.Ingest;
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
            [FromForm] string deviceId,
            [FromForm] string passphrase,
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

            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            if (string.IsNullOrWhiteSpace(passphrase) || passphrase.Length < 8)
                return Results.BadRequest(new { error = "Passphrase must be at least 8 characters." });

            using var stream = file.OpenReadStream();
            var (response, isDuplicate) = await handler.HandleAsync(
                stream, file.FileName, file.ContentType, deviceId, passphrase, ct);

            if (isDuplicate)
                return Results.Conflict(new { error = "This file has already been imported." });

            await bus.Send(new ChatImportCreated(response!.Id, passphrase));

            return Results.Created($"/api/imports/{response.Id}", response);
        })
        .DisableAntiforgery()
        .WithName("CreateChatImport")
        .WithTags("Imports");

        app.MapGet("/api/imports", async (
            string deviceId,
            GetChatImportsHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            return Results.Ok(await handler.HandleAsync(deviceId, ct));
        })
        .WithName("GetChatImports")
        .WithTags("Imports");

        return app;
    }
}
