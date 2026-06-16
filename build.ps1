#requires -Version 5.1
$ErrorActionPreference = "Stop"

$ProjectName = "Web-Linux"
$OutputDir = Join-Path $PSScriptRoot "dist"
$ZipPath = Join-Path $PSScriptRoot "$ProjectName.zip"

if (Test-Path $OutputDir) { Remove-Item -Recurse -Force $OutputDir }
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }

Write-Host ">>> 打包 $ProjectName 为便携版..." -ForegroundColor Cyan

$Dirs = @("bios", "css", "images", "js", "lib", "v86")
$Files = @("index.html", "server.py", "server.ps1", "start.bat", "start.ps1")

foreach ($Dir in $Dirs) {
    $src = Join-Path $PSScriptRoot $Dir
    $dst = Join-Path $OutputDir $Dir
    if (Test-Path $src) {
        Copy-Item -Recurse $src $dst
        Write-Host "  [复制] $Dir" -ForegroundColor Green
    } else {
        Write-Host "  [缺失] $Dir" -ForegroundColor Yellow
    }
}

foreach ($File in $Files) {
    $src = Join-Path $PSScriptRoot $File
    $dst = Join-Path $OutputDir $File
    if (Test-Path $src) {
        Copy-Item $src $dst
        Write-Host "  [复制] $File" -ForegroundColor Green
    }
}

# Verify essential files
$Essential = @(
    "index.html", "server.py", "start.bat",
    "v86/v86.js", "v86/v86.wasm",
    "bios/seabios.bin", "bios/vgabios.bin",
    "images/linux.iso",
    "lib/xterm.min.js", "lib/xterm.min.css",
    "js/config.js", "js/emulator-manager.js", "js/app.js",
    "css/style.css"
)

$allOk = $true
foreach ($F in $Essential) {
    $path = Join-Path $OutputDir $F
    if (-not (Test-Path $path)) {
        Write-Host "  [错误] 缺少: $F" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "`n打包失败: 部分文件缺失，请先运行 setup.ps1 下载依赖" -ForegroundColor Red
    exit 1
}

# Create zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($OutputDir, $ZipPath)

$size = (Get-Item $ZipPath).Length
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  打包完成!" -ForegroundColor Cyan
Write-Host "  文件: $ZipPath" -ForegroundColor White
Write-Host "  大小: $([math]::Round($size/1MB, 1)) MB" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

Remove-Item -Recurse -Force $OutputDir
