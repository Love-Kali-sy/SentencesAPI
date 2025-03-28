# -*- coding: utf-8 -*-
import sys
import os
import webbrowser
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from winreg import HKEY_CURRENT_USER, CreateKey, OpenKey, SetValueEx, QueryValueEx, CloseKey, DeleteValue, KEY_ALL_ACCESS
import winreg
from PyQt5.QtWidgets import (QApplication, QMainWindow, QPushButton, QVBoxLayout,
                             QWidget, QLabel, QCheckBox, QMessageBox, QHBoxLayout,
                             QSystemTrayIcon, QMenu, QAction)
from PyQt5.QtCore import Qt, QTimer, QEvent
from PyQt5.QtGui import QFont, QIcon
import logging
from logging.handlers import RotatingFileHandler

class RegistryPathManager:
    REG_ROOT = HKEY_CURRENT_USER
    REG_PATH = r"Software\StaticServer"
    REG_KEY = "InstallPath"

    @classmethod
    def write_install_path(cls):
        try:
            # 创建或打开注册表项
            key = OpenKey(cls.REG_ROOT, cls.REG_PATH, 0, KEY_ALL_ACCESS | winreg.KEY_WOW64_64KEY)
            # 获取当前程序所在目录
            current_path = os.path.dirname(os.path.abspath(sys.argv[0]))
            # 写入注册表值
            SetValueEx(key, cls.REG_KEY, 0, winreg.REG_SZ, current_path)
            CloseKey(key)
            return True
        except FileNotFoundError:
            # 如果项不存在则创建
            try:
                key = CreateKey(cls.REG_ROOT, cls.REG_PATH)
                current_path = os.path.dirname(os.path.abspath(sys.argv[0]))
                SetValueEx(key, cls.REG_KEY, 0, winreg.REG_SZ, current_path)
                CloseKey(key)
                return True
            except Exception as e:
                print(f"创建注册表项失败: {e}")
                return False
        except Exception as e:
            print(f"写入安装路径失败: {e}")
            return False
        
