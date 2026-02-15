FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props nuget.config ./
COPY src/Passly.Api/Passly.Api.csproj src/Passly.Api/
COPY src/Passly.Core/Passly.Core.csproj src/Passly.Core/
COPY src/Passly.Abstractions/Passly.Abstractions.csproj src/Passly.Abstractions/
COPY src/Passly.Persistence/Passly.Persistence.csproj src/Passly.Persistence/
COPY src/Passly.Infrastructure/Passly.Infrastructure.csproj src/Passly.Infrastructure/
RUN dotnet restore src/Passly.Api/Passly.Api.csproj

COPY src/ src/
RUN dotnet publish src/Passly.Api/Passly.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Passly.Api.dll"]
