using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Passly.Abstractions.Contracts;
using Passly.Abstractions.Interfaces;
using Passly.Api.Tests.Auth;
using Passly.Persistence;
using NSubstitute;

namespace Passly.Api.Tests.Endpoints;

public sealed class ImportEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly string _dbName = Guid.NewGuid().ToString();

    public ImportEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:passlydb", "Host=localhost;Database=test");
            builder.ConfigureServices(services =>
            {
                RemoveDbContextServices<AppDbContext>(services);

                services.AddDbContext<AppDbContext>(opts => opts.UseInMemoryDatabase(_dbName));

                var checker = Substitute.For<IDbContextChecker>();
                checker.CanConnectAsync(Arg.Any<CancellationToken>()).Returns(true);
                services.RemoveAll<IDbContextChecker>();
                services.AddScoped(_ => checker);

                services.AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                        TestAuthHandler.SchemeName, _ => { });
            });
        }).CreateClient();
    }

    private async Task<string> CreateSubmission()
    {
        var response = await _client.PostAsJsonAsync("/api/submissions", new { label = "Test" });
        var body = await response.Content.ReadFromJsonAsync<SubmissionResponse>();
        return body!.Id.ToString();
    }

    [Fact]
    public async Task PostImport_ValidFile_Returns201()
    {
        var submissionId = await CreateSubmission();
        var content = BuildMultipartContent("test-chat.txt", "Hello world", submissionId, "passphrase12345");

        var response = await _client.PostAsync("/api/imports", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<CreateChatImportResponse>();
        body.Should().NotBeNull();
        body!.FileName.Should().Be("test-chat.txt");
        body.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task PostImport_EmptyFile_Returns400()
    {
        var content = BuildMultipartContent("empty.txt", "", Guid.NewGuid().ToString(), "passphrase12345");

        var response = await _client.PostAsync("/api/imports", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostImport_InvalidExtension_Returns400()
    {
        var content = BuildMultipartContent("photo.jpg", "binary data", Guid.NewGuid().ToString(), "passphrase12345");

        var response = await _client.PostAsync("/api/imports", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostImport_ShortPassphrase_Returns400()
    {
        var content = BuildMultipartContent("chat.txt", "Hello", Guid.NewGuid().ToString(), "short");

        var response = await _client.PostAsync("/api/imports", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostImport_DuplicateFile_Returns409()
    {
        var submissionId = await CreateSubmission();
        var content1 = BuildMultipartContent("chat.txt", "same content", submissionId, "passphrase12345");
        await _client.PostAsync("/api/imports", content1);

        var content2 = BuildMultipartContent("chat-copy.txt", "same content", submissionId, "passphrase12345");
        var response = await _client.PostAsync("/api/imports", content2);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetImports_ReturnsImportsForUser()
    {
        var submissionId = await CreateSubmission();
        var content = BuildMultipartContent("chat.txt", "Hello world", submissionId, "passphrase12345");
        await _client.PostAsync("/api/imports", content);

        var response = await _client.GetAsync($"/api/imports?submissionId={submissionId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ChatImportSummaryResponse[]>();
        body.Should().NotBeNull();
        body.Should().ContainSingle();
        body![0].FileName.Should().Be("chat.txt");
    }

    [Fact]
    public async Task PostImport_ValidFile_IsProcessedByRebus()
    {
        var submissionId = await CreateSubmission();
        var chatContent = "[02/14/26, 2:30:00 PM] Alice: Hello!\n[02/14/26, 2:31:00 PM] Bob: Hi there!";
        var content = BuildMultipartContent("chat.txt", chatContent, submissionId, "passphrase12345");

        var postResponse = await _client.PostAsync("/api/imports", content);
        postResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Give Rebus time to process the message
        await Task.Delay(2000);

        var getResponse = await _client.GetAsync($"/api/imports?submissionId={submissionId}");
        var imports = await getResponse.Content.ReadFromJsonAsync<ChatImportSummaryResponse[]>();
        imports.Should().ContainSingle();
        imports![0].Status.Should().Be("Parsed");
    }

    [Fact]
    public async Task PostImport_MissingSubmissionId_Returns400()
    {
        var content = BuildMultipartContent("chat.txt", "Hello", "", "passphrase12345");

        var response = await _client.PostAsync("/api/imports", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private static MultipartFormDataContent BuildMultipartContent(
        string fileName, string fileContent, string submissionId, string passphrase)
    {
        var content = new MultipartFormDataContent();

        var fileBytes = Encoding.UTF8.GetBytes(fileContent);
        var fileStreamContent = new ByteArrayContent(fileBytes);
        fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        content.Add(fileStreamContent, "file", fileName);

        content.Add(new StringContent(submissionId), "submissionId");
        content.Add(new StringContent(passphrase), "passphrase");

        return content;
    }

    private static void RemoveDbContextServices<TContext>(IServiceCollection services) where TContext : DbContext
    {
        var contextName = typeof(TContext).FullName!;
        var toRemove = services.Where(d =>
            d.ServiceType.FullName?.Contains(contextName) == true ||
            d.ImplementationType?.FullName?.Contains(contextName) == true ||
            (d.ServiceType.IsGenericType && d.ServiceType.GenericTypeArguments.Any(t => t == typeof(TContext))))
            .ToList();
        foreach (var descriptor in toRemove)
            services.Remove(descriptor);
    }

}
