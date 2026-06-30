// Minimal C standard headers for TCC WASM virtual filesystem
var C_HEADERS = {
    'stddef.h': '#ifndef _STDDEF_H\n#define _STDDEF_H\ntypedef __SIZE_TYPE__ size_t;\ntypedef __PTRDIFF_TYPE__ ptrdiff_t;\n#define NULL ((void*)0)\n#define offsetof(t,m) __builtin_offsetof(t,m)\n#ifndef __cplusplus\ntypedef __WCHAR_TYPE__ wchar_t;\n#endif\n#endif\n',
    'stdarg.h': '#ifndef _STDARG_H\n#define _STDARG_H\ntypedef __builtin_va_list va_list;\n#define va_start(v,l) __builtin_va_start(v,l)\n#define va_end(v) __builtin_va_end(v)\n#define va_arg(v,l) __builtin_va_arg(v,l)\n#endif\n',
    'stdbool.h': '#ifndef _STDBOOL_H\n#define _STDBOOL_H\n#define bool _Bool\n#define true 1\n#define false 0\n#define __bool_true_false_are_defined 1\n#endif\n',
    'stdio.h': '#ifndef _STDIO_H\n#define _STDIO_H\n#include <stddef.h>\n#define EOF (-1)\n#define SEEK_SET 0\n#define SEEK_CUR 1\n#define SEEK_END 2\n#define BUFSIZ 8192\ntypedef struct { int _fd; } FILE;\nextern FILE *stdin;\nextern FILE *stdout;\nextern FILE *stderr;\nint printf(const char *, ...);\nint fprintf(FILE *, const char *, ...);\nint sprintf(char *, const char *, ...);\nint snprintf(char *, size_t, const char *, ...);\nint scanf(const char *, ...);\nint fscanf(FILE *, const char *, ...);\nint sscanf(const char *, const char *, ...);\nint putchar(int);\nint puts(const char *);\nint getchar(void);\nchar *gets(char *);\nFILE *fopen(const char *, const char *);\nint fclose(FILE *);\nsize_t fread(void *, size_t, size_t, FILE *);\nsize_t fwrite(const void *, size_t, size_t, FILE *);\nint fflush(FILE *);\nint fgetc(FILE *);\nint fputc(int, FILE *);\nchar *fgets(char *, int, FILE *);\nint ungetc(int, FILE *);\nvoid perror(const char *);\nint remove(const char *);\nint rename(const char *, const char *);\nint feof(FILE *);\nint ferror(FILE *);\nvoid clearerr(FILE *);\n#endif\n',
    'stdlib.h': '#ifndef _STDLIB_H\n#define _STDLIB_H\n#include <stddef.h>\n#define EXIT_SUCCESS 0\n#define EXIT_FAILURE 1\n#define RAND_MAX 32767\ndouble atof(const char *);\nint atoi(const char *);\nlong atol(const char *);\nlong long atoll(const char *);\nvoid *malloc(size_t);\nvoid *calloc(size_t, size_t);\nvoid *realloc(void *, size_t);\nvoid free(void *);\nvoid abort(void);\nvoid exit(int);\nint atexit(void (*)(void));\nchar *getenv(const char *);\nint system(const char *);\nint rand(void);\nvoid srand(unsigned);\nvoid *bsearch(const void *, const void *, size_t, size_t, int (*)(const void *, const void *));\nvoid qsort(void *, size_t, size_t, int (*)(const void *, const void *));\nint abs(int);\nlong labs(long);\nlong long llabs(long long);\ntypedef struct { int quot; int rem; } div_t;\ntypedef struct { long quot; long rem; } ldiv_t;\ndiv_t div(int, int);\nldiv_t ldiv(long, long);\n#endif\n',
    'string.h': '#ifndef _STRING_H\n#define _STRING_H\n#include <stddef.h>\nvoid *memcpy(void *, const void *, size_t);\nvoid *memmove(void *, const void *, size_t);\nvoid *memset(void *, int, size_t);\nint memcmp(const void *, const void *, size_t);\nvoid *memchr(const void *, int, size_t);\nchar *strcpy(char *, const char *);\nchar *strncpy(char *, const char *, size_t);\nchar *strcat(char *, const char *);\nchar *strncat(char *, const char *, size_t);\nint strcmp(const char *, const char *);\nint strncmp(const char *, const char *, size_t);\nchar *strchr(const char *, int);\nchar *strrchr(const char *, int);\nsize_t strlen(const char *);\nsize_t strspn(const char *, const char *);\nsize_t strcspn(const char *, const char *);\nchar *strstr(const char *, const char *);\nchar *strtok(char *, const char *);\nchar *strdup(const char *);\n#endif\n',
    'ctype.h': '#ifndef _CTYPE_H\n#define _CTYPE_H\nint isdigit(int);\nint isalpha(int);\nint isalnum(int);\nint isupper(int);\nint islower(int);\nint isspace(int);\nint isxdigit(int);\nint ispunct(int);\nint isgraph(int);\nint isprint(int);\nint iscntrl(int);\nint toupper(int);\nint tolower(int);\n#endif\n',
    'math.h': '#ifndef _MATH_H\n#define _MATH_H\ndouble sin(double);\ndouble cos(double);\ndouble tan(double);\ndouble asin(double);\ndouble acos(double);\ndouble atan(double);\ndouble atan2(double, double);\ndouble sinh(double);\ndouble cosh(double);\ndouble tanh(double);\ndouble exp(double);\ndouble log(double);\ndouble log10(double);\ndouble pow(double, double);\ndouble sqrt(double);\ndouble ceil(double);\ndouble floor(double);\ndouble fabs(double);\ndouble fmod(double, double);\n#define M_PI 3.14159265358979323846\n#define M_E 2.71828182845904523536\n#endif\n',
    'limits.h': '#ifndef _LIMITS_H\n#define _LIMITS_H\n#define CHAR_BIT 8\n#define SCHAR_MIN (-128)\n#define SCHAR_MAX 127\n#define UCHAR_MAX 255\n#define CHAR_MIN (-128)\n#define CHAR_MAX 127\n#define SHRT_MIN (-32768)\n#define SHRT_MAX 32767\n#define USHRT_MAX 65535\n#define INT_MIN (-2147483648)\n#define INT_MAX 2147483647\n#define UINT_MAX 4294967295U\n#define LONG_MIN (-2147483648L)\n#define LONG_MAX 2147483647L\n#define ULONG_MAX 4294967295UL\n#define LLONG_MIN (-9223372036854775808LL)\n#define LLONG_MAX 9223372036854775807LL\n#define ULLONG_MAX 18446744073709551615ULL\n#endif\n',
    'float.h': '#ifndef _FLOAT_H\n#define _FLOAT_H\n#define FLT_RADIX 2\n#define FLT_MANT_DIG 24\n#define FLT_DIG 6\n#define FLT_MIN 1.17549435e-38F\n#define FLT_MAX 3.40282347e+38F\n#define DBL_MANT_DIG 53\n#define DBL_DIG 15\n#define DBL_MIN 2.2250738585072014e-308\n#define DBL_MAX 1.7976931348623157e+308\n#endif\n',
};

