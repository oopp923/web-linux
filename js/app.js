(function () {
    'use strict';

    if (typeof V86 === 'undefined') {
        document.getElementById('terminal').textContent =
            '[错误] v86 库未加载\n请运行 setup.ps1 下载所需文件\nhttps://copy.sh/v86/';
        document.getElementById('btn-start').disabled = true;
        return;
    }

    var currentImage = 'buildroot';
    var manager = new EmulatorManager({ imageConfig: IMAGES[currentImage] });

    manager.setUI({
        terminal: document.getElementById('terminal'),
        screenContainer: document.getElementById('screen-container'),
        startBtn: document.getElementById('btn-start'),
        restartBtn: document.getElementById('btn-restart'),
        stopBtn: document.getElementById('btn-stop'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        statusUptime: document.getElementById('status-uptime'),
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
    });

    var displayToggle = document.getElementById('btn-display');
    var terminalEl = document.getElementById('terminal');
    var screenEl = document.getElementById('screen-container');
    var displayMode = 'terminal';

    displayToggle.onclick = function () {
        displayMode = displayMode === 'terminal' ? 'vga' : 'terminal';
        terminalEl.style.display = displayMode === 'terminal' ? '' : 'none';
        screenEl.style.display = displayMode === 'vga' ? '' : 'none';
        displayToggle.textContent = displayMode === 'terminal' ? 'VGA 画面' : '切换终端';
    };

    var panelToggle = document.getElementById('btn-panel');
    var commandPanel = document.getElementById('command-panel');
    panelToggle.onclick = function () {
        commandPanel.classList.toggle('open');
        panelToggle.textContent = commandPanel.classList.contains('open') ? '关闭面板' : '命令面板';
    };

    var commands = {
        '文件操作': ['ls', 'ls -la', 'pwd', 'cd ..', 'mkdir 新建文件夹', 'rm 文件名', 'rm -rf 文件夹名', 'mv 旧名 新名', 'cp 源 目标', 'touch 新建文件.txt'],
        '查看编辑': ['cat 文件名', 'head 文件名', 'tail 文件名', 'less 文件名', 'echo Hello', 'printf "hello\\n"'],
        '系统信息': ['uname -a', 'whoami', 'id', 'date', 'cal', 'uptime', 'free', 'df -h'],
        '权限用户': ['who', 'su', 'sudo', 'chmod +x 文件', 'chown 用户 文件'],
        '查找帮助': ['find . -name "*.txt"', 'grep 关键词 文件', 'man 命令', '--help'],
    };

    var panelBody = commandPanel.querySelector('.panel-body');
    Object.keys(commands).forEach(function (cat) {
        var section = document.createElement('div');
        section.className = 'cmd-section';
        section.innerHTML = '<div class="cmd-cat">' + cat + '</div>';
        commands[cat].forEach(function (cmd) {
            var btn = document.createElement('button');
            btn.className = 'cmd-btn';
            btn.textContent = cmd;
            btn.onclick = function () { manager.sendText(cmd + '\n'); };
            section.appendChild(btn);
        });
        panelBody.appendChild(section);
    });

    var uploadZone = document.getElementById('upload-zone');
    var fileInput = document.getElementById('file-input');

    uploadZone.onclick = function () { fileInput.click(); };
    uploadZone.ondragover = function (e) { e.preventDefault(); uploadZone.classList.add('drag-over'); };
    uploadZone.ondragleave = function () { uploadZone.classList.remove('drag-over'); };
    uploadZone.ondrop = function (e) {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    };
    fileInput.onchange = function () {
        if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
        fileInput.value = '';
    };

    function handleFile(file) {
        if (file.size > 1048576) return manager.sendText('echo "File >1MB, too large for transfer"\n');
        var reader = new FileReader();
        reader.onload = function (e) {
            var bytes = new Uint8Array(e.target.result);
            var name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            var sz = bytes.length;
            manager.sendText('echo "Upload: ' + name + ' (' + sz + ' bytes)"\n');
            var n = 50;
            for (var i = 0; i < sz; i += n) {
                var s = '', end = Math.min(i + n, sz);
                for (var j = i; j < end; j++) {
                    var o = bytes[j].toString(8);
                    while (o.length < 3) o = '0' + o;
                    s += '\\' + o;
                }
                manager.sendText("printf '" + s + "' " + (i === 0 ? '>' : '>>') + " " + name + "\n");
            }
            manager.sendText('echo "Done: ' + name + '"\n');
        };
        reader.readAsArrayBuffer(file);
    }

    var mouselockBtn = document.getElementById('btn-mouselock');
    mouselockBtn.onclick = function () {
        var el = screenEl.style.display !== 'none' ? screenEl : terminalEl;
        if (document.pointerLockElement === el) {
            document.exitPointerLock();
            mouselockBtn.textContent = '锁定鼠标';
        } else {
            el.requestPointerLock();
            mouselockBtn.textContent = '解锁鼠标';
        }
    };

    document.addEventListener('pointerlockchange', function () {
        if (document.pointerLockElement !== screenEl && document.pointerLockElement !== terminalEl) {
            mouselockBtn.textContent = '锁定鼠标';
        }
    });

    // --- File Manager ---
    var filesBtn = document.getElementById('btn-files');
    var filesPanel = document.getElementById('file-tree');
    var filesOpen = false;

    FileTree.init({ manager: manager });

    filesBtn.onclick = function () {
        filesOpen = !filesOpen;
        filesPanel.classList.toggle('open', filesOpen);
        filesBtn.classList.toggle('active', filesOpen);
        filesBtn.textContent = filesOpen ? '关闭文件' : '文件管理';
        if (filesOpen && manager.state === 'running') {
            var cwd = FileTree._detectCWD();
            if (cwd) {
                FileTree.currentPath = cwd;
                FileTree.history = [cwd];
                FileTree.historyPos = 0;
            }
            FileTree.refresh();
        }
    };

    manager.on('state', function (state) {
        // nothing
    });

    // --- C Playground ---
    var playgroundBtn = document.getElementById('btn-editor');
    var playgroundOpen = false;

    CEditor.init({
        sendToTerminal: function (code) {
            manager.sendText("cat > /tmp/test.c << 'EOF'\n" + code + '\nEOF\n');
            manager.sendText('echo "------ Compile & Run ------" && tcc -run /tmp/test.c 2>&1 || gcc /tmp/test.c -o /tmp/test 2>&1 && /tmp/test\n');
        },
        onOpen: function () {
            playgroundOpen = true;
            playgroundBtn.textContent = '关闭乐园';
            playgroundBtn.classList.add('active');
        },
        onClose: function () {
            playgroundOpen = false;
            playgroundBtn.textContent = 'C 语言乐园';
            playgroundBtn.classList.remove('active');
        }
    });

    playgroundBtn.onclick = function () {
        if (playgroundOpen) {
            CEditor.close();
        } else {
            CEditor.open();
        }
    };

    // --- State persistence ---
    var saveBtn = document.getElementById('btn-save');
    var loadBtn = document.getElementById('btn-load');
    var autoSaveTimer = null;

    saveBtn.onclick = async function () {
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
        await manager.saveState();
        saveBtn.textContent = '已保存';
        setTimeout(function () { saveBtn.textContent = '保存状态'; saveBtn.disabled = false; }, 2000);
    };

    loadBtn.onclick = async function () {
        if (manager.state === 'loading') return;
        loadBtn.disabled = true;
        loadBtn.textContent = '恢复中...';
        var ok = await manager.restoreState();
        loadBtn.textContent = ok ? '已恢复' : '无存档';
        setTimeout(function () { loadBtn.textContent = '恢复状态'; loadBtn.disabled = false; }, 2000);
    };

    // Auto-save every 60 seconds while running
    manager.on('state', function (state) {
        if (state === 'running') {
            if (!autoSaveTimer) {
                autoSaveTimer = setInterval(function () {
                    manager.saveState();
                }, 60000);
            }
        } else {
            if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; }
        }
    });

    // Auto-save on page unload
    window.addEventListener('beforeunload', function () {
        if (manager.state === 'running' || manager.state === 'stopped') {
            manager.saveState();
        }
    });

    document.getElementById('btn-export').onclick = function () {
        var content = '';
        if (manager.term) {
            var lines = [];
            for (var i = 0; i < manager.term.buffer.active.length; i++) {
                var line = manager.term.buffer.active.getLine(i);
                if (line) lines.push(line.translateToString());
            }
            content = lines.join('\n');
        }
        if (!content) content = 'No terminal content.';
        var blob = new Blob([content], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'terminal-log.txt';
        a.click();
    };

    // --- Image selector ---
    var select = document.getElementById('image-select');
    Object.keys(IMAGES).forEach(function (key) {
        var opt = document.createElement('option');
        opt.value = key;
        opt.textContent = IMAGES[key].label;
        opt.title = IMAGES[key].desc;
        select.appendChild(opt);
    });

    var switching = false;
    select.onchange = function () {
        if (switching) return;
        var key = select.value;
        if (key === currentImage && manager.state === 'running') return;
        switching = true;
        select.disabled = true;
        currentImage = key;
        manager.write('\r\n[信息] 切换镜像: ' + IMAGES[key].label + '\r\n');
        manager.destroy();
        manager.options.imageConfig = IMAGES[key];
        var self = manager;
        setTimeout(function () { self.start(); switching = false; select.disabled = false; }, 100);
    };

    // --- Events ---
    manager.on('state', function (state) {
        if (state === 'running') {
            manager.write('\r\n[信息] 系统已启动 (' + IMAGES[currentImage].label + ')\r\n');
            autoSetup();
        }
    });

    manager.on('error', function (err) {
        manager.write('\r\n[错误] ' + (err.message || err) + '\r\n');
    });

    manager.on('progress', function (current, total) {
        var el = document.getElementById('loading-text');
        if (el && total > 0) el.textContent = '下载中... ' + Math.round(current / total * 100) + '%';
    });

    if (location.protocol === 'file:') {
        manager.write('[错误] 不支持 file:// 协议\n');
    } else {
        manager.write('选择镜像，点击"启动系统"开始\r\n');
    }



    function autoSetup() {
        setTimeout(function () {
            var s = "export PS1='\\w# '\n" +
                "alias tree='find . 2>/dev/null | sort | sed \"s;[^/]*/;  ;g\"'\n";
            for (var j = 0; j < s.length; j++) {
                setTimeout(function (k) {
                    if (manager && manager.state === 'running')
                        manager.sendText(String.fromCharCode(s.charCodeAt(k)));
                }, j * 30, j);
            }
        }, 10000);
    }
})();
