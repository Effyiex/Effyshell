
from pyjsps import *
from threading import Thread
from socket import *
from os import getcwd as cwd
from os import _exit
from subprocess import Popen, PIPE

BACKEND_PORT = 8923
FRONTEND_PORT = 8924

class Process:

    def __init__(self, launcher, alive=False):
        self.launcher = launcher
        self.alive = alive
        self.log = str()
        self.inner = None
        if alive: self.launch()

    def add_to_log(self, line): self.log += f"\n{line}".replace('\n', "\\LINE_BREAK\\")
    def parse(self): return f"{self.launcher}*~{str(self.alive)}"

    def launch(self):
        mapped = self.launcher.replace('\\', '/').split('/')
        dir = str()
        for i in range(len(mapped) - 1): dir += mapped[i] + '/'
        self.inner = Popen([self.launcher], stdout=PIPE, cwd=dir)

    def update(self):
        if self.inner != None:
            data = self.inner.stdout.read().decode("utf-8")
            if len(data) > 0: self.add_to_log(data)

    def toggle(self):
        self.alive = not self.alive
        if self.alive: self.launch()
        else:
            self.inner.kill()
            self.log = str()
        registry.refresh()

class BackEnd:

    def __init__(self):
        self.server = JsSocket(BACKEND_PORT, self.receiver)

    def receiver(self, packet):
        packet.label = packet.label.upper()
        if not packet.label.startswith("FETCH_LOG"): # Stopping Overflow
            print("BackEnd-Request : " + packet.label)
        if packet.label == "TOGGLE_PROCESS":
            process = registry.get(int(packet.args[0]))
            if process != None: process.toggle()
        elif packet.label == "FETCH_PROCESSES":
            args = []
            for process in registry.req: args.append(process.parse())
            return JsPacket(str(registry.count()), args)
        elif packet.label == "ADD_PROCESS": registry.append(Process(packet.args[0]))
        elif packet.label == "REMOVE_PROCESS": registry.remove(int(packet.args[0]))
        elif packet.label == "FETCH_LOG":
            process = registry.get(int(packet.args[0]))
            if process != None:
                process.update()
                return JsPacket(process.log)
        return JsPacket("404 Standard-Feedback.")

    def launch(self):
        print("BackEnd  waiting.")
        self.server.listen_forever()

class FrontEnd:

    def __init__(self):
        self.server = socket()
        try: self.server.bind(("127.0.0.1", FRONTEND_PORT))
        except : print("Couldn't bind the FrontEnd-Socket.")
        self.thread = Thread(target=self.shaker)
        with open(f"{cwd()}/interface/404.html", "rb") as file: self.empty = file.read()

    def shaker(self):
        print("FrontEnd waiting.")
        while True:
            client, address = self.server.accept()
            req = client.recv(1024).decode("utf-8").split(' ')
            bytes = self.empty
            if len(req) > 2 and req[0] == "GET":
                request = req[1]
                while len(request) > 1 and request[1] == '.':
                    request = '/' + request[2:]
                if request == '/': request = "/index.html"
                print(f"FrontEnd-Request: {request}")
                dir = cwd().replace('\\', '/') + "/interface"
                try:
                    with open(f"{dir}{request}", "rb") as file: bytes = file.read()
                except: print(f"Couldn't access file: {request}")
            client.send(str.encode("HTTP/1.0 200 OK\n\n") + bytes)
            client.close()

    def launch(self):
        self.server.listen(5)
        self.thread.start()

class Database:

    def __init__(self):
        self.path = cwd().replace('\\', '/') + "/registry.db"
        self.req = []

    def fetch(self):
        self.req.clear()
        try:
            with open(self.path, 'r') as file:
                content = file.read()
                for line in content.split('\n'):
                    map = line.split("*~", 2)
                    if len(map) > 1:
                        active = map[1] == "True"
                        self.req.append(Process(map[0], active))
            print("Database fetched.")
        except:
            with open(self.path, 'w') as file: file.write('\n')
            print("Database created.")

    def count(self): return len(self.req)

    def get(self, index):
        if self.count() > index: return self.req[index]
        else: return None

    def append(self, process):
        self.req.append(process)
        with open(self.path, 'a') as file: file.write('\n' + process.parse())

    def refresh(self):
        with open(self.path, 'w') as file:
            code = str()
            for process in self.req:
                code += '\n' + process.parse()
            file.write(code)

    def remove(self, index):
        if self.count() <= index: return
        self.req.pop(index)
        self.refresh()

http = FrontEnd()
back = BackEnd()
registry = Database()

def main():
    registry.fetch()
    http.launch()
    back.launch()

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: _exit(0)
