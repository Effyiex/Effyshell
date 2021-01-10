
import sys
current = sys.path[0].replace('\\', '/')
mapped = current.split('/')
new_path = str()

for i in range(len(mapped) - 2):
    if i > 0: new_path += '/' + mapped[i]
    else: new_path += mapped[i]

sys.path.append(new_path)
sys.path.append(f"{new_path}/Effyshell")

for dir in sys.path: print("PATH: " + dir)
