const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinGame', () => {
    gameManager.handleJoin(io, socket);
  });

  socket.on('makeMove', (data) => {
    gameManager.handleMove(io, socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
