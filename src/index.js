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
    LIBERAL,
    roomToHTML
} = require('./utils/data');
const { addToLobby, updateLobbyUserType, removeUser, remakeLobby } = require('./utils/lobby');
const { startGame, setUpVote, registerVote, presidentDiscard, chancellorChoose, handlePresAction1, handlePresAction2, handlePresAction3, handlePresAction4, generateMaskedLobby, chancellorVeto, presidentVeto } = require('./utils/game');
const { timeLog } = require('console');
const DEBUG_MODE = true;

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
        if (DEBUG_MODE) {
            console.log('recieved join: username = '+ username + ", room = " + room);
            console.log('calling addToLobby');
        }
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
        const lobby = lobbies.get(room);
        if (lobby.gameState == GAMESTATE_LOBBY) {
            io.to(socket.id).emit('lobbyData', JSON.stringify(lobbies.get(room)));
            lobbies.get(room).users.forEach((person) => {
                if (person.id !== socket.id) {
                    io.to(person.id).emit('joinLobbyData', JSON.stringify({ player: username }));
                }
            });
        } else {
            io.to(socket.id).emit('spectatorMidgameLobbyData', JSON.stringify(generateMaskedLobby(room, username)));
        }

        callback();
    });

    socket.on('changeLobbyInfo', ({ username, room, newType }, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved changeLobbyInfo: username = ' + username + ", room = " + room + ", newType = " + newType);
            console.log('calling updateLobbyUserType');
        }
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
        console.log('recieved disconnect');
        const username = idToUsername.get(socket.id);
        console.log(username);
        console.log('calling removeUser');
        const result = removeUser(socket.id);
        if (result !== null) {
            try {
                const room = result.room;
                // io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
                if (lobbies.get(room).gameState === GAMESTATE_LOBBY) {
                    io.to(room).emit('removeLobbyData', JSON.stringify({ person: username }));
                    console.log(result)
                    if (result.newHost) {
                        console.log('host changed, emitting');
                        io.to(room).emit('updateLobbyData', JSON.stringify({ username: result.newHost.username, state: TYPE_HOST }));
                    }
                }
            } catch (e) {
                console.log('error in disconnect');
            }
        }
    });

    socket.on('startGame', ({ room }, callback) => {
        if (DEBUG_MODE) {
            console.log('received startGame: room = ' + room);
            console.log('calling startGame');
        }
        startGame(room, io);
        // emitMidgameLobbyData(room);
        const lobby = lobbies.get(room);
        let fascists = [];
        lobby.users.forEach((person) => {
            if (person.type === TYPE_FASCIST) { fascists.push(person.username); }
        });
        let hitler = null;
        lobby.users.forEach((person) => {
            if (person.type === TYPE_HITLER) { hitler = person.username; }
        });

        let players = 0;
        for(let i = 0; i<lobby.users.length; i++){
            if(lobby.users[i].type !== TYPE_DEAD && lobby.users[i].type !== TYPE_DEAD_FAS && lobby.users[i].type !== TYPE_DEAD_LIB && lobby.users[i].type !== TYPE_SPECTATOR){
                players++;
            }
        }
        lobby.users.forEach((person) => {
            if (person.type === TYPE_LIBERAL) {
                io.to(person.id).emit('startGameData', JSON.stringify({ type: TYPE_LIBERAL, players: players }));
            } else if (person.type === TYPE_FASCIST) {
                io.to(person.id).emit('startGameData', JSON.stringify({ type: TYPE_FASCIST, fascists, hitler, players: players }));
            } else if (person.type === TYPE_HITLER) {
                if(players > 6){
                    io.to(person.id).emit('startGameData', JSON.stringify({ type: TYPE_HITLER,  players: players }));
                } else {
                    io.to(person.id).emit('startGameData', JSON.stringify({ type: TYPE_HITLER,  fascists, players: players }));
                }
            } else if (person.type === TYPE_SPECTATOR) {
                io.to(person.id).emit('startGameData', JSON.stringify({ type: TYPE_SPECTATOR, fascists, hitler,  players: players }));
            }
        });
        //TODO: emit first president
    });

    socket.on('new board', ({room, currentBoard}) => {        
        const lobby = lobbies.get(room);
        lobby.presidentActionList = currentBoard;
        lobby.presidentActionList.push(-1)
        console.log(currentBoard);
        io.to(room).emit('new board', {room, currentBoard})
    })

    socket.on('chooseChancellor', ({ room, choice }, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved chooseChancellor: room = ' + room + ', choice = ' + choice);
            console.log('calling setUpVote');
        }
        // console.log('chose chancellor: ' + choice);
        // console.log('room: ' + room);
        setUpVote(room, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('voting', ({ room, username, choice }, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved voting: room = ' + room + ', username = ' + username);
            console.log('calling registerVote');
        }
        // console.log('received vote: ' + choice);
        registerVote(room, username, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('presDecision', ({ room, index }, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved presDecision: room = ' + room + ', index = ' + index);
            console.log('calling presidentDiscard');
        }
        // console.log('chose card ' + index);
        presidentDiscard(room, index, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('chancDecision', ({room, index}, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved chancDecision: room = ' + room + ', index = ' + index);
            console.log('calling chancellorChoose');
        }
        // console.log('chose card ' + index);
        chancellorChoose(room, index, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('presAction1', ({room, choice}, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved presAction1: room = ' + room + ', choice = ' + choice);
            console.log('calling handlePresAction1');
        }
        // console.log('chose to investigate ' + choice);
        handlePresAction1(room, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('presAction2', ({room, choice}, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved presAction2: room = ' + room + ', choice = ' + choice);
            console.log('calling handlePresAction2');
        }
        // console.log('chose to investigate ' + choice);
        handlePresAction2(room, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('presAction3', ({room}, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved presAction3: room = ' + room);
            console.log('calling handlePresAction3');
        }
        handlePresAction3(room, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('presAction4', ({room, choice}, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved presAction4: room = ' + room + ', choice = ' + choice);
            console.log('calling handlePresAction4');
        }
        handlePresAction4(room, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('presVetoVoting', ({ room, choice }, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved presVetoVoting: room = ' + room + ', choice = ' + choice);
            console.log('calling presidentVeto');
        }
        // console.log('recieved veto vote: ' + choice);
        presidentVeto(room, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('chancellorVetoVoting', ({ room, choice }, callback) => {
        if (DEBUG_MODE) {
            console.log('recieved chancellorVetoVoting: room = ' + room + ', choice = ' + choice);
            console.log('calling chancellorVeto');
        }
        // console.log('recieved veto vote: ' + choice);
        chancellorVeto(room, choice, io);
        //emitMidgameLobbyData(room);
    });

    socket.on('remakeLobby', ({ room }, callback) => {
        console.log('recieved remakeLobby');
        remakeLobby(room);
        io.to(room).emit('lobbyData', JSON.stringify(lobbies.get(room)));
    });

    socket.on('save html', ({room, html}, callback) => {
        roomToHTML.set(room, html);
    });

    socket.on('get html', ({room}, callback) => {
        io.to(room).emit('html', roomToHTML.get(room));
    });

    socket.on('chat', ({ room, username, message }, callback) => {
        console.log('recieved chat from ' + username + ": " + message);
        const lobby = lobbies.get(room);
        if (lobby === null) { console.log('room does not exist'); return; }
        // console.log(lobby.users);
        let isSpectator = false;
        for (user of lobby.users) {
            if (user.username === username) {
                isSpectator = (user.type === TYPE_SPECTATOR);
                break;
            }
        }
        // console.log('isSpectator: ' + isSpectator)
        if (isSpectator) {
            for (user of lobby.users) {
                if (user.type === TYPE_SPECTATOR) {
                    io.to(user.id).emit('chat', JSON.stringify({
                        type: 'spectator',
                        data: { message, username }
                    }));
                }
            }
        } else {
            io.to(room).emit('chat', JSON.stringify({
                type: 'chat',
                data: { message, username }
            }));
        }
    });
});

app.get('/checkLobbyAccess', (req, res) => {
    console.log('recieved checkLobbyAccess');
    console.log(req.query);
    const checkRoom = req.query.room;
    // console.log('checkRoom: ' + checkRoom);
    const checkUsername = req.query.username;
    // console.log('checkUsername: ' + checkUsername);
    if (!lobbies.has(checkRoom)) {
        console.log('no room exists, allowing')
        res.send({
            valid: true,
            error: null
        });
        return;
    }
    const lobby = lobbies.get(checkRoom);
    let valid = true;
    // console.log('lobby.users:');
    // console.log(lobby.users);
    for (user of lobby.users) {
        // console.log(user);
        // console.log(checkUsername);
        // console.log(user.username === checkUsername)
        if (user.username === checkUsername) {
            console.log('found name match');
            valid = false;
            break;
        }
    }
    if (valid) {
        res.send({
            valid: true,
            error: null
        });
        return;
    }
    res.send({
        valid: false,
        error: 'Username already taken'
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
