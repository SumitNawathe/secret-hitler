const TYPE_SPECTATOR = -1;
const TYPE_HOST = 0;
const TYPE_PLAYER = 1;
const TYPE_LIBERAL = 2;
const TYPE_FASCIST = 3;
const TYPE_HITLER = 4;
const TYPE_DEAD = 5;
const TYPE_DEAD_LIB = 6;
const TYPE_DEAD_FAS = 7;
const GAMESTATE_LOBBY = 0;
const GAMESTATE_ONGOING = 1;
const GAMESTATE_FINISHED = 2;
const STATUS_NONE = 0;
const STATUS_VOTING = 1;
const STATUS_PRESCHOOSE = 2;
const STATUS_PRESDEC = 3;
const STATUS_CHANCDEC = 4;
const STATUS_PRESACT1 = 5;
const STATUS_PRESACT2 = 6;
const STATUS_PRESACT3 = 7;
const STATUS_PRESACT4 = 8;
const STATUS_PRESVETOCHOICE = 9;
const STATUS_CHANCVETOCHOICE = 10;

/*
 * STATUS_PRESACT1: investigate party loyalty
 * STATUS_PRESACT2: special election
 * STATUS_PRESACT3: policy peek
 * STATUS_PRESACT4: execution
*/

const lobbies = new Map();
const idToUsername = new Map();
const usernameToLobby = new Map();

const FASCIST = false;
const LIBERAL = true;

/*
 * Lobby:
 * key: room
 * users: array of user objects
 * gameState: current state of the lobby
 * * LOBBY: 0
 * * DURING GAME: 1
 * * AFTER GAME: 2
 * president: index number of current president <USERNAME>
 * chancellor: index number of current or prospective Chancellor <USERNAME>
 * liberalCards: number of liberal cards placed
 * fascistCards: number of fascist cards placed
 * deck: array representing the remaining cards
 * * LIBERAL = true
 * * FASCIST = false
 * previousPresident: index number of previously elected president <USERNAME>
 * previousChancellor: index number of previously elected chancellor <USERNAME>
 * voteCountYes: number of votes yes for this round
 * voteCountNo: number of votes no for this round
 * policyCards: an array of booleans containing the drawn cards for this round
 * investigations: an array of objects with two elements, the first having the username of the president,
 *          and the second having the username of the person investigated
 * nextPres: array containing the indicies of the next few presidents <USERNAME>
 * postGameData: an object containing information relevant after the game
 * * winningParty: either liberal or fascist
 * * prospectiveHost: the username of the person who must confirm to remake the lobby
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
 * * DEAD = 5
 * id: socket id of user
 * status: what action the user is currently taking
 * * NONE: 0
 * * VOTING: 1
 * * PRESIDENT CHOOSING CHANCELLOR: 2
 * * PRESIDENT CARD DECISION: 3
 * * CHANCELLOR CARD DECISION: 4
 * * PRESIDENT ACTION DECISION: 5+
 * lastVote: true/false representing last vote cast yes/no
*/

const createLobby = (room, username, id) => {
    const userArray = [{
        username: username,
        type: TYPE_HOST,
        id: id,
        status: STATUS_NONE,
        lastVote: null
    }]
    const lobby = {
        users: userArray,
        gameState: GAMESTATE_LOBBY,
        president: null,
        chancellor: null,
        liberalCards: 0,
        fascistCards: 0,
        deck: null,
        previousPresident: null,
        previousChancellor: null,
        voteCountYes: 0,
        voteCountNo: 0,
        policyCards: null,
        investigations: null,
        veto: false,
        nextPres : [], // array with the indices of the next few presidents
        postGameData: null
    };
    lobbies.set(room, lobby);
}

const resetLobby = (room) => {
    const lobby = lobbies.get(room);
    lobby.gameState = GAMESTATE_LOBBY;
    lobby.president = null;
    lobby.chancellor = null;
    lobby.liberalCards = 0;
    lobby.fascistCards = 0;
    lobby.deck = null;
    lobby.previousPresident = null;
    lobby.previousChancellor = null;
    lobby.voteCountYes = 0;
    lobby.voteCountNo = 0;
    lobby.policyCards = null;
    lobby.investigations = null;
    lobby.veto = null;
    lobby.nextPres = [];
    lobby.postGameData = null;
    lobby.users.forEach((person) => {
        person.status = STATUS_NONE;
        person.lastVote = false;
    });
}

module.exports = {
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
    STATUS_PRESVETOCHOICE,
    STATUS_CHANCVETOCHOICE,
    FASCIST,
    LIBERAL
};
