
from pyjsps import *
from threading import Thread
from socket import *
from os import getcwd as cwd
from os import _exit

PORTS = [8923, 8924]

class UserConn:

    def __init__(self):
        self.server = JsSocket(PORTS[0], self.receiver)

    def receiver(self, packet):
        print("Received: " + packet.label)
        return JsPacket("Nothing to see here.")

    def launch(self):
        print("UserConn waiting...")
        self.server.listen_forever()

class FrontEnd:

    def __init__(self):
        self.server = socket()
        try: self.server.bind(("127.0.0.1", PORTS[1]))
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

def main():
    FrontEnd().launch()
    UserConn().launch()

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: _exit(0)
