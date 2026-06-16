class EmulatorManager {
    constructor(options = {}) {
        this.options = options;
        this.emulator = null;
        this.term = null;
        this.state = 'idle';
        this.stateListeners = [];
        this.errorListeners = [];
        this.progressListeners = [];
        this.ui = {};
        this.stats = {
            startTime: 0,
            uptime: 0,
            downloadProgress: 0,
            downloadTotal: 0,
        };
        this._uptimeInterval = null;
        this._useCanvas = false;
    }

    getState() {
        return this.state;
    }

    onStateChange(callback) {
        this.stateListeners.push(callback);
        return () => {
            this.stateListeners = this.stateListeners.filter(cb => cb !== callback);
        };
    }

    onError(callback) {
        this.errorListeners.push(callback);
        return () => {
            this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
        };
    }

    onProgress(callback) {
        this.progressListeners.push(callback);
        return () => {
            this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
        };
    }

    _setState(newState) {
        if (this.state === newState) return;
        const oldState = this.state;
        this.state = newState;
        this.stateListeners.forEach(cb => {
            try { cb(newState, oldState); } catch (e) { console.error('State listener error:', e); }
        });
        this._updateUI();
    }

    setUI(elements) {
        this.ui = elements;
        this._bindUIEvents();
        this._updateUI();
        if (this.ui.terminal) {
            this.ui.terminal.addEventListener('click', function () {
                if (this.term) {
                    try { this.term.focus(); } catch (e) {}
                }
            }.bind(this));
        }
    }

    _bindUIEvents() {
        const self = this;
        if (this.ui.startBtn) {
            this.ui.startBtn.addEventListener('click', () => self.start());
        }
        if (this.ui.restartBtn) {
            this.ui.restartBtn.addEventListener('click', () => self.restart());
        }
        if (this.ui.stopBtn) {
            this.ui.stopBtn.addEventListener('click', () => self.stop());
        }
        if (this.ui.fullscreenBtn) {
            this.ui.fullscreenBtn.addEventListener('click', () => self._toggleFullscreen());
        }
    }

    _updateUI() {
        const state = this.state;
        const isIdle = state === 'idle';
        const isLoading = state === 'loading';
        const isRunning = state === 'running';
        const isStopped = state === 'stopped';
        const isError = state === 'error';

        if (this.ui.statusIndicator) {
            this.ui.statusIndicator.className = 'status-indicator ' + state;
        }
        if (this.ui.statusText) {
            const labels = {
                idle: '就绪',
                loading: '加载中...',
                running: '运行中',
                stopped: '已停止',
                error: '错误',
            };
            this.ui.statusText.textContent = labels[state] || state;
        }

        if (this.ui.startBtn) {
            this.ui.startBtn.disabled = isLoading || isRunning;
            this.ui.startBtn.style.display = isRunning ? 'none' : '';
        }
        if (this.ui.restartBtn) {
            this.ui.restartBtn.disabled = isLoading || isIdle || isError;
        }
        if (this.ui.stopBtn) {
            this.ui.stopBtn.disabled = isLoading || isIdle || isStopped || isError;
        }

        if (this.ui.loadingOverlay) {
            this.ui.loadingOverlay.classList.toggle('hidden', !isLoading);
        }
        if (this.ui.loadingText) {
            this.ui.loadingText.textContent = isLoading ? '正在加载 Linux 系统...' : '';
        }
    }

    start() {
        if (this.state === 'running' || this.state === 'loading') return;
        if (this.emulator) {
            this.destroy();
        }

        if (location.protocol === 'file:') {
            this._handleError(new Error('不支持 file:// 协议，请使用 start.bat 启动 HTTP 服务器'));
            return;
        }

        this._setState('loading');
        this.stats.startTime = Date.now();
        this._startUptimeCounter();

        try {
            this._createEmulator();
        } catch (error) {
            this._handleError(error);
        }
    }

    async stop() {
        if (!this.emulator) return;
        try {
            this._setState('stopped');
            await this.emulator.stop();
            this._stopUptimeCounter();
        } catch (error) {
            this._handleError(error);
        }
    }

    restart() {
        const wasRunning = this.state === 'running' || this.state === 'stopped';
        if (this.emulator) {
            try {
                this.emulator.rh();
                this._setState('running');
            } catch (e) {
                this.destroy();
                this.start();
            }
        } else {
            this.start();
        }
    }

    destroy() {
        this._stopUptimeCounter();
        if (this.term) {
            try { this.term.dispose(); } catch (e) {}
            this.term = null;
        }
        if (this.emulator) {
            try { this.emulator.Aa(); } catch (e) {}
            this.emulator = null;
        }
        this._setState('idle');
    }

    sendText(text) {
        if (!this.emulator || this.state !== 'running') {
            if (this.term) {
                try { this.term.write(text); } catch (e) {}
            }
            return;
        }
        try {
            for (var i = 0; i < text.length; i++) {
                this.emulator.v.send('serial0-input', text.charCodeAt(i));
            }
        } catch (error) {
            console.error('Send error:', error);
        }
    }

    _createEmulator() {
        const self = this;

        var hasSAB = typeof CONFIG !== 'undefined' && CONFIG.hasSharedArrayBuffer;
        if (!hasSAB) {
            console.warn('SharedArrayBuffer 不可用，已禁用 JIT 加速');
        }

        const opt = {
            ej: this.options.wasmPath || 'v86/v86.wasm',
            G: this.options.memory_size || 128 * 1024 * 1024,
            uj: true,
            Ef: !hasSAB,
            Ab: { url: this.options.biosUrl || 'bios/seabios.bin' },
            ce: { url: this.options.vgaBiosUrl || 'bios/vgabios.bin' },
            Sb: 0x132,
        };

        if (this.ui.screenContainer) {
            opt.screen = { Ac: this.ui.screenContainer, Xl: false };
        }

        if (this.options.imageUrl) {
            if (this.options.imageType === 'cdrom') {
                opt.P = { url: this.options.imageUrl };
            } else if (this.options.imageType === 'hda') {
                opt.K = { url: this.options.imageUrl };
            } else {
                opt.R = { url: this.options.imageUrl };
            }
        }

        this.emulator = new V86(opt);

        this.emulator.v.register('emulator-loaded', function () {
            self._setState('running');
            if (self.term) {
                setTimeout(function () { self.term.focus(); }, 500);
            }
        }, this.emulator);

        this.emulator.v.register('download-progress', function (p) {
            self.stats.downloadProgress = p.loaded;
            self.stats.downloadTotal = p.total || 0;
            self.progressListeners.forEach(cb => {
                try { cb(p.loaded, p.total); } catch (e) { console.error('Progress listener error:', e); }
            });
        }, this.emulator);

        this.emulator.v.register('download-error', function (p) {
            self._handleError(new Error('Download failed: ' + (p.rg || 'unknown')));
        }, this.emulator);

        this.emulator.v.register('emulator-stopped', function () {
            self._setState('stopped');
            self._stopUptimeCounter();
        }, this.emulator);

        self._initXterm();
    }

    _initXterm() {
        if (typeof Terminal === 'undefined') return;

        const self = this;
        const container = this.ui.terminal;
        if (!container) return;

        if (this.term) {
            try { this.term.dispose(); } catch (e) {}
            this.term = null;
        }

        this.term = new Terminal({
            cursorBlink: true,
            convertEol: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            theme: {
                background: '#0a0a0a',
                foreground: '#f0f0f0',
                cursor: '#00ff88',
                selectionBackground: '#335',
                black: '#000000',
                red: '#cc0000',
                green: '#4e9a06',
                yellow: '#c4a000',
                blue: '#3465a4',
                magenta: '#75507b',
                cyan: '#06989a',
                white: '#d3d7cf',
                brightBlack: '#555753',
                brightRed: '#ef2929',
                brightGreen: '#8ae234',
                brightYellow: '#fce94f',
                brightBlue: '#729fcf',
                brightMagenta: '#ad7fa8',
                brightCyan: '#34e2e2',
                brightWhite: '#eeeeee',
            }
        });

        this.term.open(container);
        this.term.focus();

        this.term.onData(function (data) {
            self.sendText(data);
        });

        if (this.emulator) {
            this.emulator.v.register('serial0-output-byte', function (byte) {
                if (self.term) {
                    try { self.term.write(Uint8Array.of(byte)); } catch (e) {}
                }
            }, this.emulator);
        }
    }

    writeToTerminal(text) {
        if (this.term) {
            this.term.write(text);
        }
    }

    _handleError(error) {
        console.error('Emulator error:', error);
        this._setState('error');
        this._stopUptimeCounter();
        this.errorListeners.forEach(cb => {
            try { cb(error); } catch (e) { console.error('Error listener error:', e); }
        });
    }

    _startUptimeCounter() {
        this._stopUptimeCounter();
        this._uptimeInterval = setInterval(() => {
            this.stats.uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
            if (this.ui.statusUptime) {
                this.ui.statusUptime.textContent = this._formatUptime(this.stats.uptime);
            }
        }, 1000);
    }

    _stopUptimeCounter() {
        if (this._uptimeInterval) {
            clearInterval(this._uptimeInterval);
            this._uptimeInterval = null;
        }
    }

    _formatUptime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    _toggleFullscreen() {
        const el = this.ui.terminalWrapper || document.getElementById('app');
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    setImageUrl(url, type) {
        this.options.imageUrl = url;
        if (type) this.options.imageType = type;
    }

    toggleDisplayMode(mode) {
        this._useCanvas = mode === 'canvas';
        if (this.ui.terminal) {
            this.ui.terminal.style.display = this._useCanvas ? 'none' : '';
        }
        if (this.ui.screenContainer) {
            this.ui.screenContainer.style.display = this._useCanvas ? '' : 'none';
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EmulatorManager };
}
