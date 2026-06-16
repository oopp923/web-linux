$port = if ($args[0]) { $args[0] } else { 8080 }
$root = Split-Path -Parent $PSCommandPath
$url = "http://localhost:$port/"

$mime = @{
    '.html' = 'text/html'
    '.css'  = 'text/css'
    '.js'   = 'application/javascript'
    '.wasm' = 'application/wasm'
    '.bin'  = 'application/octet-stream'
    '.iso'  = 'application/octet-stream'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
}

$listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Loopback, $port)
$listener.Start()

Write-Host "`n  Web Linux Emulator" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  Server started: $url" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $line = $reader.ReadLine()

        # Parse GET /path HTTP/1.1
        if ($line -match '^GET\s+/(\S*)') {
            $path = $matches[1] -replace '/', '\'
            if ($path -eq '') { $path = 'index.html' }
            $fullPath = Join-Path $root $path

            if (Test-Path $fullPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $ext = [System.IO.Path]::GetExtension($fullPath)
                $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }

                # Read remaining request headers (quietly discard)
                while ($reader.ReadLine() -ne '') {}

                $writer = New-Object System.IO.StreamWriter($stream)
                $writer.WriteLine("HTTP/1.1 200 OK")
                $writer.WriteLine("Content-Type: $contentType")
                $writer.WriteLine("Content-Length: $($bytes.Length)")
                $writer.WriteLine("Cross-Origin-Opener-Policy: same-origin")
                $writer.WriteLine("Cross-Origin-Embedder-Policy: require-corp")
                $writer.WriteLine("Access-Control-Allow-Origin: *")
                $writer.WriteLine("Connection: close")
                $writer.WriteLine()
                $writer.Flush()
                $stream.Write($bytes, 0, $bytes.Length)
            } else {
                while ($reader.ReadLine() -ne '') {}
                $err = [System.Text.Encoding]::UTF8.GetBytes('Not found')
                $writer = New-Object System.IO.StreamWriter($stream)
                $writer.WriteLine("HTTP/1.1 404 Not Found")
                $writer.WriteLine("Content-Length: $($err.Length)")
                $writer.WriteLine("Connection: close")
                $writer.WriteLine()
                $writer.Flush()
                $stream.Write($err, 0, $err.Length)
            }
        }
        $stream.Close()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
