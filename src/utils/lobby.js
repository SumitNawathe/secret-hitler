const lobbies = new Map();
const idToUsername = new Map();
const usernameToLobby = new Map();
const HOST = 0;
const SPECTATOR = -1;
const PLAYER = 1;

const addToLobby = (room, username, id) => {
    if (lobbies.has(room)) {
        lobby = lobbies.get(room);
        console.log('room seems to exist');
        console.log(lobby);

        //check if that username is taken
        for (user in lobby) {
            if (user.username === username) {
                return false;
            }
        }

        //include person in lobby
        lobby.push({
            username: username,
            type: SPECTATOR,
            id: id
        });
        idToUsername.set(id, username);
        usernameToLobby.set(username, room);
    } else {
        //create lobby with user as host
        lobby = [{
            username: username,
            type: HOST,
            id: id
        }]
        lobbies.set(room, lobby);
        idToUsername.set(id, username);
        usernameToLobby.set(username, room);
    }
    return true;
}

const updateLobbyInfo = (room, username, newtype) => {
    lobby = lobbies.get(room);
    if (!lobby) { return false; }
    user = lobby.filter(x => x.username === username);
    if (!user) { return false; }
    user = user[0];
    console.log('user before update');
    console.log(user);
    user.type = newtype;
    console.log('user after update');
    console.log(user);
    return true;
}

const getLobbyInfo = (room) => {
    return lobbies.get(room);
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
    lobbies.set(room, lobbies.get(room).filter(x => {
        if (x.username === username) {
            if (x.type === HOST) {
                hostLeft = true;
            }
            return false;
        }
        return true;
    }));
    if (hostLeft) {
        if (lobbies.get(room).length === 0) {
            lobbies.delete(room);
        } else {
            console.log(lobbies.get(room));
            lobbies.get(room)[0].type = HOST;
        }
    }
    return room;
}

module.exports = {
    addToLobby,
    updateLobbyInfo,
    getLobbyInfo,
    removeUser
};