class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        try:
            # 记录请求来源 IP 和路径
            logging.info(f"POST 请求来自: {self.client_address[0]}:{self.client_address[1]}, 路径: {self.path}")

            # 获取请求体内容
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')

            # 确保写入路径正确
            file_path = os.path.join(os.getcwd(), 'sentence.txt')  # 确保路径为 ./sentences/static/sentence.txt
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(post_data)

            # 记录日志
            logging.info(f"POST 请求成功: {post_data}")

            # 返回成功响应
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File saved successfully')
        except Exception as e:
            # 记录错误日志
            logging.error(f"POST 请求失败: {str(e)}")
            # 返回错误响应
            self.send_error(500, f"Error saving file: {str(e)}")
            
    def do_GET(self):
        # 解析查询参数
        query = self.path.split('?', 1)
        params = {}
        if len(query) > 1:
            from urllib.parse import parse_qs
            params = parse_qs(query[1])
        # 处理 model=text 的请求
        if self.path.startswith('/') and params.get('model', [''])[0] == 'text':
            try:
                with open('sentence.txt', 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return
            except FileNotFoundError:
                self.send_error(404, "File not found")
                return
        # 其他请求正常处理
        super().do_GET()

class ServerThread(threading.Thread):
    def __init__(self, port=8389):
        super().__init__()
        self.port = port
        self.server = None
        self.handler = CustomHandler
        self.running = True  # 添加标志位

    def run(self):
        os.chdir("static")
        self.server = ThreadingHTTPServer(('', self.port), self.handler)
        logging.info(f"服务器已启动，监听端口 {self.port}")
        while self.running:  # 使用标志位控制线程运行
            self.server.handle_request()  # 处理单个请求

    def stop(self):
        if self.server:
            logging.info("正在关闭服务器...")
            self.running = False  # 设置标志位为 False，停止循环
            self.server.shutdown()  # 停止服务器
            self.server.server_close()  # 关闭服务器
            logging.info("服务器已停止")

class PortChecker:
    @staticmethod
    def check_port(port):
        try:
            result = subprocess.run(
                ["netstat", "-ano", "-p", "tcp"],
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            lines = result.stdout.split('\n')
            for line in lines:
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.split()
                    return int(parts[-1])
            return None
        except Exception as e:
            print(f"端口检查失败: {e}")
            return None

    @staticmethod
    def kill_process(pid):
        try:
            subprocess.run(
                ["taskkill", "/F", "/PID", str(pid)],
                check=True,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            return True
        except subprocess.CalledProcessError:
            return False

class AutoStartManager:
    REG_PATH = r"Software\Microsoft\Windows\CurrentVersion\Run"
    APP_NAME = "StaticServer"

    @classmethod
    def enable_auto_start(cls):
        try:
            key = OpenKey(HKEY_CURRENT_USER, cls.REG_PATH, 0, KEY_ALL_ACCESS)
            exe_path = f'"{os.path.abspath(sys.argv[0])}" --autostart'  # 添加启动参数
            SetValueEx(key, cls.APP_NAME, 0, winreg.REG_SZ, exe_path)
            CloseKey(key)
            return True
        except Exception as e:
            print(f"启用自启动失败: {e}")
            return False

    @classmethod
    def disable_auto_start(cls):
        try:
            key = OpenKey(HKEY_CURRENT_USER, cls.REG_PATH, 0, KEY_ALL_ACCESS)
            DeleteValue(key, cls.APP_NAME)
            CloseKey(key)
            return True
        except Exception as e:
            print(f"禁用自启动失败: {e}")
            return False

    @classmethod
    def is_auto_start_enabled(cls):
        try:
            key = OpenKey(HKEY_CURRENT_USER, cls.REG_PATH)
            value, _ = QueryValueEx(key, cls.APP_NAME)
            CloseKey(key)
            return "--autostart" in value  # 检查参数是否存在
        except FileNotFoundError:
            return False
        except Exception as e:
            print(f"检查自启动失败: {e}")
            return False

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.server_thread = None
        self.tray_icon = None
        self.is_auto_start = "--autostart" in sys.argv  # 检测自动启动模式
        
        self.init_ui()
        self.init_tray()
        self.check_auto_start()

        if self.is_auto_start:  # 自动启动模式
            self.hide()
            self.start_server()

    # ...existing code...

    def closeEvent(self, event):
        # 检查服务是否已停止
        if self.server_thread and self.server_thread.is_alive():
            reply = QMessageBox.warning(
                self,
                "警告",
                "服务正在运行中，请先停止服务再关闭窗口。",
                QMessageBox.Ok
            )
            event.ignore()  # 阻止窗口关闭
        else:
            event.accept()  # 允许窗口关闭

    def init_ui(self):
        self.setWindowTitle("静态文件服务器")
        self.setFixedSize(380, 280)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)

        # 主布局
        main_widget = QWidget()
        main_widget.setObjectName("mainWidget")
        main_layout = QVBoxLayout(main_widget)

        # 标题栏
        title_bar = QWidget()
        title_layout = QHBoxLayout(title_bar)
        title_layout.setContentsMargins(12, 5, 8, 5)

        title = QLabel("文件服务器控制台")
        title.setFont(QFont("微软雅黑", 11, QFont.Bold))
        
        # 控制按钮
        btn_container = QWidget()
        btn_layout = QHBoxLayout(btn_container)
        btn_layout.setContentsMargins(0, 0, 0, 0)
        btn_layout.setSpacing(6)

        min_btn = QPushButton("−")
        min_btn.setFixedSize(16, 16)
        min_btn.clicked.connect(self.minimize_to_tray)
        min_btn.setObjectName("minButton")

        close_btn = QPushButton("×")
        close_btn.setFixedSize(16, 16)
        close_btn.clicked.connect(self.quit_app)
        close_btn.setObjectName("closeButton")

        btn_layout.addWidget(min_btn)
        btn_layout.addWidget(close_btn)

        title_layout.addWidget(title)
        title_layout.addStretch()
        title_layout.addWidget(btn_container)

        # 状态显示
        self.status_label = QLabel("当前状态：服务已停止")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setFont(QFont("微软雅黑", 9))

        # 控制按钮
        self.start_btn = QPushButton("启动服务")
        self.start_btn.clicked.connect(self.toggle_server)
        self.start_btn.setFixedHeight(36)

        self.auto_start_cb = QCheckBox("开机自动启动")
        self.auto_start_cb.stateChanged.connect(self.toggle_auto_start)

        main_layout.addWidget(title_bar)
        main_layout.addSpacing(15)
        main_layout.addWidget(self.status_label)
        main_layout.addSpacing(25)
        main_layout.addWidget(self.start_btn)
        main_layout.addWidget(self.auto_start_cb)
        main_layout.addStretch()

        self.setStyleSheet('''
            #mainWidget {
                background: #FFFFFF;
                border-radius: 12px;
                border: 1px solid #E0E0E0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            QPushButton {
                background: #2196F3;
                color: white;
                border-radius: 8px;
                padding: 6px;
                font-size: 13px;
                min-width: 90px;
            }
            QPushButton:hover {
                background: #42A5F5;
            }
            #minButton, #closeButton {
                border-radius: 5px;
                font-size: 13px;
                font-weight: 500;
                padding: 0;
            }
            #minButton {
                background: #FFC107;
                color: black;
            }
            #minButton:hover {
                background: #FFD54F;
            }
            #closeButton {
                background: #FF5252;
            }
            #closeButton:hover {
                background: #FF1744;
            }
            QCheckBox {
                font-size: 11px;
                padding: 4px;
                color: #616161;
            }
            QLabel {
                color: #424242;
            }
        ''')

        self.setCentralWidget(main_widget)

    def init_tray(self):
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon("ico.ico"))
        
        tray_menu = QMenu()
        show_action = QAction("显示主界面", self)
        show_action.triggered.connect(self.show_normal)
        tray_menu.addAction(show_action)
        
        quit_action = QAction("退出程序", self)
        quit_action.triggered.connect(self.quit_app)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.tray_icon_clicked)
        self.tray_icon.show()

    def show_normal(self):
        self.showNormal()
        self.activateWindow()

    def tray_icon_clicked(self, reason):
        if reason == QSystemTrayIcon.DoubleClick:
            self.show_normal()

    def minimize_to_tray(self):
        self.hide()

    def quit_app(self):
        # 确保服务已停止
        if self.server_thread and self.server_thread.is_alive():
            QMessageBox.warning(self, "警告", "请先停止服务再退出程序。")
            return
        self.tray_icon.hide()
        QApplication.quit()

    def changeEvent(self, event):
        if (event.type() == QEvent.WindowStateChange):
            if (self.windowState() & Qt.WindowMinimized):
                self.minimize_to_tray()
                event.ignore()
        super().changeEvent(event)

    def check_auto_start(self):
        self.auto_start_cb.setChecked(AutoStartManager.is_auto_start_enabled())

    def toggle_auto_start(self, state):
        if (state == Qt.Checked):
            if (not AutoStartManager.enable_auto_start()):
                QMessageBox.warning(self, "错误", "无法启用开机自启功能")
        else:
            if (not AutoStartManager.disable_auto_start()):
                QMessageBox.warning(self, "错误", "无法禁用开机自启功能")

    def toggle_server(self):
        if (self.server_thread and self.server_thread.is_alive()):
            self.stop_server()
        else:
            self.start_server()
            QTimer.singleShot(500, self.open_browser)

    def check_port(self):
        pid = PortChecker.check_port(8389)
        if (pid):
            reply = QMessageBox.question(self, '端口占用', f'端口8389被进程{pid}占用，是否终止该进程？', QMessageBox.Yes | QMessageBox.No)
            if (reply == QMessageBox.Yes):
                if (PortChecker.kill_process(pid)):
                    QMessageBox.information(self, '成功', '进程已终止')
                    return True
                else:
                    QMessageBox.warning(self, '错误', '无法终止进程')
                    return False
            else:
                return False
        return True

    def start_server(self):
        if (not self.check_port()):
            return
        self.server_thread = ServerThread()
        self.server_thread.start()
        self.start_btn.setText("停止服务")
        self.status_label.setText("当前状态：服务运行中\n访问地址：http://localhost:8389")

    def stop_server(self):
        if (self.server_thread):
            logging.info("正在停止服务...")
            self.server_thread.stop()  # 停止服务器线程
            QTimer.singleShot(100, self.check_server_thread)  # 使用定时器检查线程状态

    def check_server_thread(self):
        if self.server_thread.is_alive():
            QTimer.singleShot(100, self.check_server_thread)  # 继续检查线程状态
        else:
            logging.info("服务已完全停止")
            self.server_thread = None
            self.start_btn.setText("启动服务")
            self.status_label.setText("当前状态：服务已停止")

    def open_browser(self):
        try:
            webbrowser.open("http://localhost:8389", new=2)
        except Exception as e:
            QMessageBox.warning(self, "警告", f"无法打开浏览器: {str(e)}")

    def mousePressEvent(self, event):
        self.oldPos = event.globalPos()

    def mouseMoveEvent(self, event):
        delta = event.globalPos() - self.oldPos
        self.move(self.x() + delta.x(), self.y() + delta.y())
        self.oldPos = event.globalPos()

def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    window = MainWindow()
    
    # 如果是自动启动模式不显示主窗口
    if "--autostart" not in sys.argv:
        window.show()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()

# 初始化日志记录
log_dir = os.path.join(os.getcwd(), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "post-requests.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=5),  # 每个日志文件最大5MB，保留5个备份
        logging.StreamHandler()
    ]
)