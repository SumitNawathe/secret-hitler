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
    STATUS_PRESACT1,
    STATUS_PRESACT2,
    STATUS_PRESACT3,
    STATUS_PRESACT4,
    LIBERAL,
    FASCIST,
    STATUS_CHANCVETOCHOICE,
    STATUS_PRESVETOCHOICE
} = require('../utils/data')

const startGame = (room) => {
    const lobby = lobbies.get(room);
    console.log('SETTING GAMESTATE TO ONGOING');
    lobby.gameState = GAMESTATE_ONGOING;
    console.log('lobby.gameState: ' + lobby.gameState);
    randomAssign(room, 2); //TODO: change to depend on number of players
    lobby.president = 0;
    lobby.liberalCards = 0;
    lobby.fascistCards = 3;

    lobby.deck = []; // technically does not need to be initialized because it will be when drawThreeCards is
    lobby.users[0].status = STATUS_PRESCHOOSE;
    lobby.investigations = [];
    console.log('USER 0:');
    console.log(lobby.users[0]);
}

const setUpVote = (room, chancellorChoice) => {
    const lobby = lobbies.get(room);
    console.log(lobby);
    console.log(room);
    console.log(lobbies);
    lobby.voteCountYes = 0;
    lobby.voteCountNo = 0;
    // lobby.users.forEach((person) => {
    //     if (person.type !== TYPE_SPECTATOR && person.type !== TYPE_DEAD) {
    //         person.status = STATUS_VOTING;
    //     }
    // });
    for (let i = 0; i < lobby.users.length; i++) {
        if (lobby.users[i].type !== TYPE_SPECTATOR && lobby.users[i].type !== TYPE_DEAD) {
            lobby.users[i].status = STATUS_VOTING;
            if (lobby.users[i].username === chancellorChoice) { lobby.chancellor = i }
        }
    }
    drawThreeCards(room);
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
            nextPresident(room, false);
        }
    }
}

const presidentVeto = (room, decision) => {
    const lobby = lobbies.get(room);
    lobby.users[lobby.president].status = STATUS_NONE;
    if(decision){
        // if pres wants to veto
        lobby.users[lobby.chancellor].status = STATUS_CHANCVETOCHOICE;
    } else {
        placeCard(room, lobby.policyCards[0]);
    }
}

const chancellorVeto = (room, decision) => {
    const lobby = lobbies.get(room);
    lobby.users[lobby.chancellor].status = STATUS_NONE;
    if(decision){
        // if chancellor wants to veto
        nextPresident(room, true);
    } else {
        placeCard(room, lobby.policyCards[0]);
    }
}

const drawThreeCards = (room) => {
    const lobby = lobbies.get(room);
    if(lobby.deck.length < 3){
        lobby.deck = [];
        for(let i=0; i<6-lobby.liberalCards; i++){
            lobby.deck.push(true);
        }
        for(let i=0; i<11-lobby.fascistCards; i++){
            lobby.deck.push(false);
        }

        lobby.deck = randomShuffle(lobby.deck);
    }
    lobby.policyCards = [];
    lobby.policyCards.push(lobby.deck[0]);
    lobby.policyCards.push(lobby.deck[1]);
    lobby.policyCards.push(lobby.deck[2]);
    lobby.deck.splice(0, 3);
}

const presidentDiscard = (room, index /* starting from 0 and ending at 2 inclusive */) => {
    const lobby = lobbies.get(room);
    lobby.policyCards.splice(index, 1);
    lobby.users[lobby.president].status = STATUS_NONE;
    lobby.users[lobby.chancellor].status = STATUS_CHANCDEC;
}

const chancellorChoose = (room, index /*either 0 or 1 */) => {
    const lobby = lobbies.get(room);
    if(!lobby.veto){
        placeCard(room, lobby.policyCards[index]);
    } else {
        console.log("making president veto");
        lobby.users[lobby.chancellor].status = STATUS_NONE;
        lobby.users[lobby.president].status = STATUS_PRESVETOCHOICE;
        lobby.policyCards = [lobby.policyCards[index]];
    }
}

const placeCard = (room, type) => {
    const lobby = lobbies.get(room);
    if (type == LIBERAL){
        lobby.liberalCards++;
        nextPresident(room, true);
    } else {
        lobby.fascistCards++;
        lobby.users[lobby.chancellor].status = STATUS_NONE;
        lobby.users[lobby.president].status = presidentAction(room);
    }
    if (lobby.fascistCards == 6) {
        endGame(room, FASCIST);
    } else if (lobby.liberalCards == 5) {
        endGame(room, LIBERAL);
    }
    console.log("fascists"+lobby.fascistCards);
    console.log("liberal"+lobby.liberalCards);
}

const presidentAction = (room) => {
    const lobby = lobbies.get(room);
    let numPlayers = 0;
    lobby.users.forEach((person) => {
        if (person.type != TYPE_SPECTATOR && person.type != TYPE_DEAD) {
            numPlayers += 1;
        }
    });

    //TODO: Make it based on the number of players; this is only one case for a medium group
    if (lobby.fascistCards === 1) {
        return STATUS_PRESACT1;
    } else if (lobby.fascistCards === 2) {
        return STATUS_PRESACT2;
    } else if (lobby.fascistCards === 3) {
        return STATUS_PRESACT3;
    } else if (lobby.fascistCards === 4 || lobby.fascistCards === 5) {
        return STATUS_PRESACT4;
    }
}

