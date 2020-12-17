
from pyjsps import *
from threading import Thread
from socket import *
from os import getcwd as cwd
from os import _exit

BACKEND_PORT = 8923
FRONTEND_PORT = 8924

http = FrontEnd()
back = UserConn()
registry = Database()

class Process:

    def __init__(self, launcher, alive="True"):
        self.launcher = launcher
        self.alive = bool(alive)
        self.log = log
        registry.append(self)

    def parse(self): return f"{self.launcher}*~{self.alive}*~{self.log}"

    def toggle(self): self.alive = not self.alive

class UserConn:

    def __init__(self):
        self.server = JsSocket(BACKEND_PORT, self.receiver)

    def receiver(self, packet):
        packet.label = packet.label.upper()
        print("UserConn-Request: " + packet.label)
        if packet.label == "TOGGLE_PROCESS":
            process = registry.get(int(packet.args[0]))
            if process != None: process.toggle()
        elif packet.label == "FETCH_PROCESSES":
            args = []
            for process in registry.req: args.append(process.parse())
            return JsPacket("List of Processes", args)
        elif packet.label == "ADD_PROCESS":
            
        return JsPacket("Standard Feedback-Packet.")

    def launch(self):
        print("UserConn waiting...")
        self.server.listen_forever()

class FrontEnd:

    def __init__(self):
        self.server = socket()
        try: self.server.bind(("127.0.0.1", FRONTEND_PORT))
        except : print("Couldn't bind the FrontEnd-Socket.")
        self.thread = Thread(target=self.shaker)
        with open(f"{cwd()}/interface/404.html", "rb") as file: self.empty = file.read()

    def shaker(self):
        print("FrontEnd waiting...")
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
        self.path = cwd() + "registry.db"
        self.req = []

    def fetch(self):
        self.req.clear()
        with open(self.path, 'r') as file:
            content = file.read()
            for line in content.split('\n'):
                map = line.split("*~", 2)
                if len(map) > 2: Process(map[0], map[1], map[2])

    def count(self): return len(self.req)

    def get(self, index):
        if self.count() > index: return self.req[index]
        else: return None

    def append(self, process):
        self.req.append(process)
        with open(self.path, 'a') as file: file.write(process.parse())

    def remove(self, index):
        if self.count() <= index: return
        self.req.pop(index)
        with open(self.path, 'w') as file:
            code = str()
            for process in self.req:
                code += '\n' process.parse()
            file.write(code)

def main():
    registry.fetch()
    http.launch()
    back.launch()

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: _exit(0)
