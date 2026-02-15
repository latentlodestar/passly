# Passly

Structured risk-reduction software for high-stakes immigration paperwork. Passly guides applicants through relationship-based visa petitions step-by-step, analyzes supporting evidence, identifies documentation gaps, and helps users reach a "first-pass approval ready" state.

**This is not a legal service and not a replacement for an attorney.** Passly is structured risk-reduction software designed to help applicants avoid preventable delays, RFEs, and errors.

## The Problem

When immigration applicants make mistakes, omissions, or provide weak documentation, the consequences are severe — months of delay, Requests for Evidence (RFEs), denials, or forced re-filings. The emotional and financial cost is significant. Most errors are preventable with better structure and guidance.

## What Passly Does

1. **Structures the application process** step-by-step (TurboTax-style guided flow)
2. **Analyzes supporting evidence** — starting with chat exports (WhatsApp, etc.)
3. **Extracts relationship timeline signals** — frequency, duration, key events
4. **Identifies weak documentation areas** or missing proof
5. **Generates structured summaries** suitable for formal submission
6. **Flags potential inconsistencies or gaps**
7. **Guides users toward approval readiness**

## MVP Scope

- Import/export WhatsApp conversations into the app
- AI-powered extraction of relationship timeline signals (frequency, duration, key events)
- Structured summaries and evidence strength indicators
- Checklist of missing or weak documentation

## Long-Term Vision

- Fully guided application flow across petition types
- Smart document ingestion and classification
- Risk scoring and approval readiness indicators
- Auto-filled forms where possible
- Expansion beyond relationship visas into other high-stakes government processes

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) (10.0.100+)
- [Node.js](https://nodejs.org/) 20+ and npm
- [Docker](https://www.docker.com/) (for Aspire resource provisioning and Testcontainers)
- [Aspire CLI](https://aspire.dev) (`dotnet tool install -g aspire`)

## Architecture

.NET 10 monorepo with React web frontend, React Native mobile app, Aspire orchestration, and Postgres storage.

```
src/
  Passly.AppHost/         Aspire orchestrator
  Passly.Abstractions/    Interfaces, contracts, CQRS query/command definitions
  Passly.Core/            Handlers, business logic
  Passly.Api/             Minimal API endpoints, DI wiring, migrations-on-boot
  Passly.Persistence/     DbContexts, models, configurations, migrations
  Passly.Infrastructure/  Service defaults (OpenTelemetry, health checks), external concerns
  Passly.Web/             React + Vite + TypeScript web frontend
  Passly.Mobile/          React Native + Expo mobile app

tests/
  Passly.Core.Tests/
  Passly.Persistence.Tests/      (uses Testcontainers for Postgres)
  Passly.Api.Tests/              (integration tests with WebApplicationFactory)
```

### Layer Rules

| Layer              | May depend on              | Must NOT depend on       |
|--------------------|----------------------------|--------------------------|
| **Abstractions**   | Nothing                    | Any implementation       |
| **Core**           | Abstractions, Persistence  | Infrastructure, Api      |
| **Persistence**    | Abstractions               | Core, Infrastructure, Api|
| **Infrastructure** | Abstractions               | Core, Persistence, Api   |
| **Api**            | Core, Persistence, Infrastructure (DI only) | —        |

### Database

**Postgres** with two bounded contexts via separate DbContexts:

- **`IngestDbContext`** (schema: `ingest`) — document ingestion and raw evidence processing
- **`ModelingDbContext`** (schema: `modeling`) — analysis, scoring, and structured outputs

Each context has independent migration histories. Migrations run on boot in Api's `Program.cs`.

To add a migration:

```bash
dotnet ef migrations add <Name> \
  --context IngestDbContext \
  --output-dir Migrations/Ingest \
  --project src/Passly.Persistence \
  --startup-project src/Passly.Api
```

### Key Patterns

- **Minimal APIs** with extension methods for route mapping
- **CQRS-style handlers** in Core layer
- **DependencyInjection.cs** at each layer root wires up that layer's services
- **Aspire orchestration** provisions Postgres and coordinates startup ordering
- Centralized package versioning in `Directory.Packages.props`

## Running

### With Aspire (recommended for dev)

```bash
./scripts/dev.sh
```

Starts the Aspire dashboard, provisions Postgres, runs migrations, starts the API, and launches the frontend dev server.

### With Docker Compose

```bash
./scripts/compose-up.sh
```

### Frontend only

```bash
cd src/Passly.Web && npm install && npm run dev
```

The Vite dev server proxies `/api` and `/health` to the backend.

### Mobile

```bash
cd src/Passly.Mobile && npm install && npx expo start
```

Set `EXPO_PUBLIC_API_URL` to point at the running API (defaults to `http://localhost:5192`).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/alive` | Liveness probe |
| GET | `/api/status` | API version + DB connectivity |
| POST | `/api/log` | Frontend log forwarding |

## Testing

```bash
# All tests (.NET + frontend)
./scripts/test.sh

# .NET tests only (requires Docker for Testcontainers)
dotnet test Passly.sln

# Frontend tests
cd src/Passly.Web && npm test
```

### Test stack

- **xUnit v3** + **AwesomeAssertions** + **NSubstitute** for .NET
- **Testcontainers** for Postgres integration tests
- **Vitest** + **React Testing Library** for frontend
