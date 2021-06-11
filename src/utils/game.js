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

const startGame = (room) => {
    const lobby = lobbies.get(room);
    lobby.users.forEach(person => {
        if (Math.random() < 0.5) {
            person.type = TYPE_LIBERAL;
        } else {
            person.type = TYPE_FASCIST
        }
    });
}

module.exports = {
    startGame
}