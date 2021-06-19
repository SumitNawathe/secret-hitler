const path = require('path');
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
} = require('../utils/data')

const addToLobby = (room, username, id) => {
    if (lobbies.has(room)) {
        lobby = lobbies.get(room);
        console.log('room seems to exist');
        console.log(lobby);

        //check if that username is taken
        for (user in lobby.users) {
            if (user.username === username) {
                return false;
            }
        }

        //include person in lobby
        if(lobby.gameState === GAMESTATE_ONGOING){
            lobby.users.push({
                username: username,
                type: TYPE_SPECTATOR,
                id: id,
                status: STATUS_NONE,
                lastVote: false
            });
        } else {
            lobby.users.push({
                username: username,
                type: TYPE_PLAYER,
                id: id,
                status: STATUS_NONE,
                lastVote: false
            });
        }
        
        idToUsername.set(id, username);
        usernameToLobby.set(username, room);
    } else {
        //create lobby with user as host
        createLobby(room, username, id);
        idToUsername.set(id, username);
        usernameToLobby.set(username, room);
    }
    return true;
}

const updateLobbyUserType = (room, username, newtype) => {
    lobbyUsers = lobbies.get(room).users;
    if (!lobbyUsers) { return false; }
    user = lobbyUsers.filter(x => x.username === username);
    if (!user) { return false; }
    user = user[0];
    console.log('user before update');
    console.log(user);
    user.type = newtype;
    console.log('user after update');
    console.log(user);
    return true;
}

const removeUser = (id) => {
    console.log('removeUser');
    const username = idToUsername.get(id);
    if (!username) {
        console.log('no such user exists');
        return null;
    }
    idToUsername.delete(id);
    const room = usernameToLobby.get(username);
    usernameToLobby.delete(username);
    console.log('running filter');
    let hostLeft = false;
    lobbies.get(room).users = lobbies.get(room).users.filter(x => {
        if (x.username === username) {
            if (x.type === TYPE_HOST) {
                hostLeft = true;
            }
            return false;
        }
        return true;
    });
    if (hostLeft) {
        if (lobbies.get(room).users.length === 0) {
            lobbies.delete(room);
        } else {
            console.log(lobbies.get(room).users);
            lobbies.get(room).users[0].type = TYPE_HOST;
        }
    }
    return room;
}

const remakeLobby = (room) => {
    resetLobby(room);
    const lobby = lobbies.get(room);
    lobby.users[0].type = TYPE_HOST;
    for (let i = 1; i < lobby.users.length; i++) {
        if (lobby.users[i].type !== TYPE_SPECTATOR) { lobby.users[i].type = TYPE_PLAYER; }
    }
}

module.exports = {
    addToLobby,
    updateLobbyUserType,
    removeUser,
    remakeLobby
};