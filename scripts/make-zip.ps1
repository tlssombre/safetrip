param([string]$Source, [string]$Destination)
# Crée un vrai zip (entrées avec "/" et fichiers cachés inclus) lisible par cPanel.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Remove-Item $Destination -Force -ErrorAction SilentlyContinue
$base = (Resolve-Path $Source).Path.TrimEnd('\')
$zip = [System.IO.Compression.ZipFile]::Open($Destination, 'Create')
Get-ChildItem $Source -Recurse -Force -File | ForEach-Object {
  $rel = $_.FullName.Substring($base.Length + 1).Replace('\', '/')
  [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, 'Optimal')
}
$zip.Dispose()
