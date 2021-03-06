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
    STATUS_PRESACT_NONE,
    LIBERAL,
    FASCIST,
    STATUS_CHANCVETOCHOICE,
    STATUS_PRESVETOCHOICE
} = require('../utils/data')

const startGame = (room, io) => { //TODO: dont allow start if not enough users
    console.log('inside game.startGame');
    console.log(lobbies);
    const lobby = lobbies.get(room);

    randomizePlayerOrder(room);
    io.to(room).emit('new order', JSON.stringify({usersAndSpectators: lobby.users}));
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
    } else if (players <= 8) {
        randomAssign(room, 2);
    } else {
        randomAssign(room, 3);
    }


    lobby.president = lobby.users[0].username;
    lobby.liberalCards = 0;
    lobby.fascistCards = 0;
    
    if(players<=5){
        placeCard(room, false, io);
    }

    lobby.veto = false;

    lobby.deck = []; // technically does not need to be initialized because it will be when drawThreeCards is
    drawThreeCards(room);
    lobby.users[0].status = STATUS_PRESCHOOSE;
    lobby.investigations = [];
    lobby.failedElectionTracker = 0;
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
        if(lobby.users[i].type !== TYPE_DEAD && lobby.users[i].type !== TYPE_DEAD_FAS && lobby.users[i].type !== TYPE_DEAD_LIB && lobby.users[i].type !== TYPE_SPECTATOR){
            // if user is playing the game
            if(lobby.users[i].username !== lobby.president && lobby.users[i].username !== lobby.previousChancellor){
                // if user is not the president and not the previous chancellor
                if(alive <= 5 || (alive > 5 && lobby.users[i].username !== lobby.previousPresident)){
                    eligibleChancellors.push(lobby.users[i].username);
                }
            }
        }
    }
    console.log("eligible chancellors: "+eligibleChancellors);

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
    for(let i = 0; i<lobby.users.length; i++){
        console.log(lobby.users[i]);
    }
}

const randomizePlayerOrder = (room) => {
    const lobby = lobbies.get(room);
    let newUserArray = [];
    let spectatorArray = [];
    let players = 0;
    for(let i = 0; i<lobby.users.length; i++){
        if(lobby.users[i].type === TYPE_SPECTATOR){
            spectatorArray.push(lobby.users[i]);
        } else {
            players++;
            newUserArray.push(lobby.users[i]);
        }
        if(lobby.users[i].type===TYPE_HOST){
            lobby.users[i] = TYPE_PLAYER;
        }
    }

    for(let i = 0; i<newUserArray.length; i++){
        let index = Math.round((players-i)*Math.random());
        let user = newUserArray[index];
        newUserArray.splice(index, 1);
        newUserArray.push(user);
    }

    for(let i =0; i<spectatorArray.length; i++){
        newUserArray.push(spectatorArray[i]);
    }

    newUserArray[0].type = TYPE_HOST

    lobby.users = newUserArray;
    console.log("shuffled array: " + newUserArray);
}

const setUpVote = (room, chancellorChoice, io) => {
    // console.log('inside game.setUpVote');
    // console.log(lobbies);
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
    console.log('chancellor ' + lobby.chancellor)

    io.to(room).emit('chancellor chosen', JSON.stringify({president: lobby.president, chancellor: chancellorChoice}));
}

const registerVote = (room, username, vote, io) => {
    console.log('inside game.registerVote');
    console.log(lobbies);
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
    console.log('votes: yes = ' + lobby.voteCountYes + ', no = ' + lobby.voteCountNo)
    // console.log("vote yes: "+ lobby.voteCountYes);
    // console.log("vote no: "+ lobby.voteCountNo);
    
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
                setTimeout(() => {
                    endGame(room, FASCIST, io);
                    return;
                }, 4000);
            } else {
                lobby.previousPresident = lobby.president;
                lobby.previousChancellor = lobby.chancellor;
                getUserFromUsername(room, lobby.president).status = STATUS_PRESDEC;
                setTimeout(function() {
                    io.to(room).emit('election passes', JSON.stringify({presidentUsername: lobby.president, chancellorUsername: lobby.chancellor}));
                    drawThreeCards(room);
                    io.to(getUserFromUsername(room, lobby.president).id).emit('get three cards', JSON.stringify({cards: lobby.policyCards}));
                }, 4000)
            }
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
    // console.log(lobby.users);
}

