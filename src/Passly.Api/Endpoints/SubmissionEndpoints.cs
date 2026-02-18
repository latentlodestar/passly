using Passly.Abstractions.Contracts;
using Passly.Core.Modeling;

namespace Passly.Api.Endpoints;

public static class SubmissionEndpoints
{
    public static WebApplication MapSubmissionEndpoints(this WebApplication app)
    {
        app.MapPost("/api/submissions", async (
            CreateSubmissionRequest request,
            CreateSubmissionHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.DeviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            if (string.IsNullOrWhiteSpace(request.Label))
                return Results.BadRequest(new { error = "label is required." });

            var response = await handler.HandleAsync(request, ct);
            return Results.Created($"/api/submissions/{response.Id}", response);
        })
        .WithName("CreateSubmission")
        .WithTags("Submissions");

        app.MapGet("/api/submissions", async (
            string deviceId,
            GetSubmissionsHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            return Results.Ok(await handler.HandleAsync(deviceId, ct));
        })
        .WithName("GetSubmissions")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}", async (
            Guid id,
            string deviceId,
            GetSubmissionHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            var response = await handler.HandleAsync(id, deviceId, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .WithName("GetSubmission")
        .WithTags("Submissions");

        app.MapPatch("/api/submissions/{id:guid}/step", async (
            Guid id,
            string deviceId,
            UpdateSubmissionStepRequest request,
            UpdateSubmissionStepHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            var response = await handler.HandleAsync(id, deviceId, request, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .WithName("UpdateSubmissionStep")
        .WithTags("Submissions");

        return app;
    }
}
