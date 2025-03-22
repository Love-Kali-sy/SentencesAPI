import os
import time
import signal
import subprocess
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json

PORT = 8000
PID_FILE = "server.pid"
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

class RequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_POST(self):
        if self.path.startswith('/api/'):
            action = self.path.split('/')[-1]
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "success", "action": action}
            if action == 'start':
                Thread(target=start_server).start()
                response['status'] = '启动中...'
            elif action == 'stop':
                stop_server()
                response['status'] = '已停止'
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

def start_server():
    global server
    server = ThreadingHTTPServer(('', PORT), RequestHandler)
    print(f"Server started on port {PORT}")
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    server.serve_forever()

def stop_server():
    if os.path.exists(PID_FILE):
        with open(PID_FILE, 'r') as f:
            pid = int(f.read())
        os.kill(pid, signal.SIGTERM)
        os.remove(PID_FILE)
        print("Server stopped")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='服务控制器')
    parser.add_argument('action', choices=['start', 'stop', 'run'], nargs='?', default='run', 
                      help='start: 后台启动服务, stop: 停止服务, run: 前台运行')
    
    args = parser.parse_args()
    
    if args.action == 'start':
        print("启动后台服务...")
        subprocess.Popen(["python", __file__, "run"])
    elif args.action == 'stop':
        stop_server()
        print("服务已停止")
    elif args.action == 'run':
        print(f"服务运行中，访问地址：http://localhost:{PORT}")
        start_server()