const chancellorVeto = (room, decision, io) => {
    console.log('inside game.chancellorVeto');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    io.to(room).emit('chancellor veto decide',
        JSON.stringify({choice: decision, chancellor: lobby.chancellor, president: lobby.president}));
    setTimeout(() => {
        if(decision) {
            // if chancellor wants to veto
            io.to(room).emit('president loading', JSON.stringify({president: lobby.president}));
            io.to(getUserFromUsername(room, lobby.president).id).emit('president veto choice');
        } else {
            placeCard(room, lobby.policyCards[0], io);
        }
    }, 4000);

}

const presidentVeto = (room, decision, io) => {
    console.log('inside game.presidentVeto');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
    io.to(room).emit('president veto decide', JSON.stringify({choice: decision, president: lobby.president}))
    setTimeout(() => {
        if(decision){
            // if president wants to veto
            nextPresidentVeto(room, io);
        } else {
            placeCard(room, lobby.policyCards[0], io);
        }
    }, 4000);
}

const drawThreeCards = (room) => {
    console.log('inside game.drawThreeCards');
    console.log(lobbies);
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
    console.log('inside game.presidentDiscard');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    lobby.policyCards.splice(index, 1);
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    getUserFromUsername(room, lobby.chancellor).status = STATUS_CHANCDEC;
    io.to(room).emit('president discard', JSON.stringify({president: lobby.president, chancellor: lobby.chancellor}));
    io.to(getUserFromUsername(room, lobby.chancellor).id).emit('chancellor get two cards', JSON.stringify({policyCards: lobby.policyCards}));
}

const chancellorChoose = (room, index /*either 0 or 1 */, io) => {
    console.log('inside game.chancellorChoose');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    if(!lobby.veto){
        placeCard(room, lobby.policyCards[index], io);
    } else {
        // console.log("making president veto");
        getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
        getUserFromUsername(room, lobby.president).status = STATUS_PRESVETOCHOICE;
        lobby.policyCards = [lobby.policyCards[index]];
        io.to(getUserFromUsername(room, lobby.chancellor).id).emit('chancellor veto choice');
    }
}

const placeCard = (room, type, io) => {
    console.log('inside game.placeCard');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    if (type == LIBERAL){
        lobby.liberalCards++;
        setTimeout(function() {
            nextPresident(room, true, io);
        }, 3000)
        io.to(room).emit('place card', JSON.stringify({type: type, liberalsPlacedIncludingThisCard: lobby.liberalCards, fascistsPlacedIncludingThisCard: lobby.fascistCards}));
    } else {
        
        lobby.fascistCards++;
        io.to(room).emit('place card', JSON.stringify({type: type, liberalsPlacedIncludingThisCard: lobby.liberalCards, fascistsPlacedIncludingThisCard: lobby.fascistCards}));
        if (lobby.fascistCards == 6) {
            setTimeout(() => {
                endGame(room, FASCIST, io);
            }, 3000);
            return
        }
        try {
            getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
            if(lobby.failedElectionTracker !== 3 ){
                setTimeout(() => {
                    getUserFromUsername(room, lobby.president).status = presidentAction(room, io);
                }, 3000);
            }
        } catch (error) {
            console.log('Error print inside try-catch of game.placeCard:');
            console.log(error)
        }

    }
    if(lobby.fascistCards === 5){
        lobby.veto = true;
    }
    if (lobby.fascistCards == 6) {
        setTimeout(() => {
            endGame(room, FASCIST, io);
        }, 3000);
    } else if (lobby.liberalCards == 5) {
        setTimeout(() => {
            endGame(room, LIBERAL, io);
        }, 3000);
    }
    console.log("lobby.fascistCards = " + lobby.fascistCards);
    console.log("lobby.liberalCards = "+lobby.liberalCards);
}

