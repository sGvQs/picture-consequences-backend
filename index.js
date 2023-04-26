require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.VERCEL_URL
        : process.env.DEV_URL,
  },
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('create_room', () => {
    const roomId = Math.random().toString(36).substring(2, 16);
    socket.emit('created_roomId', roomId);
  });

  socket.on('serch_room', (roomId) => {
    const clients = io.sockets.adapter.rooms.get(roomId);

    if (clients) {
      console.log('ルームが存在します');
      console.log(clients);
      io.emit('found_room', roomId);
    } else {
      console.log('ルームが存在しません');
      io.emit('notFound_room', roomId);
    }
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    const clients = io.sockets.adapter.rooms.get(roomId);
    console.log(clients);
    io.emit('join_new_member', clients.size);
  });

  socket.on('start_game', () => {
    io.emit('started_game');
  });

  socket.on('drawing', (data) => {
    // データを処理する
    // ...
    // 他のクライアントにデータを送信する
    socket.broadcast.emit('drawing', data);
  });

  socket.on('clear', () => {
    // データを処理する
    // ...
    // 他のクライアントにデータを送信する
    socket.broadcast.emit('clear');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log('listening on *:5000');
});
