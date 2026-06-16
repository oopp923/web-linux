$scriptDir = Split-Path -Parent $PSCommandPath
$url = "http://localhost:8080/"

Write-Host "`n  Web Linux Emulator" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  Starting server on $url" -ForegroundColor White

Start-Process $url
& "$scriptDir\server.ps1"
