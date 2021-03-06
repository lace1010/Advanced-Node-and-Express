$(document).ready(function () {
  let socket = io();

  // Get user count' from server.js and take its data (usercount) then log it
  socket.on("user count", (data) => {
    console.log(data);
  });
  // Form submittion with new message in field with id 'm'
  $("form").submit(function () {
    var messageToSend = $("#m").val();

    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});
