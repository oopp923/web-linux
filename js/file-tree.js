var FileTree = {
    manager: null,
    currentPath: '/',
    expanded: {},
    history: [],
    historyPos: -1,

    init: function (opts) {
        this.manager = opts.manager;
        this._bindUI();
        this._showStatus('启动系统后自动加载');
    },

    _bindUI: function () {
        var self = this;
        document.getElementById('fm-refresh').onclick = function () { self.refresh(); };
        document.getElementById('fm-up').onclick = function () { self._goUp(); };
        document.getElementById('fm-back').onclick = function () { self._goBack(); };
        document.getElementById('fm-newdir').onclick = function () { self.promptNewDir(); };
        document.getElementById('fm-upload').onclick = function () { self.promptUpload(); };
        document.getElementById('fm-addrbar').onclick = function () { self._goHome(); };
    },

    _showStatus: function (msg) {
        var list = document.getElementById('fm-list');
        list.innerHTML = '<div class="fm-status">' + msg + '</div>';
        document.getElementById('fm-status-text').textContent = msg;
    },

    _updatePath: function () {
        document.getElementById('fm-path').textContent = this.currentPath;
        document.getElementById('fm-back').disabled = this.historyPos <= 0;
    },

    _pushHistory: function (path) {
        this.history = this.history.slice(0, this.historyPos + 1);
        this.history.push(path);
        if (this.history.length > 50) this.history.shift();
        this.historyPos = this.history.length - 1;
    },

    _goUp: function () {
        if (this.currentPath === '/') return;
        var parent = this.currentPath.lastIndexOf('/');
        var up = parent > 0 ? this.currentPath.substring(0, parent) : '/';
        this._pushHistory(up);
        this.currentPath = up;
        this.expanded = {};
        this.refresh();
    },

    _goBack: function () {
        if (this.historyPos <= 0) return;
        this.historyPos--;
        this.currentPath = this.history[this.historyPos];
        this.expanded = {};
        this.refresh();
    },

    _goHome: function () {
        if (this.currentPath === '/') return;
        this._pushHistory('/');
        this.currentPath = '/';
        this.expanded = {};
        this.refresh();
    },

    refresh: async function () {
        var m = this.manager;
        if (!m || m.state !== 'running') {
            this._showStatus('请先启动系统');
            return;
        }
        this._updatePath();
        var list = document.getElementById('fm-list');
        list.innerHTML = '<div class="fm-status">加载中...</div>';
        await this._renderTree(list, this.currentPath, 0);
        document.getElementById('fm-status-text').textContent = '就绪';
    },

    _renderTree: async function (container, path, depth) {
        var self = this;
        var items = await this._listDir(path);
        container.innerHTML = '';
        if (items.length === 0 && depth > 0) {
            container.innerHTML = '<div class="fm-item" style="padding-left:' + (depth * 22 + 4) + 'px;padding-right:12px;height:24px;color:#666;font-size:12px;"><span style="width:16px;flex-shrink:0"></span><span style="width:20px;margin-right:4px"></span>(空目录)</div>';
            return;
        }
        var fragment = document.createDocumentFragment();
        // .. entry
        if (depth === 0 && path !== '/') {
            var upRow = document.createElement('div');
            upRow.className = 'fm-item';
            upRow.style.paddingLeft = '4px';
            upRow.style.paddingRight = '12px';
            upRow.style.color = '#888';
            upRow.innerHTML = '<span style="width:16px;flex-shrink:0"></span><span class="fm-item-icon">📁</span><span class="fm-item-name">..</span>';
            upRow.onclick = function () { self._goUp(); };
            upRow.style.cursor = 'pointer';
            fragment.appendChild(upRow);
        }
        for (var i = 0; i < items.length; i++) {
            var e = items[i];
            var row = this._createRow(e, path, depth);
            fragment.appendChild(row);
            if (e.isDir) {
                var childPath = this._fullPath(path, e.name);
                var childWrap = document.createElement('div');
                childWrap.id = 'fm-children-' + this._idFromPath(childPath);
                childWrap.style.display = this.expanded[childPath] ? '' : 'none';
                fragment.appendChild(childWrap);
            }
        }
        container.appendChild(fragment);
        // Expand pre-expanded directories
        for (var i2 = 0; i2 < items.length; i2++) {
            var e2 = items[i2];
            if (e2.isDir) {
                var childPath = this._fullPath(path, e2.name);
                if (this.expanded[childPath]) {
                    var childContainer = document.getElementById('fm-children-' + this._idFromPath(childPath));
                    if (childContainer) {
                        await this._renderTree(childContainer, childPath, depth + 1);
                    }
                }
            }
        }
    },

    _idFromPath: function (path) {
        return (path || '/').replace(/[^a-zA-Z0-9]/g, '_');
    },

    _createRow: function (entry, parentPath, depth) {
        var self = this;
        var fullPath = this._fullPath(parentPath, entry.name);
        var row = document.createElement('div');
        row.className = 'fm-item';
        row.style.paddingLeft = (depth * 22 + 4) + 'px';
        row.style.paddingRight = '12px';

        var toggle = document.createElement('span');
        toggle.style.cssText = 'width:16px;flex-shrink:0;text-align:center;cursor:pointer;color:#888;font-size:10px;user-select:none;';
        if (entry.isDir) {
            var isExp = !!this.expanded[fullPath];
            toggle.textContent = isExp ? '▾' : '▸';
            toggle.onclick = function (p, ep) {
                return function (e) {
                    e.stopPropagation();
                    self.expanded[p] = !self.expanded[p];
                    self._toggleDir(p, ep, depth);
                };
            }(fullPath, entry.name);
        } else {
            toggle.textContent = '';
        }
        row.appendChild(toggle);

        var icon = document.createElement('span');
        icon.className = 'fm-item-icon';
        icon.textContent = entry.isDir ? '📁' : '📄';
        row.appendChild(icon);

        var nameEl = document.createElement('span');
        nameEl.className = 'fm-item-name';
        nameEl.textContent = entry.name;
        if (entry.isDir) {
            nameEl.onclick = function (p) {
                return function () {
                    self._pushHistory(p);
                    self.currentPath = p;
                    self.expanded = {};
                    self.refresh();
                };
            }(fullPath);
            nameEl.style.cursor = 'pointer';
            nameEl.title = '点击进入目录';
        } else {
            nameEl.onclick = function (p) {
                return function () { self._catFile(p); };
            }(fullPath);
            nameEl.style.cursor = 'pointer';
            nameEl.title = '点击 cat 到终端';
        }
        row.appendChild(nameEl);

        // Right-click context menu
        row.oncontextmenu = function (p, isD) {
            return function (ev) {
                ev.preventDefault();
                self._showContextMenu(ev, p, isD);
            };
        }(fullPath, entry.isDir);

        return row;
    },

    _toggleDir: async function (path, name, depth) {
        var container = document.getElementById('fm-children-' + this._idFromPath(path));
        if (!container) return;
        var isExp = this.expanded[path];
        container.style.display = isExp ? '' : 'none';
        if (isExp) {
            await this._renderTree(container, path, depth + 1);
        }
    },

    _listDir: async function (path) {
        var m = this.manager;
        if (!m || m.state !== 'running') return [];
        var out = await m.execCommand('ls -la "' + path + '" 2>/dev/null');
        return this._parseLs(out);
    },

    _parseLs: function (output) {
        var lines = output.split('\n');
        var entries = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i].trim();
            if (!l) continue;
            var parts = l.split(/\s+/);
            if (parts.length < 9) continue;
            var perms = parts[0];
            if (perms.length < 10 || perms[0] !== '-' && perms[0] !== 'd' && perms[0] !== 'l') continue;
            var isDir = perms[0] === 'd';
            var size = parts[4];
            var name = parts.slice(8).join(' ');
            if (name === '.' || name === '..') continue;
            var sizeStr;
            if (isDir) sizeStr = '';
            else {
                var sz = parseInt(size, 10);
                if (sz >= 1048576) sizeStr = (sz / 1048576).toFixed(1) + ' MB';
                else if (sz >= 1024) sizeStr = (sz / 1024).toFixed(1) + ' KB';
                else sizeStr = sz + ' B';
            }
            entries.push({ name: name, isDir: isDir, sizeStr: sizeStr, size: isDir ? -1 : parseInt(size, 10) || 0 });
        }
        entries.sort(function (a, b) {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
        });
        return entries;
    },

    _fullPath: function (base, name) {
        if (base === '/') return '/' + name;
        return base + '/' + name;
    },

    _catFile: function (path) {
        var m = this.manager;
        if (!m || m.state !== 'running') return;
        m.sendText('cat "' + path + '"\n');
    },

    _detectCWD: function () {
        var m = this.manager;
        if (!m || !m.term) return null;
        try {
            var lines = [];
            for (var i = 0; i < m.term.buffer.active.length; i++) {
                var line = m.term.buffer.active.getLine(i);
                if (line) lines.push(line.translateToString());
            }
            for (var j = lines.length - 1; j >= 0; j--) {
                var l = lines[j].trim();
                var idx = l.lastIndexOf('#');
                if (idx > 0) {
                    var cwd = l.substring(0, idx).trim();
                    if (cwd === '~' || cwd === '~#') return '/root';
                    if (cwd.startsWith('~/')) return '/root/' + cwd.substring(2);
                    if (cwd.startsWith('/')) return cwd;
                    return '/root/' + cwd;
                }
            }
        } catch (e) {}
        return null;
    },

    // --- Context menu ---
    _showContextMenu: function (ev, path, isDir) {
        var self = this;
        var existing = document.getElementById('fm-context-menu');
        if (existing) existing.remove();

        var menu = document.createElement('div');
        menu.id = 'fm-context-menu';
        menu.style.cssText =
            'position:fixed;left:' + ev.clientX + 'px;top:' + ev.clientY + 'px;' +
            'background:#252526;border:1px solid #333;border-radius:4px;padding:4px 0;' +
            'z-index:1000;min-width:140px;box-shadow:0 4px 12px rgba(0,0,0,0.5);';

        var items = [];
        if (isDir) {
            items.push({ label: '📂 打开', action: function () {
                self._pushHistory(path);
                self.currentPath = path;
                self.expanded = {};
                self.refresh();
            }});
            items.push({ label: '📁 新建文件夹', action: function () { self.promptNewDir(path); }});
            items.push({ label: '📄 新建文件', action: function () { self.promptNewFile(path); }});
        } else {
            items.push({ label: '📄 查看 (cat)', action: function () { self._catFile(path); }});
            items.push({ label: '✏️ 编辑', action: function () { self._editFile(path); }});
        }
        items.push({ label: '✂️ 重命名', action: function () { self.promptRename(path); }});
        items.push({ label: '🗑️ 删除', action: function () { self.promptDelete(path); }});
        items.push({ type: 'sep' });
        items.push({ label: '📋 复制路径', action: function () {
            navigator.clipboard.writeText(path).catch(function () {});
        }});

        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (it.type === 'sep') {
                var sep = document.createElement('div');
                sep.style.cssText = 'height:1px;background:#333;margin:4px 8px;';
                menu.appendChild(sep);
                continue;
            }
            var item = document.createElement('div');
            item.textContent = it.label;
            item.style.cssText = 'padding:4px 16px;cursor:default;color:#ccc;font-size:12px;';
            item.onmouseover = function () { this.style.background = '#094771'; };
            item.onmouseout = function () { this.style.background = 'transparent'; };
            item.onclick = function (action) {
                return function () {
                    action();
                    menu.remove();
                };
            }(it.action);
            menu.appendChild(item);
        }

        document.body.appendChild(menu);
        var close = function (e) { if (e.target !== menu) { menu.remove(); document.removeEventListener('click', close); } };
        setTimeout(function () { document.addEventListener('click', close); }, 10);
    },

    _editFile: function (path) {
        var m = this.manager;
        if (!m || m.state !== 'running') return;
        var self = this;
        var name = path.split('/').filter(Boolean).pop();
        m.execCommand('cat "' + path + '" 2>/dev/null').then(function (content) {
            // Clean up: strip shell prompts and command echoes
            content = self._cleanCapture(content);
            self._openEditor(path, name, content || '');
        });
    },

    _catFile: function (path) {
        var m = this.manager;
        if (!m || m.state !== 'running') return;
        var self = this;
        var name = path.split('/').filter(Boolean).pop();
        m.execCommand('cat "' + path + '" 2>/dev/null').then(function (content) {
            content = self._cleanCapture(content);
            self._openPreview(path, name, content || '(空文件)');
        });
    },

    // Strip shell prompts and command echoes from captured output
    _cleanCapture: function (text) {
        if (!text) return '';
        var lines = text.split('\n');
        var clean = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            var t = l.trim();
            // Skip lines that are just shell prompts (~#, /tmp#, etc.)
            if (/^[^\n]*#\s*$/.test(t)) continue;
            // Skip lines that look like echoed commands (start with prompt then command)
            if (/^[^\n]*#\s+echo\s+/.test(t)) continue;
            // Skip the "2>/dev/null" cat command echo
            if (/^[^\n]*#\s+cat\s+/.test(t)) continue;
            // Skip the marker echo line
            if (/^@@.+@@$/.test(t)) continue;
            clean.push(l);
        }
        return clean.join('\n').trim();
    },

    _openEditor: function (path, name, content) {
        var self = this;
        var old = document.getElementById('fm-edit-modal');
        if (old) old.remove();
        var ov = document.createElement('div');
        ov.id = 'fm-edit-modal';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:2000;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1e1e1e;border:1px solid #333;border-radius:6px;width:90%;max-width:700px;max-height:85vh;display:flex;flex-direction:column;';

        var hdr = document.createElement('div');
        hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #333;flex-shrink:0;';
        hdr.innerHTML = '<span style="color:#ccc;font-size:13px">编辑: ' + name.replace(/</g, '&lt;') + '</span>';

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'background:transparent;border:none;color:#888;cursor:pointer;font-size:14px;';
        closeBtn.onclick = function () { ov.remove(); };
        hdr.appendChild(closeBtn);
        box.appendChild(hdr);

        var textarea = document.createElement('textarea');
        textarea.value = content || '';
        textarea.style.cssText = 'flex:1;min-height:300px;padding:10px;background:#111;color:#ccc;border:none;font-family:Consolas,monospace;font-size:13px;resize:none;outline:none;tab-size:4;';
        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                var start = this.selectionStart, end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
        box.appendChild(textarea);

        var footer = document.createElement('div');
        footer.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;padding:8px 14px;border-top:1px solid #333;flex-shrink:0;';

        var cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = 'background:#333;color:#ccc;border:none;padding:6px 16px;border-radius:3px;cursor:pointer;font-size:12px;';
        cancelBtn.onclick = function () { ov.remove(); };
        footer.appendChild(cancelBtn);

        var saveBtn = document.createElement('button');
        saveBtn.textContent = '💾 保存到 VM';
        saveBtn.style.cssText = 'background:#007acc;color:#fff;border:none;padding:6px 16px;border-radius:3px;cursor:pointer;font-size:12px;';
        saveBtn.onclick = function () {
            var text = textarea.value;
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
            self._writeFile(path, text, function () {
                saveBtn.textContent = '✅ 已保存';
                setTimeout(function () { if (ov.parentNode) ov.remove(); }, 1500);
            });
        };
        footer.appendChild(saveBtn);
        box.appendChild(footer);
        ov.appendChild(box);
        document.body.appendChild(ov);
        textarea.focus();
    },

    // Write text content to a VM file using printf octal escapes
    _writeFile: function (path, text, callback) {
        var m = this.manager;
        if (!m) { if (callback) callback(); return; }
        var marker = '_EOF_' + Date.now().toString(36) + '_';
        var full = "cat > " + path + " << '" + marker + "'\n" + text + "\n" + marker + "\n";
        m.sendText(full);
        // Wait for VM to process: ~15ms per char + 2s base
        var delay = Math.min(5000, 2000 + Math.round(full.length * 0.015));
        if (callback) setTimeout(callback, delay);
    },

    _openPreview: function (path, name, content) {
        var self = this;
        var old = document.getElementById('fm-preview-modal');
        if (old) old.remove();
        var ov = document.createElement('div');
        ov.id = 'fm-preview-modal';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:2000;';
        var box = document.createElement('div');
        box.style.cssText = 'background:#1e1e1e;border:1px solid #333;border-radius:6px;width:80%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;';
        var hdr = document.createElement('div');
        hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #333;flex-shrink:0;';
        hdr.innerHTML = '<span style="color:#ccc;font-size:13px">' + name.replace(/</g, '&lt;') + '</span>';
        var closeB = document.createElement('button');
        closeB.textContent = '✕';
        closeB.style.cssText = 'background:transparent;border:none;color:#888;cursor:pointer;font-size:14px;';
        closeB.onclick = function () { ov.remove(); };
        hdr.appendChild(closeB);
        box.appendChild(hdr);
        var pre = document.createElement('pre');
        pre.style.cssText = 'flex:1;overflow:auto;padding:14px;margin:0;color:#ccc;font-family:Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;';
        pre.textContent = content || '(空文件)';
        box.appendChild(pre);
        var footer = document.createElement('div');
        footer.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;padding:8px 14px;border-top:1px solid #333;flex-shrink:0;';
        var editBtn = document.createElement('button');
        editBtn.textContent = '✏️ 编辑';
        editBtn.style.cssText = 'background:#333;color:#ccc;border:none;padding:6px 16px;border-radius:3px;cursor:pointer;font-size:12px;';
        editBtn.onclick = function () { ov.remove(); self._editFile(path); };
        footer.appendChild(editBtn);
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = 'background:#007acc;color:#fff;border:none;padding:6px 16px;border-radius:3px;cursor:pointer;font-size:12px;';
        closeBtn.onclick = function () { ov.remove(); };
        footer.appendChild(closeBtn);
        box.appendChild(footer);
        ov.appendChild(box);
        document.body.appendChild(ov);
    },

    // --- Operations ---
    _sendCmd: function (cmd) {
        this.manager.sendText(cmd + '\n');
    },

    promptNewDir: function (parent) {
        parent = parent || this.currentPath;
        var name = prompt('新文件夹名:', '新建文件夹');
        if (!name || !name.trim()) return;
        name = name.trim().replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g, '_');
        this._sendCmd('mkdir -p "' + this._fullPath(parent, name) + '"');
        var self = this;
        setTimeout(function () { self.refresh(); }, 300);
    },

    promptNewFile: function (parent) {
        parent = parent || this.currentPath;
        var name = prompt('新文件名:', '新建文件.txt');
        if (!name || !name.trim()) return;
        name = name.trim().replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g, '_');
        this._sendCmd('touch "' + this._fullPath(parent, name) + '"');
        var self = this;
        setTimeout(function () { self.refresh(); }, 300);
    },

    promptRename: function (path) {
        var oldName = path.split('/').filter(Boolean).pop();
        var newName = prompt('重命名为:', oldName);
        if (!newName || !newName.trim() || newName === oldName) return;
        newName = newName.trim().replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g, '_');
        var parent = path.lastIndexOf('/') > 0 ? path.substring(0, path.lastIndexOf('/')) : '/';
        this._sendCmd('mv "' + path + '" "' + parent + '/' + newName + '"');
        var self = this;
        setTimeout(function () { self.refresh(); }, 300);
    },

    promptDelete: function (path) {
        var name = path.split('/').filter(Boolean).pop();
        if (!confirm('确定要删除 "' + name + '" 吗？')) return;
        this._sendCmd('rm -rf "' + path + '"');
        var self = this;
        setTimeout(function () { self.refresh(); }, 300);
    },

    promptUpload: function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        var self = this;
        input.onchange = function () {
            var files = Array.from(input.files);
            if (!files.length) return;
            self._showStatus('上传中...');
            self._uploadFiles(files, 0);
        };
        input.click();
    },

    _uploadFiles: function (files, idx) {
        if (idx >= files.length) { this.refresh(); return; }
        var f = files[idx];
        var rel = f.webkitRelativePath || f.name;
        var parts = rel.split('/');
        var vmPath = this.currentPath === '/' ? '/' + parts.join('/') : this.currentPath + '/' + parts.join('/');
        vmPath = vmPath.replace(/\/+/g, '/');
        var self = this;
        if (f.size === 0) {
            self._sendCmd('mkdir -p "' + vmPath + '"');
            setTimeout(function () { self._uploadFiles(files, idx + 1); }, 10);
        } else {
            var reader = new FileReader();
            reader.onload = function (e) {
                var content = e.target.result;
                var bytes = new Uint8Array(content.length);
                for (var i2 = 0; i2 < content.length; i2++) bytes[i2] = content.charCodeAt(i2) & 0xFF;
                self._sendCmd('mkdir -p "' + vmPath.substring(0, vmPath.lastIndexOf('/')) + '"');
                var n = 50;
                for (var i3 = 0; i3 < bytes.length; i3 += n) {
                    var s = '';
                    var end = Math.min(i3 + n, bytes.length);
                    for (var j = i3; j < end; j++) {
                        var o = bytes[j].toString(8);
                        while (o.length < 3) o = '0' + o;
                        s += '\\' + o;
                    }
                    self.manager.sendText("printf '" + s + "' " + (i3 === 0 ? '>' : '>>') + " " + vmPath + "\n");
                }
                setTimeout(function () { self._uploadFiles(files, idx + 1); }, 20);
            };
            reader.readAsBinaryString ? reader.readAsBinaryString(f) : reader.readAsText(f);
        }
    },
};

window.FileTree = FileTree;