var CEditor = {
    tcc: null,
    ready: false,
    editorEl: null,
    codeEl: null,
    outputEl: null,
    compileBtn: null,
    runBtn: null,
    terminalBtn: null,
    closeBtn: null,
    sendCallback: null,
    openCallback: null,
    closeCallback: null,
};

CEditor.init = function (options) {
    this.sendCallback = options.sendToTerminal || function () {};
    this.openCallback = options.onOpen || function () {};
    this.closeCallback = options.onClose || function () {};

    this.editorEl = document.getElementById('c-playground');
    this.codeEl = document.getElementById('c-code');
    this.outputEl = document.getElementById('c-output');
    this.compileBtn = document.getElementById('c-compile-btn');
    this.runBtn = document.getElementById('c-run-btn');
    this.terminalBtn = document.getElementById('c-terminal-btn');
    this.closeBtn = document.getElementById('c-close-btn');

    // Default hello world
    this.codeEl.value = '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';

    this.compileBtn.onclick = this.compile.bind(this);
    this.runBtn.onclick = this.run.bind(this);
    this.terminalBtn.onclick = this.sendToTerminal.bind(this);
    this.closeBtn.onclick = this.close.bind(this);

    // Try to load TCC WASM module (optional, for extra error checking)
    this._loadTCC();

    // Load content from file tree
    this.loadContent = function (text) {
        this.codeEl.value = text;
        if (!this._panelOpen) {
            document.getElementById('btn-editor').click();
        }
    };

    // Tab support in textarea
    this.codeEl.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            var start = this.selectionStart, end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
        }
    });
};

