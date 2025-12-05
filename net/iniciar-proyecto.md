# Guía Rápida - .NET CLI

## Crear Solución

```bash
dotnet new sln -n MiProyecto
```

## Crear Proyectos

```bash
# Web API
dotnet new webapi -n MiProyecto.API

# Librería de clases
dotnet new classlib -n MiProyecto.Domain

# Consola
dotnet new console -n MiProyecto.Console

# MVC
dotnet new mvc -n MiProyecto.Web

# Blazor
dotnet new blazor -n MiProyecto.Blazor
```

## Agregar Proyectos a la Solución

```bash
dotnet sln add MiProyecto.API
dotnet sln add MiProyecto.Domain

# O todos de una vez
dotnet sln add **/*.csproj
```

## Agregar Referencias entre Proyectos

```bash
# MiProyecto.API referencia a MiProyecto.Domain
dotnet add MiProyecto.API reference MiProyecto.Domain
```

## Instalar Paquetes NuGet

```bash
# Instalar paquete
dotnet add MiProyecto.API package Newtonsoft.Json

# Versión específica
dotnet add MiProyecto.API package Serilog --version 3.1.1

# Listar paquetes instalados
dotnet list MiProyecto.API package

# Eliminar paquete
dotnet remove MiProyecto.API package Newtonsoft.Json
```

## Ejecutar y Compilar

```bash
# Compilar
dotnet build

# Ejecutar
dotnet run --project MiProyecto.API

# Limpiar
dotnet clean

# Restaurar paquetes
dotnet restore
```

## Ver Plantillas Disponibles

```bash
dotnet new list
```