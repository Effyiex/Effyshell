
var draggingElement;
var draggingOriginX;
var draggingOriginY;

window.addEventListener("load", function() {
  document.querySelectorAll("[load_event]").forEach(element => {
    element.classList.add("post_load");
  });
  document.querySelectorAll("[draggable]").forEach(element => {
    element.addEventListener("mousedown", function(event) {
      draggingElement = event.target;
      var b = event.target.getBoundingClientRect();
      draggingOriginX = event.clientX - b.left - b.width / 2;
      draggingOriginY = event.clientY - b.top - b.height / 2;
    });
  });
});

window.addEventListener("mousemove", function(event) {
  if(draggingElement != undefined) {
    var curX = 100.0 / window.innerWidth * (event.clientX - draggingOriginX);
    var curY = 100.0 / window.innerHeight * (event.clientY - draggingOriginY);
    draggingElement.style.left = new String(curX) + '%';
    draggingElement.style.top = new String(curY) + '%';
  }
});

window.addEventListener("mouseup", function(event) {
  draggingElement = undefined;
});