CEditor._loadTCC = async function () {
    try {
        var mod = await import('../lib/tcc.js');
        this.tcc = mod.default;
        this.ready = true;
        this._log('[系统] TCC 编译器已就绪');
    } catch (e) {
        this._log('[错误] 加载 TCC 编译器失败: ' + (e.message || e));
    }
};

CEditor._log = function (msg) {
    this.outputEl.textContent += msg + '\n';
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
};

CEditor._clearOutput = function () {
    this.outputEl.textContent = '';
};

CEditor.open = function () {
    this.editorEl.classList.add('open');
    this.codeEl.focus();
    if (this.openCallback) this.openCallback();
};

CEditor.close = function () {
    this.editorEl.classList.remove('open');
    if (this.closeCallback) this.closeCallback();
};

CEditor._makeTCCArgs = function () {
    var self = this;
    var codeStr = this.codeEl.value;
    var codePos = 0;
    return {
        stdin: function () {
            if (codePos >= codeStr.length) return null;
            return codeStr.charCodeAt(codePos++);
        },
        print: function (t) {
            if (self._runOutput !== undefined) {
                self._runOutput += t + '\n';
            }
        },
        printErr: function (t) {
            if (self.errorBuf !== undefined) {
                self.errorBuf += t + '\n';
            }
        },
        preRun: [function () {
            var FS = this.FS;
            if (!FS) return;
            try { FS.mkdir('/tcc'); } catch (e) {}
            try { FS.mkdir('/tcc/include'); } catch (e) {}
            for (var name in C_HEADERS) {
                try { FS.writeFile('/tcc/include/' + name, C_HEADERS[name]); } catch (e) {}
            }
        }],
    };
};

CEditor.compile = async function () {
    if (!this.ready) {
        this._clearOutput();
        this._log('[错误] 编译器尚未就绪，请稍后再试');
        return;
    }
    if (!this.codeEl.value.trim()) {
        this._clearOutput();
        this._log('[错误] 请输入 C 代码');
        return;
    }

    this._clearOutput();
    this._log('[编译] 正在检查...\n');

    this.errorBuf = '';
    this._runOutput = undefined;
    var opts = this._makeTCCArgs();
    opts.arguments = ['-c', '-o', '/dev/null', '-I/tcc/include', '-x', 'c', '-'];

    try {
        var result = await this.tcc(opts);
        if (this.errorBuf.trim()) {
            this._log('[编译] 发现以下问题:\n' + this.errorBuf);
        } else {
            this._log('[编译] ✓ 编译成功，无错误！');
        }
    } catch (e) {
        this._log('[错误] 编译过程异常: ' + (e.message || e));
    }
};

