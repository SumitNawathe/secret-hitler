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
    resetLobby,
    TYPE_SPECTATOR,
    TYPE_HOST,
    TYPE_PLAYER,
    TYPE_LIBERAL,
    TYPE_FASCIST,
    TYPE_HITLER,
    TYPE_DEAD,
    TYPE_DEAD_LIB,
    TYPE_DEAD_FAS,
    GAMESTATE_LOBBY,
    GAMESTATE_ONGOING,
    GAMESTATE_FINISHED,
    STATUS_NONE,
    STATUS_VOTING,
    STATUS_PRESCHOOSE,
    STATUS_PRESDEC,
    STATUS_CHANCDEC,
    STATUS_PRESACT1,
    STATUS_PRESACT2,
    STATUS_PRESACT3,
    STATUS_PRESACT4,
    FASCIST,
    LIBERAL
} = require('./utils/data');
const { addToLobby, updateLobbyUserType, removeUser, remakeLobby } = require('./utils/lobby');
const { startGame, setUpVote, registerVote, presidentDiscard, chancellorChoose, handlePresAction1, handlePresAction2, handlePresAction3, handlePresAction4, generateMaskedLobby, chancellorVeto, presidentVeto } = require('./utils/game');
const { timeLog } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

const emitMidgameLobbyData = (room) => {
    // console.log('emitting midgame lobbyData');
    const lobby = lobbies.get(room);

    if (lobby.gameState === GAMESTATE_FINISHED) {
        io.to(room).emit('lobbyData', JSON.stringify(lobby));
        return;
    }

    lobby.users.forEach((person) => {
        io.to(person.id).emit('lobbyData', JSON.stringify(generateMaskedLobby(room, person.username)));
    });
}

io.on('connection', (socket) => {
    // console.log('New WebSocket connection');
    
    socket.on('join', ({ username, room }, callback) => {
        // console.log('join recieved');
        // console.log('username: ' + username);
        // console.log('room: ' + room);

        const valid = addToLobby(room, username, socket.id);
        if (!valid) {
            // console.log('invalid');
            callback('Cannot join lobby.');
            return;
        }
        // console.log('valid');

        socket.join(room);
        // console.log('lobbyInfo');
        // console.log(lobbies.get(room));
        // console.log('json string:');
        // console.log(JSON.stringify(lobbies.get(room)));
        // io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));

        //TODO: only works for lobby mode? maybe?
        io.to(socket.id).emit('lobbyData', JSON.stringify(lobbies.get(room)));

        lobbies.get(room).users.forEach((person) => {
            if (person.id !== socket.id) {
                io.to(person.id).emit('joinLobbyData', JSON.stringify({ player: username }));
            }
        });

        callback();
    });

    socket.on('changeLobbyInfo', ({ username, room, newType }, callback) => {
        // console.log('recieved newType: ' + newType);
        const success = updateLobbyUserType(room, username, newType);
        if (!success) {
            // console.log('failed type change');
            // io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
            callback('Failed to change type.');
            console.log('Failed to change type');
            return;
        }
        // io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
        io.to(room).emit('updateLobbyData', JSON.stringify({ username, state: newType }));
        callback();
    })

    socket.on('disconnect', () => {
        const room = removeUser(socket.id);
        if (room !== null) {
            // io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
            if (lobbies.get(room).gameState === GAMESTATE_LOBBY) {
                io.to(room).emit('removeLobbyData', JSON.stringify({ person: username }));
            }
        }
    });

    socket.on('startGame', ({ room }, callback) => {
        startGame(room);
        emitMidgameLobbyData(room);
    });

    socket.on('chooseChancellor', ({ room, choice }, callback) => {
        // console.log('chose chancellor: ' + choice);
        // console.log('room: ' + room);
        setUpVote(room, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('voting', ({ room, username, choice }, callback) => {
        // console.log('received vote: ' + choice);
        registerVote(room, username, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('presDecision', ({ room, index }, callback) => {
        // console.log('chose card ' + index);
        presidentDiscard(room, index);
        emitMidgameLobbyData(room);
    });

    socket.on('chancDecision', ({room, index}, callback) => {
        // console.log('chose card ' + index);
        chancellorChoose(room, index);
        emitMidgameLobbyData(room);
    });

    socket.on('presAction1', ({room, choice}, callback) => {
        // console.log('chose to investigate ' + choice);
        handlePresAction1(room, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('presAction2', ({room, choice}, callback) => {
        // console.log('chose to investigate ' + choice);
        handlePresAction2(room, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('presAction3', ({room, id}, callback) => {
        const cards = handlePresAction3(room);
        io.to(id).emit('policyPeek', JSON.stringify(cards));
        setTimeout(emitMidgameLobbyData, 5000, room);
        //emitMidgameLobbyData(room);
    });

    socket.on('presAction4', ({room, choice}, callback) => {
        handlePresAction4(room, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('presVetoVoting', ({ room, choice }, callback) => {
        // console.log('recieved veto vote: ' + choice);
        presidentVeto(room, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('chancellorVetoVoting', ({ room, choice }, callback) => {
        // console.log('recieved veto vote: ' + choice);
        chancellorVeto(room, choice);
        emitMidgameLobbyData(room);
    });

    socket.on('remakeLobby', ({ room }, callback) => {
        console.log('recieved remakeLobby');
        remakeLobby(room);
        io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
