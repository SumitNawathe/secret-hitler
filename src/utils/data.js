const TYPE_SPECTATOR = -1;
const TYPE_HOST = 0;
const TYPE_PLAYER = 1;
const TYPE_LIBERAL = 2;
const TYPE_FASCIST = 3;         
const TYPE_HITLER = 4;
const GAMESTATE_LOBBY = 0;
const GAMESTATE_ONGOING = 1;
const GAMESTATE_FINISHED = 2;
const STATUS_NONE = 0;
const STATUS_VOTING = 1;
const STATUS_PRESDEC = 2;
const STATUS_CHANCDEC = 3;
const STATUS_PRESACT = 4;

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
 * deck: array representing the remaining cards
 * * LIBERAL = true
 * * FASCIST = false
*/

/*
 * User:
 * username: string containing entered username
 * type: classification of user
 * * SPECTATOR = -1
 * * HOST = 0 (lobby mode)
 * * PLAYER = 1 (lobby mode)
 * * LIBERAL = 2
 * * FASCIST = 3 (not Hitler)
 * * HITLER = 4
 * id: socket id of user
 * status: what action the user is currently taking
 * * NONE: 0
 * * VOTING: 1
 * * PRESIDENT CARD DECISION: 2
 * * CHANCELLOR CARD DECISION: 3
 * * PRESIDENT ACTION DECISION: 4
*/

const createLobby = (room, username, id) => {
    const userArray = [{
        username: username,
        type: TYPE_HOST,
        id: id,
        status: STATUS_NONE
    }]
    const lobby = {
        users: userArray,
        gameState: GAMESTATE_LOBBY,
        president: null,
        nextPresident: null,
        chancellor: null,
        liberalCards: 0,
        fascistCards: 0,
        deck: null
    };
    lobbies.set(room, lobby);
}

module.exports = {
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
};
