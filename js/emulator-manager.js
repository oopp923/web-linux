class EmulatorManager {
    constructor(options = {}) {
        this.options = options;
        this.emulator = null;
        this.term = null;
        this.state = 'idle';
        this._listeners = [];
        this._uptimeInterval = null;
        this._displayMode = 'terminal';
        this.stats = { startTime: 0, uptime: 0 };
    }

    on(name, cb) {
        this._listeners.push({ name, cb });
    }

    _emit(name, ...args) {
        this._listeners.filter(l => l.name === name).forEach(l => {
            try { l.cb(...args); } catch (e) { console.error(e); }
        });
    }

    _setState(newState) {
        if (this.state === newState) return;
        const old = this.state;
        this.state = newState;
        this._emit('state', newState, old);
        this._updateUI();
    }

    setUI(elements) {
        this.ui = elements;
        Object.entries(elements).forEach(([key, el]) => {
            if (!el) return;
            if (key === 'startBtn') el.onclick = () => this.start();
            if (key === 'stopBtn') el.onclick = () => this.stop();
            if (key === 'restartBtn') el.onclick = () => this.restart();
        });
        if (this.ui.terminal) {
            this.ui.terminal.onclick = () => { if (this.term) this.term.focus(); };
        }
        this._updateUI();
    }

    _updateUI() {
        const s = this.state;
        const idle = s === 'idle', loading = s === 'loading';
        const running = s === 'running', stopped = s === 'stopped', err = s === 'error';
        const labels = { idle: '就绪', loading: '加载中...', running: '运行中', stopped: '已停止', error: '错误' };
        if (this.ui.statusIndicator) this.ui.statusIndicator.className = 'status-indicator ' + s;
        if (this.ui.statusText) this.ui.statusText.textContent = labels[s] || s;
        if (this.ui.startBtn) { this.ui.startBtn.disabled = loading || running; this.ui.startBtn.style.display = running ? 'none' : ''; }
        if (this.ui.restartBtn) this.ui.restartBtn.disabled = loading || idle || err;
        if (this.ui.stopBtn) this.ui.stopBtn.disabled = loading || idle || stopped || err;
        if (this.ui.loadingOverlay) this.ui.loadingOverlay.classList.toggle('hidden', !loading);
        if (this.ui.loadingText) this.ui.loadingText.textContent = loading ? '正在加载 Linux 系统...' : '';
    }

    start() {
        if (this.state === 'running' || this.state === 'loading') return;
        if (this.emulator) this.destroy();
        if (location.protocol === 'file:') {
            this._emit('error', new Error('不支持 file:// 协议'));
            return;
        }
        this._setState('loading');
        this.stats.startTime = Date.now();
        this._startUptime();
        try { this._createEmulator(); } catch (e) { this._emit('error', e); }
    }

    async stop() {
        if (!this.emulator) return;
        this._setState('stopped');
        await this.emulator.stop();
        this._stopUptime();
    }

    restart() {
        if (this.emulator) {
            try { this.emulator.rh(); this._setState('running'); }
            catch (e) { this.destroy(); this.start(); }
        } else { this.start(); }
    }

    destroy() {
        this._stopUptime();
        if (this.term) { try { this.term.dispose(); } catch (e) {} this.term = null; }
        if (this.emulator) { try { this.emulator.Aa(); } catch (e) {} this.emulator = null; }
        this._setState('idle');
    }

    sendText(text) {
        if (!this.emulator || this.state !== 'running') return;
        try {
            for (var i = 0; i < text.length; i++) {
                this.emulator.v.send('serial0-input', text.charCodeAt(i));
            }
        } catch (e) { console.error(e); }
    }

    // Read full terminal buffer as string
    getTerminalText() {
        if (!this.term) return '';
        var lines = [];
        try {
            for (var i = 0; i < this.term.buffer.active.length; i++) {
                var line = this.term.buffer.active.getLine(i);
                if (line) lines.push(line.translateToString());
            }
        } catch (e) {}
        return lines.join('\n');
    }

    // Execute a shell command and capture output using markers
    async execCommand(cmd, timeout) {
        if (this.state !== 'running') return '';
        timeout = timeout || 5000;
        var marker = '@@' + Date.now().toString(36) + '@@';
        var self = this;
        this.sendText('echo "' + marker + '"\n' + cmd + '\necho "' + marker + '"\n');

        var buf = '';
        var start = Date.now();
        return new Promise(function (resolve) {
            function poll() {
                buf = self.getTerminalText();
                var endIdx = buf.lastIndexOf(marker);
                if (endIdx >= 0) {
                    var startIdx = buf.indexOf(marker);
                    if (startIdx >= 0 && startIdx !== endIdx) {
                        var out = buf.substring(startIdx + marker.length, endIdx).trim();
                        resolve(out);
                        return;
                    }
                    resolve('');
                    return;
                }
                if (Date.now() - start > timeout) {
                    resolve('');
                    return;
                }
                setTimeout(poll, 200);
            }
            setTimeout(poll, 500);
        });
    }

    // --- State persistence (IndexedDB) ---
    async saveState() {
        if (!this.emulator || (this.state !== 'running' && this.state !== 'stopped')) return null;
        try {
            var buf = await this.emulator.sh();
            var key = 'v86state_' + (this.options.imageConfig?.url || 'default');
            await dbPut(key, buf);
            console.log('VM state saved (' + buf.byteLength + ' bytes)');
            return buf;
        } catch (e) {
            console.error('Save state failed:', e);
            return null;
        }
    }

    async restoreState() {
        var key = 'v86state_' + (this.options.imageConfig?.url || 'default');
        var data = await dbGet(key);
        if (!data) return false;
        try {
            if (this.emulator) this.destroy();
            this._createEmulator();
            await this._waitLoaded();
            await this.emulator.Hg(data);
            this._setState('running');
            this.write('\r\n[系统] 已恢复上次的虚拟机状态\r\n');
            return true;
        } catch (e) {
            console.error('Restore state failed:', e);
            this.destroy();
            return false;
        }
    }

    async _waitLoaded() {
        var self = this;
        return new Promise(function (resolve) {
            if (self.state === 'running') { resolve(); return; }
            self.emulator.v.register('emulator-loaded', function () {
                resolve();
            }, self.emulator);
        });
    }

    setDisplayMode(mode) {
        this._displayMode = mode;
        if (this.ui.terminal) this.ui.terminal.style.display = mode === 'vga' ? 'none' : '';
        if (this.ui.screenContainer) this.ui.screenContainer.style.display = mode === 'vga' ? '' : 'none';
    }

    _createEmulator() {
        const hasSAB = CONFIG.hasSharedArrayBuffer;
        if (!hasSAB) console.warn('SharedArrayBuffer 不可用，已禁用 JIT');

        var cfg = this.options.imageConfig || {};

        const opt = {
            ej: this.options.wasmPath || 'v86/v86.wasm',
            G: cfg.memory || 134217728,
            uj: true,
            Ef: !hasSAB,
            Ab: { url: this.options.biosUrl || 'bios/seabios.bin' },
            ce: { url: this.options.vgaBiosUrl || 'bios/vgabios.bin' },
            Sb: 0x132,
        };

        if (cfg.url) opt.P = { url: cfg.url };

        if (cfg.network) {
            opt.ac = cfg.network;
            opt.Tc = { type: cfg.netcard || "ne2k" };
        }

        if (this.ui.screenContainer) {
            opt.screen = { Ac: this.ui.screenContainer, Xl: false };
        }

        this.emulator = new V86(opt);
        const self = this;

        this.emulator.v.register('emulator-loaded', function () {
            self._setState('running');
            if (self.term) setTimeout(function () { self.term.focus(); }, 500);
        }, this.emulator);

        this.emulator.v.register('download-progress', function (p) {
            self._emit('progress', p.loaded, p.total || 0);
        }, this.emulator);

        this.emulator.v.register('download-error', function (p) {
            self._emit('error', new Error('Download failed: ' + (p.rg || 'unknown')));
        }, this.emulator);

        this.emulator.v.register('emulator-stopped', function () {
            self._setState('stopped');
            self._stopUptime();
        }, this.emulator);

        this._initXterm();
        this.setDisplayMode(this._displayMode);
    }

    _initXterm() {
        if (typeof Terminal === 'undefined' || !this.ui.terminal) return;
        if (this.term) { try { this.term.dispose(); } catch (e) {} this.term = null; }

        this.term = new Terminal({
            cursorBlink: true,
            convertEol: true,
            fontSize: this.options.fontSize || 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            theme: {
                background: '#0a0a0a', foreground: '#f0f0f0', cursor: '#00ff88',
                selectionBackground: '#335', black: '#000000', red: '#cc0000',
                green: '#4e9a06', yellow: '#c4a000', blue: '#3465a4',
                magenta: '#75507b', cyan: '#06989a', white: '#d3d7cf',
                brightBlack: '#555753', brightRed: '#ef2929', brightGreen: '#8ae234',
                brightYellow: '#fce94f', brightBlue: '#729fcf', brightMagenta: '#ad7fa8',
                brightCyan: '#34e2e2', brightWhite: '#eeeeee',
            }
        });

        this.term.open(this.ui.terminal);
        const self = this;

        this.term.onData(function (data) { self.sendText(data); });
        this.term.onResize(function (size) {
            if (self.emulator && self.emulator.v.send)
                self.emulator.v.send('serial0-resize', size.cols, size.rows);
        });

        if (this.emulator) {
            this.emulator.v.register('serial0-output-byte', function (byte) {
                if (self.term) { try { self.term.write(Uint8Array.of(byte)); } catch (e) {} }
            }, this.emulator);
        }
    }

    write(msg) {
        if (this.term) { try { this.term.write(msg); } catch (e) {} }
    }

    getTerminalContent() {
        if (this.term) {
            try { return this.term.buffer.active.getLine(0) + ''; } catch (e) {}
        }
        return '';
    }

    _startUptime() {
        this._stopUptime();
        this._uptimeInterval = setInterval(() => {
            this.stats.uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
            if (this.ui.statusUptime) {
                const s2 = this.stats.uptime;
                const h2 = Math.floor(s2 / 3600), m2 = Math.floor((s2 % 3600) / 60), sec = s2 % 60;
                this.ui.statusUptime.textContent = h2 ? h2 + 'h ' + m2 + 'm ' + sec + 's' : m2 ? m2 + 'm ' + sec + 's' : sec + 's';
            }
        }, 1000);
    }

    _stopUptime() {
        if (this._uptimeInterval) { clearInterval(this._uptimeInterval); this._uptimeInterval = null; }
    }
}

// --- IndexedDB helpers for state persistence ---
var DB_NAME = 'WebLinuxState';
var DB_VERSION = 1;

function dbOpen() {
    return new Promise(function (resolve, reject) {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function () {
            var db = req.result;
            if (!db.objectStoreNames.contains('states')) {
                db.createObjectStore('states');
            }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
    });
}

function dbPut(key, data) {
    return dbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction('states', 'readwrite');
            tx.objectStore('states').put(data, key);
            tx.oncomplete = function () { db.close(); resolve(); };
            tx.onerror = function () { db.close(); reject(tx.error); };
        });
    });
}

function dbGet(key) {
    return dbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction('states', 'readonly');
            var req = tx.objectStore('states').get(key);
            req.onsuccess = function () { db.close(); resolve(req.result); };
            req.onerror = function () { db.close(); reject(req.error); };
        });
    });
}

function dbDelete(key) {
    return dbOpen().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction('states', 'readwrite');
            tx.objectStore('states').delete(key);
            tx.oncomplete = function () { db.close(); resolve(); };
            tx.onerror = function () { db.close(); reject(tx.error); };
        });
    });
}
