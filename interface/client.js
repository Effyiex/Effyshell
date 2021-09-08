
var host = location.host.split(':');
if(host.length > 2) host = host[1];
else host = host[0];

const CLIENT = new PySocket(host, 8923);
CLIENT.debug = false;

class ServerProcess {

  static index = 0;
  static cache = [];

  constructor(label, state, script) {
    this.label = label;
    this.script = script;
    this.state = false;
    this.listItem = document.createElement("li");
    this.listItem.innerHTML = this.label;
    this.listItem.onclick = function() {
      var index = 0;
      ServerProcess.cache.forEach((item, i) => {
        if(item.label == this.innerHTML) index = i;
      });
      ServerProcess.setIndex(index);
    }
    document.getElementById("process_tabs").appendChild(this.listItem);
    if(state) this.localToggle();
  }

  localToggle() {
    this.state = !this.state;
    if(this.state) this.listItem.classList.add("active");
    else this.listItem.classList.remove("active");
    updateToggleButton();
  }

  static checkStates = function() {
    CLIENT.send(new PyPacket("FETCH_PROCESS_STATES"), function(packet) {
      packet.args.forEach((state, index) => {
        state = (state == "True");
        if(ServerProcess.cache[index] != undefined)
        if(ServerProcess.cache[index].state != state)
        ServerProcess.cache[index].localToggle();
      });
    });
  }

  static setIndex = function(to) {
    if(ServerProcess.cache[ServerProcess.index] != undefined)
    ServerProcess.cache[ServerProcess.index].listItem.classList.remove("current_process");
    ServerProcess.index = to;
    if(ServerProcess.cache[ServerProcess.index] != undefined) {
      ServerProcess.cache[ServerProcess.index].listItem.classList.add("current_process");
      console.log("Set \"" + ServerProcess.cache[ServerProcess.index].label + "\" as shown process.");
    }
    updateToggleButton();
  }

  static toggle = function() {
    if(ServerProcess.cache == undefined || ServerProcess.cache.length <= 0) return;
    CLIENT.send(new PyPacket("TOGGLE_PROCESS_STATE", [ServerProcess.cache[ServerProcess.index].label]));
    ServerProcess.cache[ServerProcess.index].localToggle();
  }

  static remove = function() {
    if(ServerProcess.cache == undefined || ServerProcess.cache.length <= 0) return;
    CLIENT.send(new PyPacket("DB_PROCESS_REMOVE", [ServerProcess.cache[ServerProcess.index].label]));
    ServerProcess.index = 0;
    ServerProcess.fetch();
  }

  static add = function(label, script) {
    CLIENT.send(new PyPacket("DB_PROCESS_ADD", [label, script.replaceAll('\n', '&')]));
    ServerProcess.fetch();
  }

  static addFromForm = function() {
    document.getElementById("process_create").style.display = "none";
    ServerProcess.add (
     document.getElementById("process_create_label").value,
     document.getElementById("process_create_script").value
    );
    document.getElementById("process_create_label").value = new String();
    document.getElementById("process_create_script").value = new String();
  }

  static fetch = function() {
    ServerProcess.cache.forEach(process => {
      document.getElementById("process_tabs").removeChild(process.listItem);
    });
    ServerProcess.cache.length = 0;
    CLIENT.send(new PyPacket("FETCH_CURRENT_PROCESSES"), function(packet) {
      for(var i = 0; i < packet.args.length; i += 3)
      ServerProcess.cache.push(new ServerProcess(packet.args[i], packet.args[i + 1] == "True", packet.args[i + 2]));
      ServerProcess.setIndex(0);
    });
  }

  static input = function(command) {
    if(ServerProcess.cache == undefined || ServerProcess.cache.length <= 0) return;
    if(!ServerProcess.cache[ServerProcess.index].state) return;
    CLIENT.send(new PyPacket("PROCESS_SEND_INPUT", [ServerProcess.cache[ServerProcess.index].label, command]));
  }

  static sendCommandLine = function() {
    if(ServerProcess.cache == undefined || ServerProcess.cache.length <= 0) return;
    ServerProcess.input(document.getElementById("command_input").value);
    document.getElementById("command_input").value = new String();
    document.getElementById("command_input").blur();
  }

}

var updateToggleButton = function() {
  if(ServerProcess.cache == undefined || ServerProcess.cache.length <= 0) return;
  var toggleButton = document.getElementById("process_toggle");
  if(ServerProcess.cache[ServerProcess.index].state) toggleButton.innerHTML = '⏸︎';
  else toggleButton.innerHTML = '▶';
}

window.addEventListener("load", function() {
  ServerProcess.fetch();
  document.getElementById("command_input").addEventListener("keyup", function(event) {
    if(event.keyCode == 13 /* = ENTER */) ServerProcess.sendCommandLine();
  });
  document.getElementById("command_send").addEventListener("click", ServerProcess.sendCommandLine);
  document.getElementById("process_toggle").addEventListener("click", ServerProcess.toggle);
  document.getElementById("process_remove").addEventListener("click", ServerProcess.remove);
  document.getElementById("process_add").addEventListener("click", function() {
    document.getElementById("process_create").style.display = "block";
  });
  document.getElementById("process_create_cancel").addEventListener("click", function() {
    document.getElementById("process_create").style.display = "none";
  });
  document.getElementById("process_create_submit").addEventListener("click", ServerProcess.addFromForm);
  setInterval(function() {
    if(ServerProcess.cache == undefined || ServerProcess.cache.length <= 0) return;
    CLIENT.send(new PyPacket("FETCH_PROCESS_OUTPUT", [ServerProcess.cache[ServerProcess.index].label]), function(packet) {
      var logElement = document.getElementById("current_log");
      var currentLog = packet.label.replaceAll("<br>", '\n');
      if(logElement.value.length != currentLog.length)
      logElement.value = currentLog;
    });
  }, 512);
  setInterval(ServerProcess.checkStates, 256);
});
