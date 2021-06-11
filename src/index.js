const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
    lobbies,
    idToUsername,
    usernameToLobby,
    createLobby,
    TYPE_SPECTATOR,
    TYPE_HOST,
    TYPE_PLAYER,
    TYPE_LIBERAL,
    TYPE_FASCIST,
    TYPE_HITLER,
    GAMESTATE_LOBBY,
    GAMESTATE_ONGOING,
    GAMESTATE_FINISHED,
    STATUS_NONE,
    STATUS_VOTING,
    STATUS_PRESDEC,
    STATUS_CHANCDEC,
    STATUS_PRESACT
} = require('./utils/data');
const { addToLobby, updateLobbyUserType, removeUser } = require('./utils/lobby');
const { startGame } = require('./utils/game');
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

        const valid = addToLobby(room, username, socket.id);
        if (!valid) {
            console.log('invalid');
            callback('Cannot join lobby.');
            return;
        }
        console.log('valid');

        socket.join(room);
        console.log('lobbyInfo');
        console.log(lobbies.get(room));
        console.log('json string:');
        console.log(JSON.stringify(lobbies.get(room)));
        io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
        callback();
    });

    socket.on('changeLobbyInfo', ({ username, room, newType }, callback) => {
        console.log('recieved newType: ' + newType);
        const success = updateLobbyUserType(room, username, newType);
        if (!success) {
            console.log('failed type change');
            io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
            callback('Failed to change type.');
            return;
        }
        io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
        callback();
    })

    socket.on('disconnect', () => {
        const room = removeUser(socket.id);
        if (room !== null) {
            io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
        }
    });

    socket.on('startGame', ({ room }, callback) => {
        startGame(room);
        io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
