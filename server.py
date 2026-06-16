#!/usr/bin/env python3
"""Web Linux Server - 一键启动 v86 网页 Linux 模拟器"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def send_response(self, code, message=None):
        super().send_response(code, message)
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        f = self.send_head()
        if f:
            try:
                self.copyfile(f, self.wfile)
            finally:
                f.close()

    def do_HEAD(self):
        if self.path == '/':
            self.path = '/index.html'
        f = self.send_head()
        if f:
            f.close()


if __name__ == '__main__':
    os.chdir(DIR)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"""
  Web Linux 模拟器
  {'=' * 40}
  服务已启动: {url}
  按 Ctrl+C 停止服务
  {'=' * 40}
""")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务已停止")
            httpd.server_close()
