# publicar-windows-service

https://gunnarpeipman.com/aspnet-core-windows-service/
============ asp.net core 2.x ==========================
1. agregar el paquete nuget :  Microsoft.AspNetCore.Hosting.WindowsServices
2. en la clase: Program.cs modicar el metodo main: 
      public static void Main(string[] args)
        {
            var isService = !(Debugger.IsAttached || args.Contains("--console"));
            var pathToContentRoot = Directory.GetCurrentDirectory();
            var webHostArgs = args.Where(arg => arg != "--console").ToArray();

            if (isService)
            {
                var pathToExe = Process.GetCurrentProcess().MainModule.FileName;
                pathToContentRoot = Path.GetDirectoryName(pathToExe);
            }

            var host = WebHost.CreateDefaultBuilder(webHostArgs)
                .UseContentRoot(pathToContentRoot)
                .UseStartup<Startup>()
                .Build();

            if (isService)
            {
                host.RunAsService();
            }
            else
            {
                host.Run();
            }
        }

3. modificar  el archivo [nombreProyecto].csproj  y agregar :  <RuntimeIdentifier>win7-x64</RuntimeIdentifier>
<Project Sdk="Microsoft.NET.Sdk.Web">
 
  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
    <RuntimeIdentifier>win7-x64</RuntimeIdentifier>
  </PropertyGroup>
 
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>
 
</Project>
4.-  Generar el compilador con la opcion publicar deber generar un archivo .exe

5. crear el servicio en windows
abrir la consola en modo administrador
a) crear servicio
	sc create [nombreService] binPath= â€œD:\user\[nombreProyecto].exeâ€
b) iniciar servicio
	sc start presuService 
c) detener servicio
	sc stop presuService


