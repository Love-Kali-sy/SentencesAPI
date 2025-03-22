# -*- coding: utf-8 -*-
import sys
import os
import webbrowser
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from winreg import HKEY_CURRENT_USER, OpenKey, SetValueEx, QueryValueEx, CloseKey, DeleteValue, KEY_ALL_ACCESS
import winreg
from PyQt5.QtWidgets import (QApplication, QMainWindow, QPushButton, QVBoxLayout,
                             QWidget, QLabel, QCheckBox, QMessageBox, QHBoxLayout,
                             QSystemTrayIcon, QMenu, QAction)
from PyQt5.QtCore import Qt, QTimer, QEvent  # 添加QEvent导入
from PyQt5.QtGui import QFont, QIcon

def main():
    # 必须先创建QApplication实例
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    
    # 然后创建主窗口
    window = MainWindow()
    window.show()
    
    # 最后启动事件循环
    sys.exit(app.exec_())

class MainWindow(QMainWindow):
    def changeEvent(self, event):
        # 修复事件类型判断
        if event.type() == QEvent.WindowStateChange:
            if self.windowState() & Qt.WindowMinimized:
                self.minimize_to_tray()
                event.ignore()
        super().changeEvent(event)  # 添加父类调用


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    window = MainWindow

class ServerThread(threading.Thread):
    def __init__(self, port=8389):
        super().__init__()
        self.port = port
        self.server = None
        self.handler = SimpleHTTPRequestHandler

    def run(self):
        os.chdir("static")
        self.server = ThreadingHTTPServer(('', self.port), self.handler)
        self.server.serve_forever()

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
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
            exe_path = os.path.abspath(sys.argv[0])
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
            QueryValueEx(key, cls.APP_NAME)
            CloseKey(key)
            return True
        except FileNotFoundError:
            return False
        except Exception as e:
            print(f"检查自启动失败: {e}")
            return False

class MainWindow(QMainWindow):
    def __init__(self, parent=None):
        # 必须调用父类构造函数
        super().__init__(parent)
        
        # 初始化成员变量
        self.server_thread = None
        self.tray_icon = None
        
        # 按正确顺序初始化
        self.init_ui()
        self.init_tray()
        self.check_auto_start()

    def init_ui(self):
        self.setWindowTitle("SentencesAPI启动器")
        self.setFixedSize(380, 280)
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowMinimizeButtonHint)
        self.setAttribute(Qt.WA_TranslucentBackground)

        # 主布局
        main_widget = QWidget()
        main_widget.setObjectName("mainWidget")
        main_layout = QVBoxLayout(main_widget)

        # 标题栏
        title_bar = QWidget()
        title_layout = QHBoxLayout(title_bar)
        title_layout.setContentsMargins(12, 5, 8, 5)

        # 标题
        title = QLabel("SentencesAPI启动器")
        title.setFont(QFont("微软雅黑", 11, QFont.Bold))
        
        # 控制按钮容器
        btn_container = QWidget()
        btn_layout = QHBoxLayout(btn_container)
        btn_layout.setContentsMargins(0, 0, 0, 0)
        btn_layout.setSpacing(6)

        # 最小化按钮
        min_btn = QPushButton("−")
        min_btn.setFixedSize(16, 16)
        min_btn.clicked.connect(self.minimize_to_tray)  # 修改这里
        min_btn.setObjectName("minButton")

        # 关闭按钮
        close_btn = QPushButton("×")
        close_btn.setFixedSize(16, 16)
        close_btn.clicked.connect(self.close)
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

        # 布局组合
        main_layout.addWidget(title_bar)
        main_layout.addSpacing(15)
        main_layout.addWidget(self.status_label)
        main_layout.addSpacing(25)
        main_layout.addWidget(self.start_btn)
        main_layout.addWidget(self.auto_start_cb)
        main_layout.addStretch()

        # 应用样式
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

    def open_browser(self):
        try:
            webbrowser.open(f"http://localhost:8389", new=2)
        except Exception as e:
            QMessageBox.warning(self, "警告", f"无法打开浏览器: {str(e)}")

    def check_auto_start(self):
        self.auto_start_cb.setChecked(AutoStartManager.is_auto_start_enabled())

    def toggle_auto_start(self, state):
        if state == Qt.Checked:
            if not AutoStartManager.enable_auto_start():
                QMessageBox.warning(self, "错误", "无法启用开机自启功能")
        else:
            if not AutoStartManager.disable_auto_start():
                QMessageBox.warning(self, "错误", "无法禁用开机自启功能")

    def toggle_server(self):
        if self.server_thread and self.server_thread.is_alive():
            self.stop_server()
        else:
            self.start_server()
            # 添加延迟确保服务完全启动
            QTimer.singleShot(500, self.open_browser)

    def check_port(self):
        pid = PortChecker.check_port(8000)
        if pid:
            reply = QMessageBox.question(
                self, '端口占用',
                f'端口8000被进程{pid}占用，是否终止该进程？',
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                if PortChecker.kill_process(pid):
                    QMessageBox.information(self, '成功', '进程已终止')
                    return True
                else:
                    QMessageBox.warning(self, '错误', '无法终止进程')
                    return False
            else:
                return False
        return True

    def start_server(self):
        """启动服务器"""
        if not self.check_port():
            return
            
        self.server_thread = ServerThread()
        self.server_thread.start()
        self.start_btn.setText("停止服务")
        self.status_label.setText("当前状态：服务运行中\n访问地址：http://localhost:8000")

    def stop_server(self):
        if self.server_thread:
            self.server_thread.stop()
            self.server_thread.join()
            self.start_btn.setText("启动服务")
            self.status_label.setText("当前状态：服务已停止")

    def mousePressEvent(self, event):
        self.oldPos = event.globalPos()

    def mouseMoveEvent(self, event):
        delta = event.globalPos() - self.oldPos
        self.move(self.x() + delta.x(), self.y() + delta.y())
        self.oldPos = event.globalPos()

    def init_tray(self):
        # 创建系统托盘图标
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon("ico.ico"))  # 需要准备图标文件
        
        # 创建托盘菜单
        tray_menu = QMenu()
        
        show_action = QAction("显示主界面", self)
        show_action.triggered.connect(self.show_normal)
        tray_menu.addAction(show_action)
        
        quit_action = QAction("退出程序", self)
        quit_action.triggered.connect(self.quit_app)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.tray_icon_clicked)

    def show_normal(self):
        self.showNormal()
        self.tray_icon.hide()

    def tray_icon_clicked(self, reason):
        if reason == QSystemTrayIcon.DoubleClick:
            self.show_normal()

    def minimize_to_tray(self):
        self.hide()
        self.tray_icon.show()

    def quit_app(self):
        if self.server_thread and self.server_thread.is_alive():
            self.stop_server()
        self.tray_icon.hide()
        QApplication.quit()

    def changeEvent(self, event):
        # 修复事件类型判断
        if event.type() == QEvent.WindowStateChange:
            if self.windowState() & Qt.WindowMinimized:
                self.minimize_to_tray()
                event.ignore()
        super().changeEvent(event)  # 添加父类调用

if __name__ == "__main__":
    main()
