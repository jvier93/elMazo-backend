const express = require("express");
const http = require("http");
const app = express();
const servidor = http.createServer(app);

const socketio = require("socket.io");
const io = socketio(servidor, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = 3000;

servidor.listen(process.env.PORT || port, () => {
  console.log(`servidor inicializado, escuchando en el puerto: ${port}`);
});

module.exports = io;
