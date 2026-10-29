# ---- Build stage: compile and publish ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the project file first so the restore layer is cached until packages change
COPY OnlineEventTicketManagement.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish OnlineEventTicketManagement.csproj -c Release -o /app/publish --no-restore

# ---- Runtime stage: small image with only the ASP.NET runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "OnlineEventTicketManagement.dll"]
