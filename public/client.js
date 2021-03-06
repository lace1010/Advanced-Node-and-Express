$(document).ready(function () {
  let socket = io();

  // Get user count' from server.js and take its data (usercount) then log it
  socket.on("user", (data) => {
    $("#num-users").text(data.currentUsers + " users online");
    let message =
      data.name +
      (data.connected ? " has joined the chat." : " has left the chat.");
    $("#messages").append($("<li>").html("<b>" + message + "</b>"));
  });
  // Form submittion with new message in field with id 'm'
  $("form").submit(() => {
    var messageToSend = $("#m").val();
    socket.emit("chat message", messageToSend);

    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});
