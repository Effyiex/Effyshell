
var host = location.host.split(':');
if(host.length > 2) host = host[1];
else host = host[0];

const CLIENT = new PySocket(host, 8923);
const PROCESSES = [];
const ADVERT = "Effyiex's Effyshell Indev-Build,\nget help by pressing the logo on the top right.\n\n";

class Process {

  static index = 0;

  static area;
  static tabs;

  static active = function() {
    var counter = 0;
    for(var i = 0; i < PROCESSES.length; i++)
      if(PROCESSES[i].active) counter++;
    return counter;
  }

  static fetch = function() {
    CLIENT.send(new PyPacket("FETCH_PROCESSES"), function(packet) {
      PROCESSES.splice(0, PROCESSES.length);
      for(var i = 0; i < packet.args.length; i++) {
        var args = packet.args[i].split("*~", 3);
        var mapped = args[0].split('/');
        mapped = mapped[mapped.length - 1].split('.');
        while(mapped.length < 2) mapped.push(' ');
        new Process(mapped[mapped.length - 2], args[1] == "True");
      }
      var active = Process.active();
      var suffix = '!';
      if(active) suffix = " back, active: " + (Process.active() / PROCESSES.length * 100) + '%';
      document.getElementsByClassName("welcome-msg")[0].innerHTML = "Welcome" + suffix;
    });
  }

  static add = function() {
    var path = prompt("Path to Launch-Script: ").replaceAll('\\', '/');
    if(path) {
      CLIENT.send(new PyPacket("ADD_PROCESS", [path]));
      var mapped = path.split('/');
      mapped = mapped[mapped.length - 1].split('.');
      while(mapped.length < 2) mapped.push(' ');
      new Process(mapped[mapped.length - 2], false);
      Process.index = PROCESSES.length - 1;
    }
  }

  static remove = function() {
    if(!confirm("Do u really wanna remove this process?")) return;
    if(!PROCESSES[Process.index]) return;
    CLIENT.send(new PyPacket("REMOVE_PROCESS", [Process.index]));
    Process.tabs.removeChild(PROCESSES[Process.index].tab);
    PROCESSES.splice(Process.index, 1);
    if(Process.index > 0) Process.index--;
    else if(PROCESSES.length > 1) Process.index = PROCESSES.length - 1;

  }

  static pause = function() {
    var inst = PROCESSES[Process.index];
    if(!inst) return;
    CLIENT.send(new PyPacket("TOGGLE_PROCESS", [Process.index]));
    inst.active = !inst.active;
    inst.tab.children[1].style.backgroundColor = inst.color();
  }

  static logger = function() {
    var inst = PROCESSES[Process.index];
    if(!inst || !Process.area) return;
    CLIENT.send(new PyPacket("FETCH_LOG", [Process.index]), function(packet) {
      var log = packet.label.replaceAll("\\LINE_BREAK\\", '\n');
      if(!inst.active) log = "Process closed.";
      Process.area.innerHTML = ADVERT + log;
    });
  }

  constructor(label, active) {
    this.label = label;
    this.active = active;
    this.tab = document.createElement("li");
    var tabInner = document.createElement("p");
    tabInner.innerHTML = this.label;
    this.tab.appendChild(tabInner);
    var tabDiv = document.createElement("box");
    tabDiv.style.backgroundColor = this.color();
    this.tab.appendChild(tabDiv);
    this.tab.setAttribute("id", String(PROCESSES.length));
    if(PROCESSES.length <= 0) this.tab.style.backgroundColor = "#505060";
    this.tab.onclick = e => {
      Process.index = Number(e.target.parentNode.getAttribute("id"));
      for(var i = 0; i < PROCESSES.length; i++) {
        var process = PROCESSES[i];
        if(i == Process.index) process.tab.style.backgroundColor = "#505060";
        else process.tab.style.backgroundColor = "#404050";
      }
    }
    Process.tabs.appendChild(this.tab);
    PROCESSES.push(this);
  }

  color() {
    return this.active ? "#88FF88" : "#FF8888";
  }

}

function help() {
  alert("Use '#' for Effyshell-Commands:"
  + "\n - 'clear' > clears the log."
  + "\n - 'toggle' > toggles the Process-State.");
}

window.onload = function() {
  CLIENT.debug = false;
  Process.area = document.getElementsByClassName("console-log")[0].children[0];
  Process.tabs = document.getElementsByClassName("logging-tabs")[0].children[0];
  document.getElementsByClassName("process-add")[0].onclick = Process.add;
  document.getElementsByClassName("process-pause")[0].onclick = Process.pause;
  document.getElementsByClassName("process-remove")[0].onclick = Process.remove;
  document.getElementsByClassName("title-icon")[0].onclick = help;
  Process.fetch();
  setInterval(Process.logger, 256);
}
