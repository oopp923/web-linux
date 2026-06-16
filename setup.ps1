#requires -Version 5.1
$ErrorActionPreference = "Continue"

function Format-Bytes {
    param([long]$b)
    if ($b -lt 1KB) { return "$b B" }
    if ($b -lt 1MB) { return "$([math]::Round($b/1KB,1)) KB" }
    return "$([math]::Round($b/1MB,1)) MB"
}

$BaseUrl = "https://copy.sh/v86"
$BaseUrlCDN = "https://cdn.jsdelivr.net/npm/xterm@5.3.0"
$Deps = @(
    @{Url = "$BaseUrl/build/v86_all.js"; Path = "v86/v86.js";        Desc = "v86 模拟器库" }
    @{Url = "$BaseUrl/build/v86.wasm";   Path = "v86/v86.wasm";      Desc = "v86 WebAssembly" }
    @{Url = "$BaseUrl/bios/seabios.bin"; Path = "bios/seabios.bin";  Desc = "SeaBIOS" }
    @{Url = "$BaseUrl/bios/vgabios.bin"; Path = "bios/vgabios.bin";  Desc = "VGA BIOS" }
    @{Url = "$BaseUrlCDN/lib/xterm.min.js";  Path = "lib/xterm.min.js";  Desc = "xterm.js" }
    @{Url = "$BaseUrlCDN/css/xterm.min.css"; Path = "lib/xterm.min.css"; Desc = "xterm CSS" }
)

$Images = @(
    @{Url = "https://i.copy.sh/linux3.iso"; Path = "images/linux.iso"; Desc = "Linux CD-ROM 镜像" }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Web Linux - 依赖下载工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($Dir in @("v86", "bios", "images")) {
    if (-not (Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        Write-Host "  [创建] $Dir" -ForegroundColor Yellow
    }
}

Write-Host "`n>>> 下载 v86 核心文件..." -ForegroundColor Green

foreach ($F in $Deps) {
    $dest = $F.Path
    if (Test-Path $dest) {
        Write-Host "  [跳过] $($F.Desc)" -ForegroundColor Gray
        continue
    }
    Write-Host "  [下载] $($F.Desc)..." -ForegroundColor Yellow -NoNewline
    try {
        Invoke-WebRequest -Uri $F.Url -OutFile $dest -UseBasicParsing -ErrorAction Stop
        $size = (Get-Item $dest).Length
        Write-Host " $(Format-Bytes $size)" -ForegroundColor Green
    } catch {
        Write-Host " 失败" -ForegroundColor Red
        Write-Host "         $_" -ForegroundColor DarkRed
    }
}

Write-Host "`n>>> 下载 Linux 镜像..." -ForegroundColor Green

foreach ($F in $Images) {
    $dest = $F.Path
    if (Test-Path $dest) {
        Write-Host "  [跳过] $($F.Desc)" -ForegroundColor Gray
        continue
    }
    Write-Host "  [下载] $($F.Desc)..." -ForegroundColor Yellow -NoNewline
    try {
        Invoke-WebRequest -Uri $F.Url -OutFile $dest -UseBasicParsing -ErrorAction Stop
        $size = (Get-Item $dest).Length
        Write-Host " $(Format-Bytes $size)" -ForegroundColor Green
    } catch {
        Write-Host " 失败" -ForegroundColor Red
        Write-Host "         提示: 可从 https://bellard.org/jslinux/ 手动下载镜像" -ForegroundColor DarkYellow
    }
}

Write-Host "`n>>> 验证文件..." -ForegroundColor Green

$all = $Deps + $Images
$ok = $true
foreach ($F in $all) {
    $exists = Test-Path $F.Path
    $s = if ($exists) { Format-Bytes (Get-Item $F.Path).Length } else { "缺失" }
    Write-Host "  $(if ($exists) {'[OK]'} else {'[!]'}) $($F.Desc) - $s" @(if ($exists) {@{ForegroundColor='Green'}} else {@{ForegroundColor='Red'}})
    if (-not $exists) { $ok = $false }
}

Write-Host ""
if ($ok) {
    Write-Host "所有文件就绪!" -ForegroundColor Cyan
    Write-Host "双击 start.bat (Windows) 或运行: python server.py" -ForegroundColor White
} else {
    Write-Host "部分文件缺失。" -ForegroundColor Yellow
}