CEditor.run = async function () {
    if (!this.ready) {
        this._log('[错误] 编译器尚未就绪');
        return;
    }
    if (!this.codeEl.value.trim()) {
        this._log('[错误] 请输入 C 代码');
        return;
    }

    this._clearOutput();
    this.errorBuf = '';
    this._runOutput = '';

    // Step 1: compile to check for errors
    this._log('[运行] 编译检查...\n');
    var opts = this._makeTCCArgs();
    opts.arguments = ['-c', '-o', '/dev/null', '-I/tcc/include', '-x', 'c', '-'];

    try {
        var result = await this.tcc(opts);
    } catch (e) {
        this._log('[错误] 编译异常: ' + (e.message || e) + '\n');
        return;
    }

    if (this.errorBuf.trim()) {
        this._log('[编译] 发现以下问题，无法运行:\n' + this.errorBuf);
        return;
    }

    // Step 2: compilation OK, send to terminal
    this._log('[编译] ✓ 编译成功\n');
    this._log('[运行] 发送代码到虚拟机执行...\n');
    if (this.sendCallback) {
        this.sendCallback(this.codeEl.value);
        this._log('──────────────────────────────\n');
        this._log('[提示] 代码已发送到虚拟机 /tmp/test.c\n');
        this._log('[提示] 虚拟机执行: tcc -run /tmp/test.c\n');
        this._log('[提示] 或: gcc /tmp/test.c -o /tmp/test && /tmp/test\n');
        this._log('──────────────────────────────\n');
        this._log('[信息] 请在下方终端查看运行结果\n');
    }
};

CEditor.sendToTerminal = function () {
    var code = this.codeEl.value.trim();
    if (!code) return;
    this._log('[终端] 正在发送代码到虚拟机...\n');
    if (this.sendCallback) {
        this.sendCallback(code);
        this._log('[终端] ✓ 代码已发送到 /tmp/test.c\n');
        this._log('[终端] 在虚拟机中执行: tcc -run /tmp/test.c\n');
    }
};

// ============================================================
// C-to-JS transpiler — runs simple C code directly in the browser
// ============================================================

var __c_output = '';

function __c_printf(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var result = '', ai = 0;
    for (var i = 0; i < format.length; i++) {
        if (format[i] === '%' && i + 1 < format.length) {
            i++;
            switch (format[i]) {
                case 'd': case 'i': result += args[ai++] | 0; break;
                case 'u': result += (args[ai++] >>> 0); break;
                case 's': result += String(args[ai++]); break;
                case 'c': result += String.fromCharCode(args[ai++]); break;
                case 'f': result += Number(args[ai++]); break;
                case 'l': if (format[i+1]==='d'||format[i+1]==='u') { i++; if(format[i]==='d')result+=args[ai++]|0; else result+=(args[ai++]>>>0); } break;
                case 'x': result += (args[ai++] >>> 0).toString(16); break;
                case 'p': result += '0x' + (args[ai++] >>> 0).toString(16); break;
                case '%': result += '%'; break;
                default: result += '%' + format[i];
            }
        } else if (format[i] === '\\' && i + 1 < format.length) {
            i++;
            switch (format[i]) {
                case 'n': result += '\n'; break;
                case 't': result += '\t'; break;
                case 'r': result += '\r'; break;
                case '\\': result += '\\'; break;
                case '"': result += '"'; break;
                case '0': result += '\0'; break;
                default: result += '\\' + format[i];
            }
        } else {
            result += format[i];
        }
    }
    __c_output += result;
    return result.length;
}

function __c_puts(s) { __c_output += s + '\n'; return 1; }
function __c_putchar(c) { __c_output += String.fromCharCode(c); return 1; }
function __c_printf_helper(fmt) {
    // Used for fprintf, sprintf etc - simplified
    var args = Array.prototype.slice.call(arguments, 1);
    return __c_printf.apply(null, [fmt].concat(args));
}

