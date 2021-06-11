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
    randomAssign(room, 2);
    let deck = [true, false, true, true, false, true, false];
    console.log(randomShuffle(deck));
    deck = [true, false, true, true, false, true, false];
    console.log(randomShuffle(deck));
    deck = [true, false, true, true, false, true, false];
    console.log(randomShuffle(deck));
    deck = [true, false, true, true, false, true, false];
    console.log(randomShuffle(deck));
    deck = [true, false, true, true, false, true, false];
    console.log(randomShuffle(deck));
    deck = [true, false, true, true, false, true, false];
    console.log(randomShuffle(deck));

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
                ourUsers[j] = TYPE_FASCIST;
                // console.log(j);
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
            ourUsers[j] = TYPE_HITLER;
            // console.log("hitler:"+j);
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
    startGame
}