const path = require('path');
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
        lobby.users.push({
            username: username,
            type: TYPE_SPECTATOR,
            id: id,
            status: STATUS_NONE
        });
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

module.exports = {
    addToLobby,
    updateLobbyUserType,
    removeUser
};
