# ayuda

# Si al generar el publicado no funciona en docker modificar el archivo
Program.cs  agregando :
    webBuilder.UseUrls("http://0.0.0.0:5000");
