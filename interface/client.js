
var host = location.host.split(':');
if(host.length > 2) host = host[1];
else host = host[0];

const CLIENT = new PySocket(host, 8923);
const PROCESSES = [];
const ADVERT = "Effyiex's Effyshell Indev-Build,\nget help by pressing the logo on the top right.\n\n";

class Process {

  static index = 0;
  static last = -1;

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
      var suffix = '!';
      if(PROCESSES.length > 0)
        suffix = " back, active: " + Math.round(Process.active() / PROCESSES.length * 100) + '%';
      document.getElementsByClassName("welcome-msg")[0].innerHTML = "Welcome" + suffix;
    });
  }

  static add = function(path) {
    path = path.replaceAll('\\', '/');
    CLIENT.send(new PyPacket("ADD_PROCESS", [path]));
    var mapped = path.split('/');
    mapped = mapped[mapped.length - 1].split('.');
    while(mapped.length < 2) mapped.push(' ');
    new Process(mapped[mapped.length - 2], false);
    Process.index = PROCESSES.length - 1;
  }

  static remove = function() {
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
    if(!inst || !Process.area || quitted) return;
    CLIENT.send(new PyPacket("FETCH_LOG_STATUS", [Process.index]), function(packet) {
      if(packet.label.toLowerCase() == "true" || Process.last != Process.index)
      Process.update();
      Process.last = Process.index;
    });
  }

  static update = function() {
    var inst = PROCESSES[Process.index];
    if(!inst || !Process.area || quitted) return;
    CLIENT.send(new PyPacket("FETCH_LOG_TEXT", [Process.index]), function(packet) {
      var log = packet.label.replaceAll("\\LINE_BREAK\\", '\n');
      if(!inst.active) log = "Process closed.";
      log = ADVERT + log;
      var selection = [
        Process.area.selectionStart,
        Process.area.selectionEnd
      ];
      Process.area.innerHTML = log;
      if(selection[0] != selection[1])
      for(var i = 0; i < 3; i++) {
        if(2 <= i) {
          Process.area.selectionStart = selection[0];
          Process.area.selectionEnd = selection[1];
        } else if(log.length <= selection[i]) break;
      }
    });
  }

  static input = function(command) {
    console.log("Processing Command: " + command);
    if(command.toLowerCase() == "#clear") CLIENT.send(new PyPacket("CLEAR_LOG", [Process.index]));
    else if(command.toLowerCase() == "#quit") {
      CLIENT.send(new PyPacket("QUIT"));
      quitted = true;
      document.getElementsByClassName("quitted")[0].style.display = "block";
    } else if(command.toLowerCase().startsWith("#add")) {
      if(command.trim().length > 4 && command != "#add <path>") Process.add(command.substring(5));
      else return "#add <path>";
    } else if(command.toLowerCase() == "#toggle") Process.pause();
    else if(command.toLowerCase() == "#remove") Process.remove();
    else if(command.toLowerCase() == "#reload") {
      var inst = PROCESSES[Process.index];
      var steps = 2;
      if(inst && !inst.active) steps = 1;
      for(var step = 0; step < steps; step++) Process.pause();
    } else CLIENT.send(new PyPacket("STREAM_PROCESS", [Process.index, command]));
    return String();
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

function menu() {
  var div = document.getElementsByClassName("menu")[0];
  if(Number(div.style.opacity) <= 0) {
    div.style.opacity = "1";
    div.style.transform = "translateX(-100%)";
    div.style.animation = "MenuFadeIn 1s normal";
  } else {
    div.style.animation = "MenuFadeOut 1s normal";
    div.style.opacity = "0";
    div.style.transform = "translateX(0)";
  }
}

var input;

var quitted = false;

window.onload = function() {
  CLIENT.debug = false;
  input = document.getElementsByClassName("input-bar")[0].children[0];
  Process.area = document.getElementsByClassName("console-log")[0].children[0];
  Process.tabs = document.getElementsByClassName("logging-tabs")[0].children[0];
  document.getElementsByClassName("process-add")[0].onclick = e => { input.value = "#add "; }
  document.getElementsByClassName("process-pause")[0].onclick = e => { Process.input("#toggle"); };
  document.getElementsByClassName("process-remove")[0].onclick = e => { Process.input("#remove"); };
  document.getElementsByClassName("scroll-to-end")[0].onclick = e => {
    Process.area.scrollTop = Process.area.scrollHeight - Process.area.clientHeight;
  };
  document.getElementsByClassName("title-icon")[0].onclick = menu;
  input.onkeydown = e => {
    if(e.keyCode != 13) return; // '13' = Enter-Key
    if(input.value.length <= 0) return;
    input.value = Process.input(input.value);
  }
  Process.fetch();
  setInterval(Process.logger, 256);
}