const presidentAction = (room, io) => {
    console.log('inside game.presidentAction')
    console.log(lobbies);
    const lobby = lobbies.get(room);
    let numPlayers = 0;
    lobby.users.forEach((person) => {
        if (person.type != TYPE_SPECTATOR && person.type != TYPE_DEAD_LIB && person.type != TYPE_DEAD_FAS) {
            numPlayers += 1;
        }
    });
    console.log("president action: "+lobby.presidentActionList[lobby.fascistCards-1])
    if (lobby.presidentActionList[lobby.fascistCards-1] ===STATUS_PRESACT1) {
        io.to(room).emit('president loading', JSON.stringify({president: lobby.president}));
        io.to(getUserFromUsername(room, lobby.president).id).emit('president action 1', JSON.stringify({president: lobby.president}));
        return STATUS_PRESACT1;
    } else if (lobby.presidentActionList[lobby.fascistCards-1] ===STATUS_PRESACT2) {
        io.to(room).emit('president loading', JSON.stringify({president: lobby.president}));
        io.to(getUserFromUsername(room, lobby.president).id).emit('president action 2', JSON.stringify({president: lobby.president}));
        return STATUS_PRESACT2;
    } else if (lobby.presidentActionList[lobby.fascistCards-1] ===STATUS_PRESACT3) {
        io.to(room).emit('president loading', JSON.stringify({president: lobby.president}));
        io.to(getUserFromUsername(room, lobby.president).id).emit('president action 3', JSON.stringify({president: lobby.president}));
        return STATUS_PRESACT3;
    } else if (lobby.presidentActionList[lobby.fascistCards-1] ===STATUS_PRESACT4) {
        io.to(room).emit('president loading', JSON.stringify({president: lobby.president}));
        io.to(getUserFromUsername(room, lobby.president).id).emit('president action 4', JSON.stringify({president: lobby.president}));
        return STATUS_PRESACT4;
    } else {
        setTimeout(function() {
            nextPresident(room, true, io);
            }, 3000)
        return STATUS_NONE;
    }
}

const handlePresAction1 = (room, username, io) => {
    console.log('inside game.handlePresAction1');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    lobby.investigations.push([lobby.president, username]);
    io.to(room).emit('investigation results', JSON.stringify({president: lobby.president, investigated: username,
        type: !(getUserFromUsername(room, username).type === TYPE_FASCIST || getUserFromUsername(room, username).type === TYPE_HITLER)}));
    
    setTimeout(() => {
        nextPresident(room, true, io);
    }, 4000);
}

const handlePresAction2 = (room, specialPres, io) => {
    console.log('inside game.handlePresAction2');
    console.log(lobbies);
    // console.log("special election to " + specialPres);
    const lobby = lobbies.get(room);
    let index = 0;
    for( index = 0; index<lobby.users.length && !(lobby.users[index].username === specialPres); index++){}
    // console.log("special election index "+index);
    lobby.nextPres.unshift(lobby.users[index].username);
    io.to(room).emit('special election', JSON.stringify({specialPresident: lobby.nextPres[0]}));
    nextPresident(room, true, io);
}

const handlePresAction3 = (room, io) => {
    console.log('inside game.handlePresAction3');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    drawThreeCards(room);
    const cards = lobby.policyCards;
    lobby.deck.unshift(cards[0]);
    lobby.deck.unshift(cards[1]);
    lobby.deck.unshift(cards[2]);
    io.to(getUserFromUsername(room, lobby.president).id).emit('next three cards', JSON.stringify({cards}));
    setTimeout(() => {
        nextPresident(room, true, io)
    }, 5000);
}

