using Passly.Abstractions.Contracts;
using Passly.Core.Submissions;

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

        app.MapDelete("/api/submissions/{id:guid}", async (
            Guid id,
            string deviceId,
            DeleteSubmissionHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            var deleted = await handler.HandleAsync(id, deviceId, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteSubmission")
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

        app.MapPost("/api/submissions/{id:guid}/analyze", async (
            Guid id,
            AnalyzeSubmissionRequest request,
            AnalyzeSubmissionHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.DeviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            if (string.IsNullOrWhiteSpace(request.Passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var (response, error) = await handler.HandleAsync(id, request, ct);

            return error switch
            {
                AnalyzeSubmissionError.SubmissionNotFound => Results.NotFound(),
                AnalyzeSubmissionError.AnalysisAlreadyExists =>
                    Results.Conflict(new { error = "An analysis already exists for this submission." }),
                AnalyzeSubmissionError.ImportNotFound =>
                    Results.NotFound(new { error = "Chat import not found." }),
                AnalyzeSubmissionError.ImportNotParsed =>
                    Results.BadRequest(new { error = "Chat import has not been parsed yet." }),
                null => Results.Created($"/api/submissions/{id}/summary", response),
                _ => Results.StatusCode(500),
            };
        })
        .WithName("AnalyzeSubmission")
        .WithTags("Submissions");

        app.MapPost("/api/submissions/{id:guid}/summary", async (
            Guid id,
            GenerateSubmissionSummaryRequest request,
            GenerateSubmissionSummaryHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.DeviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            if (string.IsNullOrWhiteSpace(request.Passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var (response, error) = await handler.HandleAsync(id, request, ct);

            return error switch
            {
                GenerateSubmissionSummaryError.SubmissionNotFound => Results.NotFound(),
                GenerateSubmissionSummaryError.AnalysisNotFound =>
                    Results.NotFound(new { error = "Run analysis before generating a PDF." }),
                GenerateSubmissionSummaryError.PdfAlreadyExists =>
                    Results.Conflict(new { error = "A PDF has already been generated." }),
                GenerateSubmissionSummaryError.WrongPassphrase =>
                    Results.Unauthorized(),
                GenerateSubmissionSummaryError.SignatureRequired =>
                    Results.BadRequest(new { error = "A signature is required to generate the PDF." }),
                GenerateSubmissionSummaryError.InvalidSignature =>
                    Results.BadRequest(new { error = "The provided signature is not valid base64." }),
                null => Results.Ok(response),
                _ => Results.StatusCode(500),
            };
        })
        .WithName("GenerateSubmissionSummary")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}/summary", async (
            Guid id,
            string deviceId,
            GetSubmissionSummaryMetadataHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            var response = await handler.HandleAsync(id, deviceId, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .WithName("GetSubmissionSummary")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}/summary/content", async (
            Guid id,
            string deviceId,
            string passphrase,
            GetSubmissionSummaryContentHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            if (string.IsNullOrWhiteSpace(passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var (content, error) = await handler.HandleAsync(id, deviceId, passphrase, ct);

            return error switch
            {
                GetSubmissionSummaryError.SubmissionNotFound => Results.NotFound(),
                GetSubmissionSummaryError.SummaryNotFound => Results.NotFound(),
                GetSubmissionSummaryError.WrongPassphrase =>
                    Results.Unauthorized(),
                null => Results.Ok(content),
                _ => Results.StatusCode(500),
            };
        })
        .WithName("GetSubmissionSummaryContent")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}/summary/download", async (
            Guid id,
            string deviceId,
            string passphrase,
            GetSubmissionSummaryHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(deviceId))
                return Results.BadRequest(new { error = "deviceId is required." });

            if (string.IsNullOrWhiteSpace(passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var (pdfBytes, _, error) = await handler.HandleAsync(id, deviceId, passphrase, ct);

            return error switch
            {
                GetSubmissionSummaryError.SubmissionNotFound => Results.NotFound(),
                GetSubmissionSummaryError.SummaryNotFound => Results.NotFound(),
                GetSubmissionSummaryError.WrongPassphrase =>
                    Results.Unauthorized(),
                null => Results.File(pdfBytes!, "application/pdf", $"summary-{id}.pdf"),
                _ => Results.StatusCode(500),
            };
        })
        .WithName("DownloadSubmissionSummary")
        .WithTags("Submissions");

        return app;
    }
}
