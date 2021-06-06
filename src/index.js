const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { addToLobby, updateLobbyInfo, getLobbyInfo } = require('./utils/lobby');
const { timeLog } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection');
    
    socket.on('join', ({ username, room }, callback) => {
        console.log('join recieved');
        console.log('username: ' + username);
        console.log('room: ' + room);

        const valid = addToLobby(room, username);
        if (!valid) {
            console.log('invalid');
            callback('Cannot join lobby.');
            return;
        }
        console.log('valid');

        socket.join(room);
        console.log('lobbyInfo');
        console.log(getLobbyInfo(room));
        console.log('json string:');
        console.log(JSON.stringify(getLobbyInfo(room)));
        io.to(room).emit('lobbyData', JSON.stringify(getLobbyInfo(room)));
        callback();
    });

    socket.on('changeLobbyInfo', ({ username, room, newType }, callback) => {
        console.log('recieved newType: ' + newType);
        const success = updateLobbyInfo(room, username, newType);
        if (!success) {
            console.log('failed type change');
            io.to(room).emit('lobbyData', JSON.stringify(getLobbyInfo(room)));
            callback('Failed to change type.');
            return;
        }
        io.to(room).emit('lobbyData', JSON.stringify(getLobbyInfo(room)));
        callback();
    })

    socket.on('disconnect', () => {
        //removeUser(socket.id);
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
