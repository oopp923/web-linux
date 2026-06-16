(function () {
    'use strict';

    var manager = null;
    var terminalContainer = null;
    var initialized = false;

    function init() {
        if (initialized) return;
        if (typeof V86 === 'undefined') {
            showLibraryMissing();
            return;
        }
        initialized = true;

        terminalContainer = document.getElementById('terminal');
        if (!terminalContainer) {
            console.error('Terminal element not found');
            return;
        }

        var defaultImage = CONFIG.images[CONFIG.default_image];
        manager = new EmulatorManager({
            imageUrl: defaultImage ? defaultImage.url : 'images/linux.iso',
            imageType: defaultImage ? defaultImage.type : 'cdrom',
            memory_size: defaultImage ? defaultImage.memory : 128 * 1024 * 1024,
        });

        manager.setUI({
            terminal: terminalContainer,
            screenContainer: document.getElementById('screen-container'),
            terminalWrapper: document.querySelector('.terminal-wrapper'),
            startBtn: document.getElementById('btn-start'),
            restartBtn: document.getElementById('btn-restart'),
            stopBtn: document.getElementById('btn-stop'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.getElementById('status-text'),
            statusUptime: document.getElementById('status-uptime'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            fullscreenBtn: document.getElementById('btn-fullscreen'),
        });

        manager.onStateChange(function (state) {
            if (state === 'running') {
                manager.writeToTerminal('\r\n[信息] Linux 模拟器已启动，等待操作系统加载...\r\n');
                createHelloC();
            }
        });

        manager.onError(function (error) {
            manager.writeToTerminal('\r\n[错误] ' + (error.message || error) + '\r\n');
        });

        manager.onProgress(function (current, total) {
            updateProgress(current, total);
        });

        if (location.protocol === 'file:') {
            manager.writeToTerminal('[错误] 不支持 file:// 协议！\r\n请运行 start.bat 启动 HTTP 服务器后再打开页面。\r\n');
        } else {
            manager.writeToTerminal('Web Linux 模拟器已就绪，点击 "启动系统" 开始\r\n');
        }
    }

    function showLibraryMissing() {
        var term = document.getElementById('terminal');
        if (term) {
            term.textContent =
                '[错误] v86 库未加载。\n\n' +
                '请运行 setup.ps1 下载所需文件:\n' +
                '  PowerShell: .\\setup.ps1\n\n' +
                '或手动将 v86.js 放置在项目根目录。\n' +
                '下载地址: https://copy.sh/v86/\n';
        }
        var startBtn = document.getElementById('btn-start');
        if (startBtn) startBtn.disabled = true;
    }

    function createHelloC() {
        setTimeout(function () {
            var cmds = '';
            cmds += "export PS1='\\w# '\n";
            cmds += "alias tree='find . 2>/dev/null | sort | sed \"s;[^/]*/;  ;g\"'\n";
            var lines = [
                '#include <stdio.h>',
                '',
                'int main() {',
                '    printf("Hello, Web Linux!\\n");',
                '    return 0;',
                '}'
            ];
            for (var i = 0; i < lines.length; i++) {
                cmds += 'echo \'' + lines[i] + '\' >> hello.c\n';
            }
            cmds += 'cat hello.c\n';
            cmds += 'echo ---\n';
            for (var j = 0; j < cmds.length; j++) {
                setTimeout(function (idx) {
                    if (manager && manager.getState() === 'running') {
                        manager.sendText(String.fromCharCode(cmds.charCodeAt(idx)));
                    }
                }, j * 30, j);
            }
        }, 10000);
    }

    function updateProgress(current, total) {
        var el = document.getElementById('loading-text');
        if (!el) return;
        if (total > 0) {
            var pct = Math.round((current / total) * 100);
            el.textContent = '正在下载... ' + pct + '%';
        }
    }

    window.initApp = init;

    function tryInit() {
        if (typeof V86 !== 'undefined') {
            init();
        } else {
            setTimeout(tryInit, 200);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

})();
