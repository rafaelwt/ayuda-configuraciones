# Script para eliminar archivos .txt que ya tienen versión .md
$mdFiles = Get-ChildItem -Path "e:\Sistemas\ayuda-configuraciones" -Filter "*.md" -Recurse

$deletedCount = 0
foreach ($mdFile in $mdFiles) {
    $txtPath = $mdFile.FullName -replace '\.md$', '.txt'
    
    # Verificar si existe el archivo .txt correspondiente
    if (Test-Path $txtPath) {
        # Eliminar el archivo .txt
        Remove-Item -Path $txtPath -Force
        Write-Host "Eliminado: $txtPath"
        $deletedCount++
    }
}

Write-Host "`nSe han eliminado $deletedCount archivos .txt que ya tenían versión .md"
