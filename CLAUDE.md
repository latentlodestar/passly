# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
# Development (Aspire — provisions Postgres, runs migrations, starts API + frontend)
./scripts/dev.sh

# Run all tests (.NET + frontend)
./scripts/test.sh

# .NET tests only (requires Docker for Testcontainers)
dotnet test Passly.sln

# Single .NET test project
dotnet test tests/Passly.Core.Tests

# Single .NET test by name
dotnet test tests/Passly.Core.Tests --filter "FullyQualifiedName~MyTestMethod"

# Frontend tests
cd src/Passly.Web && npm test

# Full solution build
dotnet build Passly.sln

# Add EF Core migration (substitute context/schema as needed)
dotnet ef migrations add <Name> --context IngestDbContext --output-dir Migrations/Ingest --project src/Passly.Persistence --startup-project src/Passly.Api
dotnet ef migrations add <Name> --context ModelingDbContext --output-dir Migrations/Modeling --project src/Passly.Persistence --startup-project src/Passly.Api
```

## Architecture

.NET 10 monorepo with React frontend. Consolidated layered architecture.

### Projects

| Project | Contains |
|---|---|
| **Passly.AppHost** | Aspire orchestration |
| **Passly.Abstractions** | Interfaces, contracts, CQRS query/command definitions |
| **Passly.Core** | Handlers, business logic |
| **Passly.Api** | Endpoints, DI wiring, Program.cs, migrations-on-boot |
| **Passly.Persistence** | DbContexts, Models, Configurations, Migrations |
| **Passly.Infrastructure** | Service defaults (OpenTelemetry, health checks), external concerns (HTTP clients, clock) |
| **Passly.Web** | React frontend |

### Dependency graph

```
AppHost → Api
Api → Core, Persistence, Infrastructure
Core → Abstractions, Persistence
Persistence → Abstractions
Infrastructure → Abstractions
```

### Layer dependency rules

| Layer              | May depend on              | Must NOT depend on       |
|--------------------|----------------------------|--------------------------|
| **Abstractions**   | Nothing                    | Any implementation       |
| **Core**           | Abstractions, Persistence  | Infrastructure, Api      |
| **Persistence**    | Abstractions               | Core, Infrastructure, Api|
| **Infrastructure** | Abstractions               | Core, Persistence, Api   |
| **Api**            | Core, Persistence, Infrastructure (DI only) | — |

### Key patterns

- **Minimal APIs** with extension methods for route mapping (e.g., `MapStatusEndpoints`)
- **CQRS-style handlers** in Core layer (e.g., `GetStatusHandler`)
- **Two bounded contexts** with separate DbContexts: `IngestDbContext` (schema `ingest`) and `ModelingDbContext` (schema `modeling`), each with independent migration histories
- **Migrations run on boot** in Api's `Program.cs` (no separate migrator sidecar)
- **DependencyInjection.cs** files at each layer root wire up that layer's services
- **Aspire orchestration** (`Passly.AppHost`) provisions Postgres and coordinates startup ordering

### Frontend

React 19 + TypeScript 5.7 + Vite 6. API client in `src/Passly.Web/src/api/`. Vite proxies `/api` and `/health` to the backend.

### Testing

- .NET: xUnit v3, AwesomeAssertions, NSubstitute, Testcontainers (Postgres)
- Frontend: Vitest, React Testing Library, jsdom
- Persistence tests use real Postgres via Testcontainers
- API tests use `WebApplicationFactory` for integration testing

### Package management

Centralized versioning in `Directory.Packages.props` — specify package versions there, not in individual `.csproj` files.
