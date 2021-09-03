
var submit = function() {
  var input = document.getElementById("password_input");
  var frame = document.getElementById("security_frame");
  if(input.value.length <= 0) return;
  frame.src = input.value;
  frame.style.display = "block";
}

window.addEventListener("load", function() {
  var input = document.getElementById("password_input");
  input.addEventListener("keydown", function(e) {
    if(e.keyCode == 13 /* = ENTER */)
    submit();
  });
  var frame = document.getElementById("security_frame");
  frame.addEventListener("load", function() {
    document.title = frame.contentDocument.title;
  });
});
