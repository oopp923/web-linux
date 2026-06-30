# Web Linux Emulator (v86 + xterm.js)

## Architecture

```
index.html          ← entry, loads lib/xterm.min.js + v86/v86.js
├── css/style.css   ← dark theme, custom scrollbar
├── lib/xterm.min.{js,css}  ← local (no CDN dep)
├── js/config.js    ← CONFIG global: v86 options, display, cdn fallback URLs
├── js/emulator-manager.js  ← EmulatorManager class (v86 lifecycle + xterm integration)
└── js/app.js       ← IIFE entry: creates EmulatorManager, wires UI, runs auto-setup
bios/seabios.bin    ← SeaBIOS firmware (128 KB)
bios/vgabios.bin    ← VGA BIOS firmware (35 KB)
v86/v86.js          ← v86 all-in-one emulator library (250 KB, minified)
v86/v86.wasm        ← WebAssembly accelerator (1.4 MB)
images/linux.iso    ← Buildroot Linux CD-ROM (8.2 MB)
images/alpine-virt.iso  ← Alpine Linux Virt ISO (50 MB)
images/alpine-virt.iso  ← Alpine Linux Virt ISO (50 MB)
```

- Pure HTML/CSS/JS, no framework, no build step, no npm.
- Must be served over HTTP with `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` (v86 WASM/SharedArrayBuffer requirement).
- Does NOT work from `file://` protocol.

## Running

```bat
start.bat  ← auto-detects: python → pwsh → powershell, then opens browser
server.py  ← Python 3 HTTP server with required headers
server.ps1 ← PowerShell HTTP server (no Python needed), zero-dependency on Windows
```

## Setup (first use)

```powershell
.\setup.ps1  ← downloads v86.js, v86.wasm, seabios.bin, vgabios.bin, xterm.min.js, linux.iso
build.ps1    ← packages everything into Web-Linux.zip (~5.3 MB)
```

## v86 API quirks (minified internal names)

The v86 library in `v86/v86.js` uses minified internal property names. The documented API names do NOT match:

| v86 constructor option | Internal name | Notes |
|---|---|---|
| `wasm_path` | `ej` | Path to v86.wasm |
| `memory_size` | `G` | Default 128 MB |
| `disable_jit` | `Ef` | `true` when SharedArrayBuffer unavailable |
| `bios.url` | `Ab: {url:...}` | |
| `vga_bios.url` | `ce: {url:...}` | |
| `boot_order` | `Sb` | `0x132` = CDROM boot |
| `cdrom.url` | `P: {url:...}` | |
| `hda.url` | `K: {url:...}` | |
| `fda.url` | `R: {url:...}` | |
| `screen.container` | `screen: {Ac: ..., Xl: false}` | Canvas display (optional) |

**CRITICAL**: `uj` must always be `true`. It is NOT a user-facing option — it controls `this.ia.Zf()` which starts the CPU execution loop. Without `uj: true`, the emulator loads files but never runs. If `uj` is mistaken for `disable_jit`, the VM silently hangs with zero serial output.

Event registration uses `emulator.v.register(event, callback, ctx)` — NOT `add_listener()`.
Serial input sending uses `emulator.v.send('serial0-input', charCode)` — NOT `serial0_send()`.
- Events: `emulator-loaded`, `download-progress`, `download-error`, `emulator-stopped`, `serial0-output-byte`
- Send channel: `serial0-input`

## xterm.js integration

- xterm CDN v5.3.0 loaded locally from `lib/`.
- Terminal connected to v86 serial port via `serial0-output-byte` event (write) + `serial0-input` send channel (read).
- `convertEol: true` in Terminal options.
- Auto-focus: 500 ms after emulator-loaded, plus on click of terminal area.

## Auto-setup on boot

10 seconds after emulator loads, `app.js` types PS1/alias commands via the serial console.

```
export PS1='\w# '
alias tree='find . 2>/dev/null | sort | sed "s;[^/]*/;  ;g"'
```

## Antivirus false positive (火绒/360)

`start.bat` using embedded PowerShell (for PID tracking) can trigger Huorong/火绒 heuristic detection. If that happens, use the simplified version that only uses standard batch commands (`start /b`, `timeout`, `pause`). As a last resort, start manually:

```bat
python server.py
:: then open http://localhost:8080/
```

The `server.py` and `server.ps1` files are safe — they are plain HTTP servers with no obfuscation.

## Shell / Emulator constraints

### Buildroot (images/linux.iso)
- Minimal Buildroot system (8.2 MB, from `https://i.copy.sh/linux3.iso`).
- Serial console via kernel cmdline `console=ttyS0` — serial output from boot.
- Shell: BusyBox ash. No package manager, no gcc.

### Alpine Linux (images/alpine-virt.iso)
- Alpine Linux Virt 3.22.5 x86 (50 MB).
- Serial console: ISOLINUX `SERIAL 0 115200`, kernel output to VGA only, login prompt on serial.
- Login `root` (no password). `apk add gcc` for gcc. Network via v86 fetch proxy + virtio.
- Configure online repo before installing: `setup-apkrepos` or manually edit `/etc/apk/repositories`.

### Damn Small Linux (images/dsl.iso)
- DSL 4.11 RC2 (50 MB), boots to X11 GUI. Built-in gcc. Needs VGA mode + mouse lock.

- Mounting 9p filesystem (`mount host9p /mnt`) fails because no 9p server runs on host.
