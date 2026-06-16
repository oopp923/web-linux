const CONFIG = {
    v86: {
        memory_size: 128 * 1024 * 1024,
        bios: {
            url: 'bios/seabios.bin'
        },
        vga_bios: {
            url: 'bios/vgabios.bin'
        },
        wasm_path: 'v86/v86.wasm',
        boot_order: 0x132,
        serial_container: null,
        screen_container: null,
        autostart: false,
        disable_uart: false,
    },

    display: {
        font_size: 14,
        font_family: 'Consolas, "Courier New", monospace',
        background_color: '#0a0a0a',
        foreground_color: '#f0f0f0',
        cursor_color: '#00ff88',
        max_lines: 5000,
    },

    cdn: {
        v86: 'https://copy.sh/v86/build/v86_all.js',
        wasm: 'https://copy.sh/v86/build/v86.wasm',
        seabios: 'https://copy.sh/v86/bios/seabios.bin',
        vgabios: 'https://copy.sh/v86/bios/vgabios.bin',
    },

    hasSharedArrayBuffer: (function () {
        try {
            return typeof SharedArrayBuffer !== 'undefined'
                && new SharedArrayBuffer(4).byteLength === 4;
        } catch (e) {
            return false;
        }
    }()),

    images: {
        'linux': {
            name: 'Linux (Buildroot)',
            url: 'images/linux.iso',
            type: 'cdrom',
            description: '轻量级 Buildroot Linux',
            memory: 64 * 1024 * 1024,
        }
    },

    default_image: 'linux',
};
