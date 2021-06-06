const lobbies = new Map();
const LOBBY_HOST = 0;
const SPECTATOR = -1;
const PLAYER = 1;

const addToLobby = (room, username) => {
    if (lobbies.has(room)) {
        lobby = lobbies.get(room);

        //check if that username is taken
        for (user in lobby) {
            if (user.username === username) {
                return false;
            }
        }

        //include person in lobby
        lobby.push({
            username: username,
            type: SPECTATOR
        })
    } else {
        //create lobby with user as host
        lobby = [{
            username: username,
            type: LOBBY_HOST
        }]
        lobbies.set(room, lobby);
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

module.exports = {
    addToLobby,
    updateLobbyInfo,
    getLobbyInfo
};
