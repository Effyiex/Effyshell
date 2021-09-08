
from threading import Thread
from subprocess import Popen, PIPE
from sys import platform

from pyjsps import *
from config import *
from socket import *

import signal
import os

DIR = os.getcwd().replace('\\', '/')
while DIR.endswith('/'): DIR = DIR[:len(DIR) - 1]
if not DIR.endswith("Effyshell"): DIR += "/Effyshell"

class ServerProcess:

    HEADER = "--CACHED_PROCESS--"

    def __init__(self, label, script, state=False):
        self.script = script.replace('\n', '&')
        self.state = False
        self.label = label
        self.sub = None
        self.log = bytearray()
        Thread.__init__(self)
        if state: self.toggle()

    def input(self, command):
        self.sub.stdin.write((command + '\n').encode())
        self.sub.stdin.flush()
        self.log += (f" <Effyshell-Input> {command}\n").encode("utf-8")

    def output(self):
        return self.log.decode("utf-8").replace('\n', "<br>")

    def toggle(self, eof=False):
        self.state = not self.state
        if self.state:
            self.log = b" <Effyshell-Output> Launching Server-Process...\n"
            Thread(target=self.run).start()
        else:
            self.log += b" <Effyshell-Output> Stopping Server-Process...\n"
            if not eof:
                if platform != "win32": kill(self.sub, signal.SIGKILL)
                else: Popen("taskkill /F /T /PID %i"%self.sub.pid, shell=True)
        Database.save()

    def run(self):
        if platform == "win32": task = f"cmd /c \"{self.script}\""
        else: task = self.script
        self.sub = Popen(task, shell=True, stdout=PIPE, stdin=PIPE, stderr=PIPE, cwd=DIR, bufsize=0)
        while self.state:
            self.sub.stdout.flush()
            byte = self.sub.stdout.read(1)
            if not byte: self.toggle(eof=True)
            else: self.log += byte

class Database:

    FILE = f"{DIR}/processes.db"
    CACHE = []

    @staticmethod
    def load():
        if not os.path.exists(Database.FILE):
            open(Database.FILE, 'w').close()
            return
        local = open(Database.FILE, 'r')
        formatted = local.read().split('\n')
        local.close()
        latest_index = -1
        has_process_data = False
        for line in formatted:
            if 0 <= latest_index: latest_index += 1
            if ServerProcess.HEADER in line:
                latest_index = 0
                if has_process_data:
                    latest_process = ServerProcess(latest_label, latest_script, latest_state)
                    Database.CACHE.append(latest_process)
                has_process_data = False
                latest_label = str()
                latest_state = False
                latest_script = str()
            elif latest_index == 1: latest_label = line
            elif latest_index == 2: latest_state = (line == "True")
            elif latest_index == 3:
                latest_script = line
                has_process_data = True
        if has_process_data:
            latest_process = ServerProcess(latest_label, latest_script, latest_state)
            Database.CACHE.append(latest_process)
        print("Database loaded: " + str(len(Database.CACHE)) + " processes")

    @staticmethod
    def save():
        formatted = str()
        for process in Database.CACHE:
            formatted += ServerProcess.HEADER + '\n'
            formatted += process.label + '\n'
            formatted += str(process.state) + '\n'
            formatted += process.script + '\n'
        local = open(Database.FILE, 'w')
        local.write(formatted)
        local.close()

    @staticmethod
    def dispose(process):
        Database.CACHE.remove(process)
        Database.save()

    @staticmethod
    def register(process):
        Database.CACHE.append(process)
        Database.save()

    @staticmethod
    def get_by_label(process_label):
        for process in Database.CACHE:
            if process.label == process_label:
                return process
        return None

class Websocket:

    SOCKET = None

    @staticmethod
    def launch():
        Websocket.SOCKET = JsSocket(BACKEND_PORT, Websocket.receive)
        Websocket.SOCKET.listen_forever()

    @staticmethod
    def receive(packet):
        packet.label = packet.label.upper()
        if not "FETCH" in packet.label:
            print("Websocket request: " + packet.label)
        if packet.label == "FETCH_PROCESS_OUTPUT":
            process = Database.get_by_label(packet.args[0])
            if process is not None: return JsPacket(process.output())
        elif packet.label == "FETCH_CURRENT_PROCESSES":
            p_args = []
            for process in Database.CACHE:
                p_args.append(process.label)
                p_args.append(str(process.state))
                p_args.append(process.script)
            return JsPacket("CACHED_PROCESSES", p_args)
        elif packet.label == "FETCH_PROCESS_STATES":
            p_args = []
            for process in Database.CACHE:
                p_args.append(str(process.state))
            return JsPacket("FETCHED_PROCESS_STATES", p_args)
        elif packet.label == "TOGGLE_PROCESS_STATE":
            process = Database.get_by_label(packet.args[0])
            if process is not None: process.toggle()
        elif packet.label == "PROCESS_SEND_INPUT":
            process = Database.get_by_label(packet.args[0])
            if process is not None: process.input(packet.args[1])
        elif packet.label == "PROCESS_CLEAR_LOG":
            process = Database.get_by_label(packet.args[0])
            if process is not None: process.log = str()
        elif packet.label == "DB_PROCESS_REMOVE":
            process = Database.get_by_label(packet.args[0])
            if process is not None: Database.dispose(process)
        elif packet.label == "DB_PROCESS_ADD":
            if 2 == len(packet.args): Database.register(ServerProcess(packet.args[0], packet.args[1]))
            else: return JsPacket("INVALID: This packet needs 2 arguments.");
        elif packet.label == "FETCH_PROCESS_SCRIPT":
            process = Database.get_by_label(packet.args[0])
            if process is not None: return JsPacket(process.script)
        elif packet.label == "PROCESS_SET_SCRIPT":
            process = Database.get_by_label(packet.args[0])
            if process is not None: process.script = packet.args[1]
        elif packet.label == "EFFYSHELL_QUIT": os._exit(0)
        return JsPacket("404 Standard-Feedback.")

class Webserver:

    SOCKET = None

    @staticmethod
    def launch():
        Webserver.SOCKET = socket()
        try: Webserver.SOCKET.bind(("127.0.0.1", FRONTEND_PORT))
        except: print("Couldn't bind the Webserver.")
        Webserver.SOCKET.listen(5)
        Thread(target=Webserver.receive).start()

    @staticmethod
    def receive():
        while True:
            client, address = Webserver.SOCKET.accept()
            request = client.recv(1024).decode("utf-8").split(' ')
            bytes = bytearray()
            if len(request) > 2 and request[0] == "GET":
                get_request = request[1][1:]
                if len(get_request) <= 0:
                    get_request = "security.html"
                    bytes = interface("security.html")
                elif ".html" in get_request or not '.' in get_request:
                    if get_request == PASSWORD: bytes = interface("index.html")
                    else: bytes = interface("invalid.html")
                else: bytes = interface(get_request)
                print(f"Webserver request: {get_request}")
            client.send(b"HTTP/1.0 200 OK\n\n" + bytes)
            client.close()

def interface(file):
    try:
        requested_file = open(f"{DIR}/interface/{file}", "rb")
        bytes = requested_file.read()
        requested_file.close()
    except:
        return bytearray()
    return bytes

if __name__ == "__main__":
    Database.load()
    Webserver.launch()
    Websocket.launch()