CEditor._transpile = function (code) {
    // Remove #include lines
    code = code.replace(/#include\s*<[^>]+>/g, '');
    code = code.replace(/#include\s*"[^"]+"/g, '');

    // Remove #define
    code = code.replace(/#define\s+\w+\s+.*(?:\n|$)/g, '');

    // Remove block comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove line comments
    code = code.replace(/\/\/[^\n]*/g, '');

    // Remove extern declarations
    code = code.replace(/\bextern\s+/g, '');

    // Replace printf → __c_printf
    code = code.replace(/\bprintf\s*\(/g, '__c_printf(');
    code = code.replace(/\bputs\s*\(/g, '__c_puts(');
    code = code.replace(/\bputchar\s*\(/g, '__c_putchar(');

    // Function defs: TYPE main( → function __c_main(
    code = code.replace(/\b(int|void|char|double|float|long|short|unsigned|signed|static)\s+main\s*\(/g, 'function __c_main(');
    // Other function defs
    code = code.replace(/\b(int|void|char|double|float|long|short|unsigned|signed|static)\s+(\w+)\s*\(/g, 'function $2(');

    // Strip C types from function param list
    code = code.replace(/\(([^)]*)\)/g, function (m, p) {
        if (p.indexOf('void') >= 0 && p.replace(/\s/g, '').length <= 6) return '()';
        p = p.replace(/\b(const|volatile|register|unsigned|signed|short|long|int|char|double|float|void|struct|enum|union)\s*/g, '');
        p = p.replace(/\s*\*+\s*/g, ' ');
        p = p.replace(/\s*\[.*?\]\s*/g, '');
        p = p.replace(/\s+/g, ' ').trim();
        p = p.replace(/,\s*/g, ',');
        return '(' + p + ')';
    });

    // for (int|char|... i → for (var i
    code = code.replace(/\bfor\s*\(\s*(int|char|double|float|long|short|unsigned|signed|register|static|const)\s+/g, 'for (var ');

    // { int|char|... x; → { var x; (variable declarations in blocks)
    code = code.replace(/([{;])\s*(int|char|double|float|long|short|unsigned|signed|register|static|const|auto)\s+(?=\w)/g, '$1 var ');
    // Handle pointer variable declarations: { int *ptr; → { var ptr;
    code = code.replace(/([{;])\s*(int|char|double|float|long|short|unsigned|signed)\s+\*\s*/g, '$1 var ');

    // char str[] = "..." → var str = "..."
    code = code.replace(/\bchar\s+(\w+)\s*\[\]\s*=\s*/g, 'var $1 = ');
    // char str[N] → var str
    code = code.replace(/\bchar\s+(\w+)\s*\[\s*\d+\s*\]\s*/g, 'var $1; ');
    // int arr[N] → var arr = new Array(N)
    code = code.replace(/\b(int|long|short|double|float)\s+(\w+)\s*\[\s*(\d+)\s*\]\s*/g, 'var $2 = new Array($3); ');

    return code;
};

CEditor._runLocal = function () {
    var code = this.codeEl.value;
    if (!code.trim()) return;

    __c_output = '';
    var jsCode;

    try {
        jsCode = this._transpile(code);
        if (jsCode.indexOf('function __c_main') >= 0) {
            jsCode += '\n__c_main();\n';
        }
    } catch (e) {
        this._log('[错误] 代码转换失败: ' + (e.message || e) + '\n');
        return;
    }

    try {
        // Execute transpiled JS; capture __c_output
        var fn = new Function(jsCode);
        fn();
        if (__c_output) {
            this._log(__c_output);
        } else {
            this._log('[程序] 运行完毕（无输出）\n');
        }
    } catch (e) {
        this._log('[错误] 运行时错误: ' + (e.message || e) + '\n');
    }
};

// Run via local C-to-JS transpiler (works without VM)
CEditor.run = async function () {
    if (!this.codeEl.value.trim()) {
        this._clearOutput();
        this._log('[错误] 请输入 C 代码\n');
        return;
    }

    this._clearOutput();
    this._log('[运行] 正在转换并执行...\n');
    this._log('──────────────────────────────\n');
    this._runLocal();
    this._log('──────────────────────────────\n');
    this._log('[提示] 也可以点击"发送到终端"在虚拟机中编译运行\n');
};

// Expose globally
window.CEditor = CEditor;
