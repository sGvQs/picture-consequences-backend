require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const cors = require('cors');

const socketClientsLists = [];
const commentsLists = [];
let point = 0;
let answer;

app.use(
  cors({
    origin: '*',
  })
);

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  socket.on('create_room', () => {
    const roomId = Math.random().toString(36).substring(2, 16);
    socket.join(roomId);
    const clientId = [];
    const clients = io.sockets.adapter.rooms.get(roomId);
    clients.forEach((client) => {
      clientId.push(client);
    });
    const response = {
      clientId: clientId.shift(),
      roomId: roomId,
    };
    io.to(roomId).emit('created_room', response);
  });

  socket.on('notificate_joining_event', (data) => {
    const clients = io.sockets.adapter.rooms.get(data.roomId);
    io.to(data.roomId).emit('get_joining_event', clients.size);
  });

  socket.on('start_game', (roomId) => {
    const clients = io.sockets.adapter.rooms.get(roomId);

    socketClientsLists.length = 0;

    clients.forEach((client) => {
      socketClientsLists.push(client);
    });

    io.to(roomId).emit('started_game', socketClientsLists);
  });

  socket.on('join_room', (roomId) => {
    const clients = io.sockets.adapter.rooms.get(roomId);
    if (clients) {
      commentsLists.length = 0;
      socket.join(roomId);
      const clientIds = [];
      const newClientsList = io.sockets.adapter.rooms.get(roomId);
      newClientsList.forEach((client) => {
        clientIds.push(client);
      });
      const response = {
        clientId: clientIds.pop(),
        roomId: roomId,
      };
      io.to(response.clientId).emit('joined_room', response);
    } else {
      socket.emit('not_found', roomId);
    }
  });

  socket.on('drawing', (args) => {
    socket.broadcast.to(args.roomId).emit('drawing', args.canvasData);
  });

  socket.on('sending_time', (args) => {
    painter = args.clientName;
    const response = {
      time: args.time,
      clientName: args.clientName,
    };
    socket.broadcast.to(args.roomId).emit('getting_time', response);
  });

  socket.on('done_drawing', (roomId) => {
    io.to(roomId).emit('done_drawing');
  });

  socket.on('done_game', (roomId) => {
    io.to(roomId).emit('done_game', point);
  });

  socket.on('send_animal', (animal) => {
    answer = animal;
  });

  socket.on('sending_client_answer', (args) => {
    let isCorrect = false;
    if (args.clientAnswer === answer) {
      isCorrect = true;
    }
    const messageObject = {
      isCorrect: isCorrect,
      clientId: args.clientId,
      name: args.clientName,
      message: args.clientAnswer,
    };
    commentsLists.push(messageObject);
    io.to(args.roomId).emit('recieving_clients_answers', commentsLists);
  });
});

server.listen(process.env.PORT || 5000, () => {});
