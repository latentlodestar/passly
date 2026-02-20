using Passly.Abstractions.Contracts;
using Passly.Api.Auth;
using Passly.Core.Submissions;

namespace Passly.Api.Endpoints;

public static class SubmissionEndpoints
{
    public static WebApplication MapSubmissionEndpoints(this WebApplication app)
    {
        app.MapPost("/api/submissions", async (
            CreateSubmissionRequest request,
            HttpContext httpContext,
            CreateSubmissionHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Label))
                return Results.BadRequest(new { error = "label is required." });

            var userId = httpContext.GetUserId();
            var response = await handler.HandleAsync(userId, request, ct);
            return Results.Created($"/api/submissions/{response.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateSubmission")
        .WithTags("Submissions");

        app.MapGet("/api/submissions", async (
            HttpContext httpContext,
            GetSubmissionsHandler handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetUserId();
            return Results.Ok(await handler.HandleAsync(userId, ct));
        })
        .RequireAuthorization()
        .WithName("GetSubmissions")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            GetSubmissionHandler handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetUserId();
            var response = await handler.HandleAsync(id, userId, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("GetSubmission")
        .WithTags("Submissions");

        app.MapDelete("/api/submissions/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            DeleteSubmissionHandler handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetUserId();
            var deleted = await handler.HandleAsync(id, userId, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("DeleteSubmission")
        .WithTags("Submissions");

        app.MapPatch("/api/submissions/{id:guid}/step", async (
            Guid id,
            UpdateSubmissionStepRequest request,
            HttpContext httpContext,
            UpdateSubmissionStepHandler handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetUserId();
            var response = await handler.HandleAsync(id, userId, request, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("UpdateSubmissionStep")
        .WithTags("Submissions");

        app.MapPost("/api/submissions/{id:guid}/analyze", async (
            Guid id,
            AnalyzeSubmissionRequest request,
            HttpContext httpContext,
            AnalyzeSubmissionHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var userId = httpContext.GetUserId();
            var (response, error) = await handler.HandleAsync(id, userId, request, ct);

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
        .RequireAuthorization()
        .WithName("AnalyzeSubmission")
        .WithTags("Submissions");

        app.MapPost("/api/submissions/{id:guid}/summary", async (
            Guid id,
            GenerateSubmissionSummaryRequest request,
            HttpContext httpContext,
            GenerateSubmissionSummaryHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var userId = httpContext.GetUserId();
            var (response, error) = await handler.HandleAsync(id, userId, request, ct);

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
        .RequireAuthorization()
        .WithName("GenerateSubmissionSummary")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}/summary", async (
            Guid id,
            HttpContext httpContext,
            GetSubmissionSummaryMetadataHandler handler,
            CancellationToken ct) =>
        {
            var userId = httpContext.GetUserId();
            var response = await handler.HandleAsync(id, userId, ct);
            return response is not null ? Results.Ok(response) : Results.NotFound();
        })
        .RequireAuthorization()
        .WithName("GetSubmissionSummary")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}/summary/content", async (
            Guid id,
            string passphrase,
            HttpContext httpContext,
            GetSubmissionSummaryContentHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var userId = httpContext.GetUserId();
            var (content, error) = await handler.HandleAsync(id, userId, passphrase, ct);

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
        .RequireAuthorization()
        .WithName("GetSubmissionSummaryContent")
        .WithTags("Submissions");

        app.MapGet("/api/submissions/{id:guid}/summary/download", async (
            Guid id,
            string passphrase,
            HttpContext httpContext,
            GetSubmissionSummaryHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(passphrase))
                return Results.BadRequest(new { error = "passphrase is required." });

            var userId = httpContext.GetUserId();
            var (pdfBytes, _, error) = await handler.HandleAsync(id, userId, passphrase, ct);

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
        .RequireAuthorization()
        .WithName("DownloadSubmissionSummary")
        .WithTags("Submissions");

        return app;
    }
}
