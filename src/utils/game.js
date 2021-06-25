const path = require('path');
const {
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
    LIBERAL,
    FASCIST,
    STATUS_CHANCVETOCHOICE,
    STATUS_PRESVETOCHOICE
} = require('../utils/data')

const startGame = (room, io) => { //TODO: dont allow start if not enough users
    const lobby = lobbies.get(room);
    // console.log('SETTING GAMESTATE TO ONGOING');
    //lobby.nextPres.push(lobby.users[1].username); //could cause crash if only 1 user
    lobby.nextPres = [lobby.users[1].username];
    let players = 0;
    for(let i = 0; i<lobby.users.length; i++){
        if(lobby.users[i].type === TYPE_HOST || lobby.users[i].type === TYPE_PLAYER){
            players++;
        }
    }
    lobby.gameState = GAMESTATE_ONGOING;
    // console.log('lobby.gameState: ' + lobby.gameState);
    console.log("players: "+players);
    if (players <= 6) {
        randomAssign(room, 1);
    } else {
        randomAssign(room, 2);
    }
    lobby.president = lobby.users[0].username;
    lobby.liberalCards = 0;
    lobby.fascistCards = 0;
    
    if(players<=5){
        placeCard(room, false, io);
    }

    lobby.deck = []; // technically does not need to be initialized because it will be when drawThreeCards is
    drawThreeCards(room);
    lobby.users[0].status = STATUS_PRESCHOOSE;
    lobby.investigations = [];
    // console.log('USER 0:');
    // console.log(lobby.users[0]);
    
    let alive = 0;
    for(let i = 0; i<lobby.users.length; i++){
        if(lobby.users[i].type===TYPE_DEAD || lobby.users[i].type===TYPE_DEAD_FAS || lobby.users[i].type===TYPE_DEAD_LIB || lobby.users[i].type === TYPE_SPECTATOR){

        } else {
            alive++;
        }
    }

    let eligibleChancellors = [];
    for(let i = 0; i<lobby.users.length; i++){
        if(lobby.users[i].type===TYPE_DEAD || lobby.users[i].type===TYPE_DEAD_FAS || lobby.users[i].type===TYPE_DEAD_LIB || lobby.users[i].type === TYPE_SPECTATOR){

        } else {
            if(lobby.users[i].username === lobby.president){

            } else {
                if(alive>5 && lobby.users[i].username === lobby.chancellor){

                } else {
                    eligibleChancellors.push(lobby.users[i].username);
                }
                
            }
        }
    }

    setTimeout( function() {
    io.to(room).emit('new president', 
        JSON.stringify(
            {
                newPres: lobby.president,
                oldChanc: lobby.previousChancellor,
                oldPres: lobby.previousPresident,
                eligibleChancellors: eligibleChancellors
            }       
        ))
        }, 4000)
}

const setUpVote = (room, chancellorChoice, io) => {
    const lobby = lobbies.get(room);
    // console.log(lobby);
    // console.log(room);
    // console.log(lobbies);
    lobby.voteCountYes = 0;
    lobby.voteCountNo = 0;
    // lobby.users.forEach((person) => {
    //     if (person.type !== TYPE_SPECTATOR && person.type !== TYPE_DEAD) {
    //         person.status = STATUS_VOTING;
    //     }
    // });
    for (let i = 0; i < lobby.users.length; i++) {
        if (lobby.users[i].type !== TYPE_SPECTATOR && lobby.users[i].type !== TYPE_DEAD_LIB && lobby.users[i].type !== TYPE_DEAD_FAS) {
            lobby.users[i].status = STATUS_VOTING;
            // if (lobby.users[i].username === chancellorChoice) { lobby.chancellor = i }
        }
    }
    lobby.chancellor = chancellorChoice;

    io.to(room).emit('chancellor chosen', JSON.stringify({president: lobby.president, chancellor: chancellorChoice}));
}