const handlePresAction1 = (room, username) => {
    const lobby = lobbies.get(room);
    lobby.investigations.push([lobby.users[lobby.president].username, username]);
    nextPresident(room, true);
}

const handlePresAction2 = (room, specialPres) => {
    console.log("special election to " + specialPres);
    const lobby = lobbies.get(room);
    let index = 0;
    for( index = 0; index<lobby.users.length && !(lobby.users[index].username === specialPres); index++){}
    console.log("special election index "+index);
    lobby.nextPres.unshift(index);
    nextPresident(room, true);
}

const handlePresAction3 = (room) => {
    nextPresident(room, true);
}

const handlePresAction4 = (room, killUser) => {
    const lobby = lobbies.get(room);
    let index = 0;
    for( index = 0; index<lobby.users.length && !(lobby.users[index].username === killUser); index++){}
    lobby.users[index].type = TYPE_DEAD;
    nextPresident(room, true);
}

const nextPresident = (room, electionPassed) => {
    
    const lobby = lobbies.get(room);
    console.log(lobby.nextPres);
    if(electionPassed){
        lobby.previousPresident = lobby.president;
        lobby.previousChancellor = lobby.chancellor;
    }
    lobby.users[lobby.president].status = STATUS_NONE;
    lobby.users[lobby.chancellor].status = STATUS_NONE;
    lobby.president = lobby.nextPres[0];
    lobby.chancellor = null;
    if(lobby.nextPres.length===1){
        let index = (lobby.nextPres[0]) % lobby.users.length;
        while(lobby.users[index].type === TYPE_DEAD || lobby.users[index].type === TYPE_SPECTATOR){
            index = (index+1) % lobby.users.length;
        }
        lobby.president = index;
        index = (index+1) % lobby.users.length;
        while(lobby.users[index].type === TYPE_DEAD || lobby.users[index].type === TYPE_SPECTATOR){
            index = (index+1) % lobby.users.length;
        }
        lobby.nextPres.push(index);
    }
    lobby.nextPres.splice(0, 1);
    lobby.users[lobby.president].status = STATUS_PRESCHOOSE;
}


const endGame = (room, winningTeam) => {
    // just a placeholder for now
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
            if(ourUsers[j].type!=TYPE_SPECTATOR && ourUsers[j].type!=TYPE_FASCIST){
                if(traversed==willTraversed){
                    ourUsers[j].type = TYPE_FASCIST;
                    console.log(j);
                    break;
                }
                traversed++;
            }
        }
    }

    // assigns hitler
    // number of players (ignoring already determined fascists and spectators) we will skip over before choosing hitler
    let willTraversed = Math.floor((players-numOfFascists)*(Math.random())); 
    let traversed = 0; // number of players (ignoring already determined fascists and spectators) we have traversed in our array 
    for(let j =0; j<ourUsers.length; j++){
        if(ourUsers[j].type!=TYPE_SPECTATOR && ourUsers[j].type!=TYPE_FASCIST){
            if(traversed==willTraversed){
                ourUsers[j].type = TYPE_HITLER;
                console.log("hitler:"+j);
                break;
            }
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

const getIndexFromId = (room, id) => {
    const lobby = lobbies.get(room);
    for (let i = 0; i < lobby.users.length; i++) {
        if (lobby.users[i].id === id) {
            return i;
        }
    }
}

//allow president and chancellor to see policy cards at appropriate times
const generateMaskedLobby = (room, username) => {
    const lobby = lobbies.get(room);
    // console.log('generateMaskedLobby');
    // console.log(lobby);
    const dontMask = [];
    lobby.investigations.forEach((pair) => {
        if (pair[0] === username) { dontMask.push(pair[1]); }
    });
    const userArray = [];
    //console.log('ENTERING GENERATE MASKED LOBBY LOOP');
    lobby.users.forEach((person) => {
        //console.log(person);
        if (person.type === TYPE_SPECTATOR) { return; }
        if (person.username === username) {
            userArray.push(person);
        } else if (dontMask.includes(person.username)) {
            userArray.push({
                username: person.username,
                type: person.type === TYPE_LIBERAL ? TYPE_LIBERAL : TYPE_FASCIST,
                id: person.id,
                status: person.status
            });
        } else {
            userArray.push({
                username: person.username,
                id: person.id,
                status: person.status
            });
        }
    });

    let shouldBeGivenPolicyCards = (lobby.users[lobby.president].username === username && (lobby.users[lobby.president].status === STATUS_PRESDEC || lobby.users[lobby.president].status === STATUS_PRESACT3));
    if (!(lobby.chancellor === null)) {
        shouldBeGivenPolicyCards = shouldBeGivenPolicyCards || (lobby.users[lobby.chancellor].username === username && lobby.users[lobby.chancellor].status === STATUS_CHANCDEC);
    }
    return {
        users: userArray,
        gameState: lobby.gameState,
        president: lobby.president,
        nextPresident: lobby.nextPresident,
        chancellor: lobby.chancellor,
        liberalCards: lobby.liberalCards,
        fascistCards: lobby.fascistCards,
        previousPresident: lobby.previousPresident,
        previousChancellor: lobby.previousChancellor,
        policyCards: shouldBeGivenPolicyCards ? lobby.policyCards : null,
        investigations: lobby.investigations
    }
}

module.exports = {
    startGame,
    setUpVote,
    registerVote,
    drawThreeCards,
    presidentDiscard,
    chancellorChoose,
    handlePresAction1,
    handlePresAction2,
    handlePresAction3,
    handlePresAction4,
    generateMaskedLobby,
    chancellorVeto,
    presidentVeto
}