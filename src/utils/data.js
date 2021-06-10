const lobbies = new Map();
const idToUsername = new Map();
const usernameToLobby = new Map();

/*
 * Lobby:
 * key: room
 * users: array of user objects
 * gameState: current state of the lobby
 * * LOBBY: 0
 * * DURING GAME: 1
 * * AFTER GAME: 2
 * president: index number of current president
 * nextPresident: index number of next president
 * chancellor: index number of current or prospective Chancellor
 * liberalCards: number of liberal cards placed
 * fascistCards: number of fascist cards placed
*/

/*
 *User:
 * username: string containing entered username
 * type: classification of user
 * * SPECTATOR = -1
 * * HOST = 0 (lobby mode)
 * * PLAYER = 1 (lobby mode)
 * * LIBERAL = 2
 * * FASCIST = 3 (not Hitler)
 * * HITLER = 4
 * id: socket id of user
*/

module.exports = {
    lobbies,
    idToUsername,
    usernameToLobby
};
