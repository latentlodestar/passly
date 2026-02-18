FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props nuget.config ./
COPY src/Passly.Worker/Passly.Worker.csproj src/Passly.Worker/
COPY src/Passly.Core/Passly.Core.csproj src/Passly.Core/
COPY src/Passly.Abstractions/Passly.Abstractions.csproj src/Passly.Abstractions/
COPY src/Passly.Persistence/Passly.Persistence.csproj src/Passly.Persistence/
COPY src/Passly.Infrastructure/Passly.Infrastructure.csproj src/Passly.Infrastructure/
RUN dotnet restore src/Passly.Worker/Passly.Worker.csproj

COPY src/ src/
RUN dotnet publish src/Passly.Worker/Passly.Worker.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Passly.Worker.dll"]
