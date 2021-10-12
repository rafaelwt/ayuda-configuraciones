# FROM mcr.microsoft.com/dotnet/sdk:3.1
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1

WORKDIR /app

COPY ./publish .

# RUN dotnet publish \
# -c Release \
# -o ./output
EXPOSE 5000
ENTRYPOINT ["dotnet", "inocuidadBackendCore.dll"]
