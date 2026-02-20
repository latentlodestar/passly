var builder = DistributedApplication.CreateBuilder(args);

var postgresPassword = builder.AddParameter("postgres-password", secret: true);
var cognitoAuthority = builder.AddParameter("cognito-authority");
var cognitoClientIds = builder.AddParameter("cognito-client-ids");

var postgres = builder.AddPostgres("postgres", password: postgresPassword)
    .WithImage("pgvector/pgvector")
    .WithImageTag("pg17")
    .WithHostPort(5439)
    .WithDataVolume();

var db = postgres.AddDatabase("passlydb");

var migrations = builder.AddProject<Projects.Passly_MigrationRunner>("migrations")
    .WithReference(db)
    .WaitFor(db);

var api = builder.AddProject<Projects.Passly_Api>("api")
    .WithReference(db)
    .WaitFor(migrations)
    .WithEnvironment("Auth__CognitoAuthority", cognitoAuthority)
    .WithEnvironment("Auth__CognitoClientIds", cognitoClientIds);

builder.AddViteApp("web", "../Passly.Web")
    .WithEndpoint("http", e => e.Port = 5019)
    .WithReference(api)
    .WaitFor(api);

builder.AddJavaScriptApp("mobile-ios", "../Passly.Mobile", "ios")
    .WithReference(api)
    .WaitFor(api)
    .WithExplicitStart();

builder.AddJavaScriptApp("mobile-android", "../Passly.Mobile", "android")
    .WithReference(api)
    .WaitFor(api)
    .WithExplicitStart();

builder.Build().Run();
