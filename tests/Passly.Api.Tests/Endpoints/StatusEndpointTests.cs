using System.Net;
using System.Net.Http.Json;
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

public sealed class StatusEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public StatusEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:passlydb", "Host=localhost;Database=test");
            builder.ConfigureServices(services =>
            {
                RemoveDbContextServices<AppDbContext>(services);

                services.AddDbContext<AppDbContext>(opts => opts.UseInMemoryDatabase("TestApp"));

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

    [Fact]
    public async Task GetStatus_ReturnsOkWithPayload()
    {
        var response = await _client.GetAsync("/api/status");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiStatusResponse>();
        body.Should().NotBeNull();
        body!.DatabaseConnected.Should().BeTrue();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
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
