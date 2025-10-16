# Script para convertir archivos .txt a .md
$txtFiles = Get-ChildItem -Path "e:\Sistemas\ayuda-configuraciones" -Filter "*.txt" -Recurse

foreach ($file in $txtFiles) {
    $mdPath = $file.FullName -replace '\.txt$', '.md'
    
    # Verificar si el archivo .md ya existe
    if (-not (Test-Path $mdPath)) {
        # Leer el contenido del archivo .txt
        $content = Get-Content -Path $file.FullName -Raw
        
        # Crear el archivo .md con el mismo contenido (formato básico)
        $mdContent = "# " + $file.BaseName + "`n`n" + $content
        Set-Content -Path $mdPath -Value $mdContent -Encoding UTF8
        
        Write-Host "Convertido: $($file.FullName) -> $mdPath"
    } else {
        Write-Host "Ya existe: $mdPath"
    }
}

Write-Host "`nConversión completada. Archivos convertidos:"
Get-ChildItem -Path "e:\Sistemas\ayuda-configuraciones" -Filter "*.md" -Recurse | Select-Object FullName
