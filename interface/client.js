
var host = location.host.split(':');
if(host.length > 2) host = host[1];
else host = host[0];

const CLIENT = new PySocket(host, 8923);
const PROCESSES = [];

class Process {

  static index = 0;

  static fetch = function() {
    CLIENT.send(new PyPacket("FETCH_PROCESSES"), function(packet) {
      
    });
  }

  static add = function() {
    var path = prompt("Path to Launch-Script: ").replaceAll('\\', '/');
    if(path) {
      CLIENT.send(new PyPacket("ADD_PROCESS", [path]));
      var mapped = path.split('/');
      new Process(mapped[mapped.length - 1], false, []);
    }
  }

  static remove = function() {
    if(!confirm("Do u really wanna remove this process?")) return;
    if(!PROCESSES[Process.index]) return;
    CLIENT.send(new PyPacket("REMOVE_PROCESS", [Process.index]));
    PROCESSES.splice(Process.index, 1);
    if(Process.index > 0) Process.index--;
  }

  static pause = function() {
    var inst = PROCESSES[Process.index];
    if(!inst) return;
    CLIENT.send(new PyPacket("TOGGLE_PROCESS", [Process.index]));
    inst.active = !inst.active;
  }

  constructor(label, active, log) {
    this.label = label;
    this.active = active;
    this.log = log;
    PROCESSES.push(this);
  }

}

window.onload = function() {
  document.getElementsByClassName("process-add")[0].onclick = Process.add;
  document.getElementsByClassName("process-pause")[0].onclick = Process.pause;
  document.getElementsByClassName("process-remove")[0].onclick = Process.remove;

}