const handlePresAction4 = (room, killUser, io) => {
    console.log('inside game.handlePresAction4');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    let index = 0;
    for( index = 0; index<lobby.users.length && !(lobby.users[index].username === killUser); index++){}
    if (lobby.users[index].type === TYPE_HITLER) {
        io.to(room).emit('user killed', JSON.stringify({killedUser: killUser}));
        setTimeout(() => {
            endGame(room, LIBERAL, io);
            return;
        }, 1000);
    } else {
        if (lobby.users[index].type === TYPE_LIBERAL) { lobby.users[index].type = TYPE_DEAD_LIB; }
        else { lobby.users[index].type = TYPE_DEAD_FAS; }

        io.to(room).emit('user killed', JSON.stringify({killedUser: killUser}));

        setTimeout(() => {
            nextPresident(room, true, io);
        }, 1000);
    }
}

const nextPresident = (room, electionPassed, io) => {
    console.log('inside game.nextPresident');
    const lobby = lobbies.get(room);
    // console.log(lobby.nextPres);
    if(electionPassed){
        lobby.previousPresident = lobby.president;
        lobby.previousChancellor = lobby.chancellor;
        if(lobby.failedElectionTracker !== 0){
            io.to(room).emit('failed election tracker', JSON.stringify({start: lobby.failedElectionTracker, end: 0}))
        }
        lobby.failedElectionTracker = 0;
    } else {
        incrementFailedElectionTracker(room, io);
    }
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    if(lobby.chancellor !== null){
        getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
    }
    
    lobby.president = lobby.nextPres[0];
    lobby.chancellor = null;
    console.log('lobby.nextPres: ' + lobby.nextPres);
    // console.log(lobby.nextPres);

    if (lobby.nextPres.length === 1) {
        let index = getIndexFromUsername(room, lobby.nextPres[0]) % lobby.users.length;
        while(lobby.users[index].type === TYPE_DEAD_LIB || lobby.users[index].type === TYPE_DEAD_FAS || lobby.users[index].type === TYPE_SPECTATOR){
            index = (index+1) % lobby.users.length;
        }
        lobby.president = lobby.users[index].username;
        console.log('lobby.president: ' + lobby.president);
        // console.log(lobby.president);
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
        if(lobby.users[i].type !== TYPE_DEAD && lobby.users[i].type !== TYPE_DEAD_FAS && lobby.users[i].type !== TYPE_DEAD_LIB && lobby.users[i].type !== TYPE_SPECTATOR){
            // if user is playing the game
            if(lobby.users[i].username !== lobby.president && lobby.users[i].username !== lobby.previousChancellor){
                // if user is not the president and not the previous chancellor
                if(alive <= 5 || (alive > 5 && lobby.users[i].username !== lobby.previousPresident)){
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

const nextPresidentVeto = (room, io) => {
    console.log('inside game.nextPresidentVeto');
    console.log(lobbies);
    const lobby = lobbies.get(room);
    // console.log(lobby.nextPres);
    lobby.previousPresident = lobby.president;
    lobby.previousChancellor = lobby.chancellor;
    incrementFailedElectionTracker(room, io);
    getUserFromUsername(room, lobby.president).status = STATUS_NONE;
    if(lobby.chancellor !== null){
        getUserFromUsername(room, lobby.chancellor).status = STATUS_NONE;
    }
    
    lobby.president = lobby.nextPres[0];
    lobby.chancellor = null;
    console.log('lobby.nextPres: ' + lobby.nextPres);
    // console.log(lobby.nextPres);

    if (lobby.nextPres.length === 1) {
        let index = getIndexFromUsername(room, lobby.nextPres[0]) % lobby.users.length;
        while(lobby.users[index].type === TYPE_DEAD_LIB || lobby.users[index].type === TYPE_DEAD_FAS || lobby.users[index].type === TYPE_SPECTATOR){
            index = (index+1) % lobby.users.length;
        }
        lobby.president = lobby.users[index].username;
        console.log('lobby.president: ' + lobby.president);
        // console.log(lobby.president);
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
        if(lobby.users[i].type !== TYPE_DEAD && lobby.users[i].type !== TYPE_DEAD_FAS && lobby.users[i].type !== TYPE_DEAD_LIB && lobby.users[i].type !== TYPE_SPECTATOR){
            // if user is playing the game
            if(lobby.users[i].username !== lobby.president && lobby.users[i].username !== lobby.previousChancellor){
                // if user is not the president and not the previous chancellor
                if(alive <= 5 || (alive > 5 && lobby.users[i].username !== lobby.previousPresident)){
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


const endGame = (room, winningTeam, io) => {
    console.log('inside game.endGame');
    const lobby = lobbies.get(room);
    lobby.postGameData = [winningTeam, lobby.users[0].username];
    lobby.gameState = GAMESTATE_FINISHED;

    lobby.users.forEach((person) => {
        if (person.type === TYPE_DEAD_LIB) { person.type = TYPE_LIBERAL}
        else if (person.type === TYPE_DEAD_FAS) { person.type = TYPE_FASCIST }
    });

    let users = [];
    lobby.users.forEach((person) => {
        if (person.type === TYPE_LIBERAL || person.type === TYPE_FASCIST || person.type === TYPE_HITLER) {users.push(person)}
    });
    io.to(room).emit('end game', JSON.stringify({winningTeam, users}))
}

const randomAssign = (room, numOfFascists /*not including hilter*/) => {
    console.log('inside game.randomAssign');
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
    console.log('inside game.randomShuffle');
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
    console.log('inside game.generateMaskedLobby');
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
        investigations: lobby.investigations,
        failedElectionTracker: lobby.failedElectionTracker,
        presidentActionList: lobby.presidentActionList
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

const incrementFailedElectionTracker = (room, io) => {
    console.log('inside game.incrementFailedElectionTracker');
    const lobby = lobbies.get(room);
    lobby.failedElectionTracker++
    if(lobby.failedElectionTracker==3){
        // if we do place a policy card

        placeCard(room, lobby.policyCards[0], io);
        lobby.failedElectionTracker = 0;
        lobby.policyCards.splice(0, 1);
        
        if(lobby.deck.length === 0){
                lobby.deck = [];
                for(let i=0; i<6-lobby.liberalCards; i++){
                    lobby.deck.push(true);
                }
                
                for(let i=0; i<11-lobby.fascistCards; i++){
                    lobby.deck.push(false);
                }        
                if(lobby.policyCards[0] === true){
                    lobby.deck.splice(0, 1);
                } else {
                    lobby.deck.splice(lobby.deck.length-1, 1);
                }
                if(lobby.policyCards[1] === true){
                    lobby.deck.splice(0, 1);
                } else {
                    lobby.deck.splice(lobby.deck.length-1, 1);
                }
                if(lobby.policyCards[2] === true){
                    lobby.deck.splice(0, 1);
                } else {
                    lobby.deck.splice(lobby.deck.length-1, 1);
                }

                lobby.deck = randomShuffle(lobby.deck);
        }
        lobby.policyCards.push(lobby.deck[0]);
        lobby.deck.splice(0, 1);
        lobby.previousPresident = null;
        lobby.previousChancellor= null;

        io.to(room).emit('failed election tracker', JSON.stringify({start: 2, end: 3}));
        setTimeout(() => {
            io.to(room).emit('failed election tracker', JSON.stringify({start: 3, end: 0}));
        }, 1501); //might not need the extra ms
    } else {
        // if we don't place a policy card
        console.log('start '+(lobby.failedElectionTracker-1))
        console.log('end '+lobby.failedElectionTracker)
        io.to(room).emit('failed election tracker', JSON.stringify({start: lobby.failedElectionTracker-1, end: lobby.failedElectionTracker}));
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