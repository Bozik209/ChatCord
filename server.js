// https://youtu.be/jD7FnbI76Hg?t=2338

const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app); // creates a server on your computer
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";
// Run when client connects
io.on("connection", (socket) => {
  //There are several ways to send events between the server and the client.
  //emit events on one side and register listeners on the other:
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //  Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord"));

    //  Broadcast when a user connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `A User ${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 5000 || process.env.PORT;
server.listen(PORT, () =>
  console.log(`Server runing on port http://localhost:${PORT} `)
);