const registerVote = (room, username, vote, io) => {
    const lobby = lobbies.get(room);
    let countPlayers = 0;

    for(let i = 0; i<lobby.users.length; i++){
        if(!(lobby.users[i].type === TYPE_DEAD_LIB ||lobby.users[i].type === TYPE_DEAD_FAS|| lobby.users[i].type === TYPE_SPECTATOR)){
            countPlayers++;
        }
        if(username === lobby.users[i].username){
            if(!(lobby.users[i].status === STATUS_VOTING)){
                // already voted
                if(vote === lobby.users[i].lastVote){
                    lobby.users[i].status = STATUS_VOTING;
                    lobby.users[i].lastVote = null;
                    if (vote) {
                        lobby.voteCountYes--;
                    } else { 
                        lobby.voteCountNo--; 
                    }
                    io.to(room).emit('rescind vote', JSON.stringify({username: username}));
                } else {
                    if (vote) {
                        lobby.voteCountYes += 1; 
                        lobby.voteCountNo--;
                    } else { 
                        lobby.voteCountNo += 1;
                        lobby.voteCountYes--; 
                    }
                    lobby.users[i].lastVote = vote;
                }
            } else {
                // first vote
                lobby.users[i].status = STATUS_NONE;
                if (vote) { 
                    lobby.voteCountYes += 1; 
                    lobby.users[i].lastVote = true;
                } else { 
                    lobby.voteCountNo += 1; 
                    lobby.users[i].lastVote = false;
                }
                io.to(room).emit('did vote', JSON.stringify({username: username}));
            }
                
        }
            
    }

    console.log("vote yes: "+ lobby.voteCountYes);
    console.log("vote no: "+ lobby.voteCountNo);
    
    if (lobby.voteCountYes + lobby.voteCountNo >= countPlayers) {
        let votes = [];
        for(let i = 0; i<lobby.users.length; i++){
            if(!(lobby.users[i].type === TYPE_DEAD_FAS || lobby.users[i].type === TYPE_DEAD_LIB || lobby.users[i].type === TYPE_SPECTATOR)) {
                // if they voted
                votes.push({username: lobby.users[i].username, yes: lobby.users[i].lastVote});
            }
        }
        io.to(room).emit('vote finished', JSON.stringify({votes: votes}));
        if (lobby.voteCountYes > lobby.voteCountNo) { //election passes
            console.log('numOfFascists: ' + lobby.numOfFascists);
            console.log('chancellor type: ' + getUserFromUsername(room, lobby.chancellor).type);
            if (lobby.fascistCards >= 3 && getUserFromUsername(room, lobby.chancellor).type === TYPE_HITLER) {
                endGame(room, FASCIST);
                return;
            }
            lobby.previousPresident = lobby.president;
            lobby.previousChancellor = lobby.chancellor;
            getUserFromUsername(room, lobby.president).status = STATUS_PRESDEC;
            setTimeout(function() {
                io.to(room).emit('election passes', JSON.stringify({presidentUsername: lobby.president, chancellorUsername: lobby.chancellor}));
                drawThreeCards(room);
                io.to(getUserFromUsername(room, lobby.president).id).emit('get three cards', JSON.stringify({cards: lobby.policyCards}));
            }, 4000)
        } else { //election fails
            setTimeout(function() {
                io.to(room).emit('election failed', JSON.stringify());
                nextPresident(room, false, io);
            }, 4000)
        }
        for(let i=0; i<lobby.users.length; i++){
            lobby.users[i].lastVote = null;
        }
    }
    console.log(lobby.users);
}

const presidentVeto = (room, decision, io) => {
    const lobby = lobbies.get(room);
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    io.to(room).emit('president veto decide', JSON.stringify({choice: decision}));
    if(decision){
        // if pres wants to veto
        getUserFromUsername(room, lobby.chancellor).status = STATUS_CHANCVETOCHOICE;
    } else {
        placeCard(room, lobby.policyCards[0], io);
    }
}

