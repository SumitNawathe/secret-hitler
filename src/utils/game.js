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
    TYPE_DEAD,
    GAMESTATE_LOBBY,
    GAMESTATE_ONGOING,
    GAMESTATE_FINISHED,
    STATUS_NONE,
    STATUS_VOTING,
    STATUS_PRESCHOOSE,
    STATUS_PRESDEC,
    STATUS_CHANCDEC,
    STATUS_PRESACT
} = require('../utils/data')

const startGame = (room) => {
    const lobby = lobbies.get(room);
    lobby.gameState = GAMESTATE_ONGOING;
    randomAssign(room, 2); //TODO: change to depend on number of players
    lobby.president = 0;
    lobby.nextPresident = 1;
    lobby.liberalCards = 0;
    lobby.fascistCards = 0;

    lobby.users[0].status = STATUS_PRESCHOOSE;
    console.log('USER 0:');
    console.log(lobby.users[0]);
}

const setUpVote = (room, chancellorChoice) => { //ERROR: room is undefined
    const lobby = lobbies.get(room);
    console.log(lobby);
    console.log(room);
    console.log(lobbies);
    lobby.voteCountYes = 0;
    lobby.voteCountNo = 0;
    lobby.users.forEach((person) => {
        if (person.type !== TYPE_SPECTATOR && person.type !== TYPE_DEAD) {
            person.status = STATUS_VOTING;
        }
    });
    for (let i = 0; i < lobby.users.length; i++) {
        if (lobby.users[i].type !== TYPE_SPECTATOR && lobby.users[i].type !== TYPE_DEAD) {
            lobby.users[i].status = STATUS_VOTING;
            if (lobby.users[i].username === chancellorChoice) { lobby.chancellor = i }
        }
    }
}

const registerVote = (room, username, vote) => {
    const lobby = lobbies.get(room);
    if (vote) { lobby.voteCountYes += 1; }
    else { lobby.voteCountNo += 1; }
    let countPlayers = 0;
    lobby.users.forEach((person) => {
        if (person.type !== TYPE_SPECTATOR && person.type !== TYPE_DEAD) {
            countPlayers += 1;
            if (person.username === username) {
                person.lastVote = vote;
                person.status = STATUS_NONE;
            }
        }
    });

    if (lobby.voteCountYes + lobby.voteCountNo >= countPlayers) {
        if (lobby.voteCountYes > lobby.voteCountNo) { //election passes
            lobby.previousPresident = lobby.president;
            lobby.previousChancellor = lobby.chancellor;
            lobby.users[lobby.president].status = STATUS_PRESDEC;
        } else { //election fails
            lobby.president = lobby.nextPresident;
            lobby.chancellor = null;
            lobby.nextPresident = (lobby.nextPresident + 1) % lobby.users.length;
            while (lobby.nextPresident.type === TYPE_DEAD || lobby.nextPresident.type === TYPE_SPECTATOR) {
                lobby.nextPresident = (lobby.nextPresident + 1) % lobby.users.length;
            }
            lobby.users[lobby.president].status = STATUS_PRESCHOOSE;
        }
    }
}

const randomAssign = (room, numOfFascists /*not including hilter*/) => {
    // takes an variable number of fascists and then randomly assigns them to the players
    // also randomly assigns hitler

    // removes last game's assignments
    let players = 0; // determines the number of active players
    for(let i=0; i<lobbies.get(room).users.length; i++){
        if(lobbies.get(room).users[i].type != TYPE_SPECTATOR){
            players++;
            lobbies.get(room).users[i].type = TYPE_LIBERAL;
        }
    } 

    let ourUsers = lobbies.get(room).users;

    // assigns the fascists
    for(let i =0; i<numOfFascists; i++){
        // number of players (ignoring already determined fascists and spectators) we will skip over before choosing the next fascist
        let willTraversed = Math.floor((players-i)*(Math.random())); 
        let traversed = 0; // number of players (ignoring already determined fascists and spectators) we have traversed in our array 
        for(let j =0; j<ourUsers.length; j++){
            if(traversed==willTraversed){
                ourUsers[j].type = TYPE_FASCIST;
                console.log(j);
                break;
            }
            if(ourUsers[j].type!=TYPE_SPECTATOR && ourUsers[j].type!=TYPE_FASCIST){
                traversed++;
            }
        }
    }

    // assigns hitler
    // number of players (ignoring already determined fascists and spectators) we will skip over before choosing hitler
    let willTraversed = Math.floor((players-numOfFascists)*(Math.random())); 
    let traversed = 0; // number of players (ignoring already determined fascists and spectators) we have traversed in our array 
    for(let j =0; j<ourUsers.length; j++){
        if(traversed==willTraversed){
            ourUsers[j].type = TYPE_HITLER;
            console.log("hitler:"+j);
            break;
        }
        if(ourUsers[j].type!=TYPE_SPECTATOR && ourUsers[j].type!=TYPE_FASCIST){
            traversed++;
        }
    }
}

// outputs an array of true and falses with the same number as deck but in a different order
const randomShuffle = (deck) => {
    let output = []; 
    while(deck.length>0){
        let index = Math.floor(deck.length*(Math.random()));
        output.push(deck[index]);
        deck.splice(index, 1);
    }
    return output;
}

module.exports = {
    startGame,
    setUpVote,
    registerVote
}