const chancellorVeto = (room, decision, io) => {
    const lobby = lobbies.get(room);
    getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
    io.to(room).emit('chancellor veto decide', JSON.stringify({choice: decision}));
    if(decision){
        // if chancellor wants to veto
        nextPresident(room, true, io);
    } else {
        placeCard(room, lobby.policyCards[0], io);
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

const presidentDiscard = (room, index /* starting from 0 and ending at 2 inclusive */, io) => {
    const lobby = lobbies.get(room);
    lobby.policyCards.splice(index, 1);
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    getUserFromUsername(room, lobby.chancellor).status = STATUS_CHANCDEC;
    io.to(room).emit('president discard', JSON.stringify({president: lobby.president, chancellor: lobby.chancellor}));
    io.to(getUserFromUsername(room, lobby.chancellor).id).emit('chancellor get two cards', JSON.stringify({policyCards: lobby.policyCards}));
}

const chancellorChoose = (room, index /*either 0 or 1 */, io) => {
    const lobby = lobbies.get(room);
    if(!lobby.veto){
        placeCard(room, lobby.policyCards[index], io);
    } else {
        // console.log("making president veto");
        getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
        getUserFromUsername(room, lobby.president).status = STATUS_PRESVETOCHOICE;
        lobby.policyCards = [lobby.policyCards[index]];
        io.to(getUserFromUsername(room, lobby.president)).emit('president veto choice', JSON.stringify());
    }
}

const placeCard = (room, type, io) => {
    const lobby = lobbies.get(room);
    if (type == LIBERAL){
        lobby.liberalCards++;
        setTimeout(function() {
        nextPresident(room, true, io);
        }, 3000)
    } else {
        try {
            lobby.fascistCards++;
            getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
            getUserFromUsername(room, lobby.president).status = presidentAction(room);
        } catch (error) {}
    }
    if (lobby.fascistCards == 6) {
        endGame(room, FASCIST);
    } else if (lobby.liberalCards == 5) {
        endGame(room, LIBERAL);
    }
    console.log("fascists"+lobby.fascistCards);
    console.log("liberal"+lobby.liberalCards);
    io.to(room).emit('place card', JSON.stringify({type: type, liberalsPlacedIncludingThisCard: lobby.liberalCards, fascistsPlacedIncludingThisCard: lobby.fascistCards}));
}

const presidentAction = (room, io) => {
    const lobby = lobbies.get(room);
    let numPlayers = 0;
    lobby.users.forEach((person) => {
        if (person.type != TYPE_SPECTATOR && person.type != TYPE_DEAD_LIB && person.type != TYPE_DEAD_FAS) {
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

const handlePresAction1 = (room, username, io) => {
    console.log('recieved presAction1');
    const lobby = lobbies.get(room);
    lobby.investigations.push([lobby.president, username]);
    nextPresident(room, true, io);
}

const handlePresAction2 = (room, specialPres, io) => {
    console.log('recieved presAction2');
    // console.log("special election to " + specialPres);
    const lobby = lobbies.get(room);
    let index = 0;
    for( index = 0; index<lobby.users.length && !(lobby.users[index].username === specialPres); index++){}
    // console.log("special election index "+index);
    lobby.nextPres.unshift(lobby.users[index].username);
    nextPresident(room, true, io);
}

const handlePresAction3 = (room, io) => {
    console.log('recieved presAction3');
    const lobby = lobbies.get(room);
    drawThreeCards(room);
    const cards = lobby.policyCards;
    lobby.deck.unshift(cards[0]);
    lobby.deck.unshift(cards[0]);
    lobby.deck.unshift(cards[0]);
    nextPresident(room, true, io);
    return cards;
}

const handlePresAction4 = (room, killUser, io) => {
    console.log('recieved presAction3');
    const lobby = lobbies.get(room);
    let index = 0;
    for( index = 0; index<lobby.users.length && !(lobby.users[index].username === killUser); index++){}
    if (lobby.users[index].type === TYPE_HITLER) {
        endGame(room, LIBERAL);
        return;
    }
    if (lobby.users[index].type === TYPE_LIBERAL) { lobby.users[index].type = TYPE_DEAD_LIB; }
    else { lobby.users[index].type = TYPE_DEAD_FAS; }
    nextPresident(room, true, io);
}

const nextPresident = (room, electionPassed, io) => {
    const lobby = lobbies.get(room);
    // console.log(lobby.nextPres);
    if(electionPassed){
        lobby.previousPresident = lobby.president;
        lobby.previousChancellor = lobby.chancellor;
    }
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
    
    lobby.president = lobby.nextPres[0];
    lobby.chancellor = null;
    console.log('nextPres array:');
    console.log(lobby.nextPres);

    if (lobby.nextPres.length === 1) {
        let index = getIndexFromUsername(room, lobby.nextPres[0]) % lobby.users.length;
        while(lobby.users[index].type === TYPE_DEAD_LIB || lobby.users[index].type === TYPE_DEAD_FAS || lobby.users[index].type === TYPE_SPECTATOR){
            index = (index+1) % lobby.users.length;
        }
        lobby.president = lobby.users[index].username;
        console.log('lobby.president');
        console.log(lobby.president);
        index = (index+1) % lobby.users.length;
        while(lobby.users[index].type === TYPE_DEAD_LIB || lobby.users[index].type === TYPE_DEAD_FAS || lobby.users[index].type === TYPE_SPECTATOR){
            index = (index+1) % lobby.users.length;
        }
        lobby.nextPres.push(lobby.users[index].username);
    }
    lobby.nextPres.splice(0, 1);
    getUserFromUsername(room, lobby.president).status = STATUS_PRESCHOOSE;
    let alive = 0;
    for(let i = 0; i<lobby.users.length; i++){
        if(lobby.users[i].type===TYPE_DEAD || lobby.users[i].type===TYPE_DEAD_FAS || lobby.users[i].type===TYPE_DEAD_LIB || lobby.users[i].type === TYPE_SPECTATOR){

        } else {
            alive++;
        }
    }
    let eligibleChancellors = [];
    for(let i = 0; i<lobby.users.length; i++){
        if(lobby.users[i].type===TYPE_DEAD || lobby.users[i].type===TYPE_DEAD_FAS || lobby.users[i].type===TYPE_DEAD_LIB || lobby.users[i].type === TYPE_SPECTATOR){

        } else {
            if(lobby.users[i].username === lobby.president){

            } else {
                if(alive>5 && lobby.users[i].username === lobby.chancellor){

                } else {
                    eligibleChancellors.push(lobby.users[i].username);
                }
                
            }
        }
    }
    io.to(room).emit('new president', 
        JSON.stringify(
            {
                newPres: lobby.president,
                oldChanc: lobby.previousChancellor,
                oldPres: lobby.previousPresident,
                eligibleChancellors: eligibleChancellors

            }       
        ));
}


const endGame = (room, winningTeam) => {
    const lobby = lobbies.get(room);
    lobby.postGameData = [winningTeam, lobby.users[0].username];
    lobby.gameState = GAMESTATE_FINISHED;

    lobby.users.forEach((person) => {
        if (person.type === TYPE_DEAD_LIB) { person.type = TYPE_LIBERAL}
        else if (person.type === TYPE_DEAD_FAS) { person.type = TYPE_FASCIST }
    });
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
                // console.log("hitler:"+j);
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
    const hardDontMask = [];
    if (getUserFromUsername(room, username).type === TYPE_FASCIST) {
        lobby.users.forEach((person) => {
            if (person.type === TYPE_FASCIST || person.type === TYPE_HITLER) {
                hardDontMask.push(person.username);
            }
        });
    }
    const userArray = [];
    //console.log('ENTERING GENERATE MASKED LOBBY LOOP');
    lobby.users.forEach((person) => {
        //console.log(person);
        if (person.type === TYPE_SPECTATOR) { return; }
        if (person.username === username || hardDontMask.includes(person.username)) {
            userArray.push(person);
        } else if (dontMask.includes(person.username)) {
            userArray.push({
                username: person.username,
                type: (person.type === TYPE_DEAD_LIB || person.type === TYPE_DEAD_FAS) ? TYPE_DEAD : (person.type === TYPE_LIBERAL ? TYPE_LIBERAL : TYPE_FASCIST),
                id: person.id,
                status: person.status
            });
        } else {
            userArray.push({
                username: person.username,
                type: (person.type === TYPE_DEAD_LIB || person.type === TYPE_DEAD_FAS) ? TYPE_DEAD : null,
                id: person.id,
                status: person.status
            });
        }
    });

    let shouldBeGivenPolicyCards = (lobby.president === username && (getUserFromUsername(room, lobby.president).status === STATUS_PRESDEC || getUserFromUsername(room, lobby.president).status === STATUS_PRESACT3));
    if (!(lobby.chancellor === null)) {
        shouldBeGivenPolicyCards = shouldBeGivenPolicyCards || (lobby.chancellor === username && getUserFromUsername(room, lobby.chancellor).status === STATUS_CHANCDEC);
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

const generatePostGameLobbyData = (room) => {
    const lobby = lobbies.get(room);
    const userArray = [];
    lobby.users.forEach((person) => {
        if (person.type === TYPE_SPECTATOR) { return; }
        userArray.push(person);
    });
    return {
        users: userArray,
        gameState: lobby.gameState,
        president: lobby.president,
        chancellor: lobby.chancellor,
        liberalCards: lobby.liberalCards,
        fascistCards: lobby.fascistCards,
        previousPresident: lobby.previousPresident,
        previousChancellor: lobby.previousChancellor,
        postGameData: lobby.postGameData
    }
}

const getUserFromUsername = (room, username) => {
    const lobby = lobbies.get(room);
    // console.log('lobbies')
    // console.log(lobbies);
    // console.log('room');
    // console.log(room);
    // console.log('lobby');
    // console.log(lobby);
    // console.log('users');
    // console.log(lobby.users);
    for (let i = 0; i < lobby.users.length; i++) {
        if (lobby.users[i].username === username) {
            return lobby.users[i];
        }
    }
}

const getIndexFromUsername = (room, username) => {
    const lobby = lobbies.get(room);
    for (let i = 0; i < lobby.users.length; i++) {
        if (lobby.users[i].username === username) {
            return i;
        }
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