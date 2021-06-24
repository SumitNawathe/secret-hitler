const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $participantList = document.querySelector('#participant-list');
const participantTemplate = document.querySelector('#participant-template').innerHTML;
const $lobbyActions = document.querySelector('#actions');
const actionButtonTemplate = document.querySelector('#action-button-template').innerHTML;
const imageSelectTemplate = document.querySelector('#image-overlay').innerHTML;
const slideCardTemplate = document.querySelector('#slidecard-template').innerHTML;
const slideCardWithBackTemplate = document.querySelector('#slidecardwithback-template').innerHTML

const TYPE_SPECTATOR = -1;
const TYPE_HOST = 0;
const TYPE_PLAYER = 1;
const TYPE_LIBERAL = 2;
const TYPE_FASCIST = 3;
const TYPE_HITLER = 4;
const TYPE_DEAD = 5;
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
const FASCIST = false;
const LIBERAL = true;
let slideup = false, startslide = true;
let gameStartReveal = true;

const STATUS_PRESVETOCHOICE = 9;
const STATUS_CHANCVETOCHOICE = 10;

//create lobby page heading
const $heading = document.querySelector('#heading');
const headingTemplate = document.querySelector('#heading-template').innerHTML;
const headingHtml = Mustache.render(headingTemplate, {
    room: room
});


const usernames = []
const participants = []
const slidecards = []
const overlays = []

$heading.insertAdjacentHTML('beforeend', headingHtml);

socket.on('joinLobbyData', (playerJoiningString) => {
    const joinLobbyData = JSON.parse(playerJoiningString);
    const joinUsername = joinLobbyData.player;
    const html = Mustache.render(participantTemplate, {
        participant_id: "participant"+joinUsername,
        username: joinUsername,
        username_img: joinUsername+"_img",
        type: 'Player',
        status: '',
        slidecard_id: "slidecard"+joinUsername,
        image_select_id: "image-select-"+joinUsername,
        voteback_id: joinUsername,
        party_id: joinUsername
    });
    $participantList.insertAdjacentHTML('beforeend', html);
});

socket.on('updateLobbyData', (lobbyDataUpdateString) => {
    console.log('updateLobbyData')
    const lobbyDataUpdate = JSON.parse(lobbyDataUpdateString);
    const updateUsername = lobbyDataUpdate.username;
    const newState = lobbyDataUpdate.state;
    if (updateUsername === username) {
        if (newState === TYPE_HOST) {
            oldButton = $lobbyActions.querySelector('button');
            newButton = oldButton.cloneNode(true);
            newButton.innerHTML = 'Start Game'
            newButton.addEventListener('click', () => {
                // console.log('should change to spectate');
                console.log('Start Game')
                socket.emit('startGame', { username, room, newType: TYPE_SPECTATOR }, (error) => { if (error) { console.log('error'); } })
            });
            oldButton.parentNode.replaceChild(newButton, oldButton);
        } else if (newState === TYPE_PLAYER) {
            oldButton = $lobbyActions.querySelector('button');
            newButton = oldButton.cloneNode(true);
            newButton.innerHTML = 'Spectate'
            newButton.addEventListener('click', () => {
                // console.log('should change to spectate');
                console.log('change to spectator')
                socket.emit('changeLobbyInfo', { username, room, newType: TYPE_SPECTATOR }, (error) => { if (error) { console.log('error'); } })
            });
            oldButton.parentNode.replaceChild(newButton, oldButton);
        } else if (newState === TYPE_SPECTATOR) { //playerType === TYPE_SPECTATOR
            oldButton = $lobbyActions.querySelector('button');
            newButton = oldButton.cloneNode(true);
            newButton.innerHTML = 'Play Game'
            newButton.addEventListener('click', () => {
                // console.log('should change to spectate');
                console.log('change to player')
                socket.emit('changeLobbyInfo', { username, room, newType: TYPE_PLAYER }, (error) => { if (error) { console.log('error'); } })
            });
            oldButton.parentNode.replaceChild(newButton, oldButton);
        }
    }
    if (newState === TYPE_HOST)
    document.querySelector('#'+updateUsername+'_img').src = "img/default cardback.png"
    else if (newState === TYPE_PLAYER)
        document.querySelector('#'+updateUsername+'_img').src = "img/default cardback.png"
    else if (newState === TYPE_SPECTATOR) {
        $participantList.querySelector('#participant'+updateUsername).classList.add("spectator")
        document.querySelector('#'+updateUsername+'_img').src = "img/test carback.png"
    }
    //do stuff
});

socket.on('removeLobbyData', (playerRemovedString) => {
    const playerRemovedData = JSON.parse(playerRemovedString);
    const deleteUsername = playerRemovedData.person;
    $participantList.querySelector('#participant'+deleteUsername).remove()
});
socket.on('startGameData', (startGameDataString) => {
    var audio = new Audio('audio/CardPlacingSound.mp3');
    //audio.play();
    console.log('start game')
    const startGameData = JSON.parse(startGameDataString)
    const type = startGameData.type;
    try {
        for (let i=0; i<$participantList.children.length; i++) {
            $participantList.querySelector('.spectator').remove()
        }
    } catch (error) {}
    const list = $participantList.children
    for (let i=0; i<list.length; i++) {
        usernames.push(getUsername(i))
        participants.push($participantList.querySelector('#participant'+getUsername(i)))
        slidecards.push($participantList.querySelector('#slidecard'+getUsername(i)))
        overlays.push($participantList.querySelector('#image-select-'+getUsername(i)))
    }
    if (type === TYPE_LIBERAL) {
        console.log('liberal')
        $participantList.querySelector('#participant'+username).children[0].classList.add("Liberal")
        slideCardOneWithBack("party cardback.png", "liberal cardback.png", username)
        $participantList.querySelector('#slidecard'+username).querySelector('.flip-card').classList.add("rotateandslideupanddown")
        $participantList.querySelector('#slidecard'+username).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
        // slidecard(slideCardTemplate, "voteback", "voting cardback.png")
        // const $voteback = document.querySelector('#voteback'+username)
        // $voteback.classList.add("slideupanddown")
    } else if (type === TYPE_FASCIST) {
        // slidecard(slideCardTemplate, "voteback", "voting cardback.png")
        const fascists = startGameData.fascists
        for (let i=0; i<fascists.length; i++) {
            let username=fascists[i]
            $participantList.querySelector('#participant'+username).children[0].classList.add("Fascist")
            slideCardOneWithBack("party cardback.png", "fascist cardback.png", username)
            $participantList.querySelector('#slidecard'+username).querySelector('.flip-card').classList.add("rotateandslideupanddown")
            $participantList.querySelector('#slidecard'+username).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
            // const $voteback = document.querySelector('#voteback'+username)
            // $voteback.classList.add("slideupanddown")
        }
        const hitler = startGameData.hitler
        $participantList.querySelector('#participant'+hitler).children[0].classList.add("Hitler")
        slideCardOneWithBack("party cardback.png", "hitler cardback.png", hitler)
        $participantList.querySelector('#slidecard'+hitler).querySelector('.flip-card').classList.add("rotateandslideupanddown")
        $participantList.querySelector('#slidecard'+hitler).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
        // const $voteback = document.querySelector('#voteback'+hitler)
        // $voteback.classList.add("slideupanddown")
    } else if (type === TYPE_HITLER) {
        $participantList.querySelector('#participant'+username).children[0].classList.add("Hitler")
        slideCardOneWithBack("party cardback.png", "hitler cardback.png", username)
        // slidecard(slideCardTemplate, "voteback", "voting cardback.png")
        $participantList.querySelector('#slidecard'+username).querySelector('.flip-card').classList.add("rotateandslideupanddown")
        $participantList.querySelector('#slidecard'+username).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")

        // const $voteback = document.querySelector('#voteback'+username)
        // $voteback.classList.add("slideupanddown")
        //TODO: depending on player number see others
    } else if (type === TYPE_SPECTATOR) {
        const fascists = startGameData.fascists
        for (let username of fascists) {
            $participantList.querySelector('#participant'+username).children[0].classList.add("Fascist")
            slideCardOneWithBack("party cardback.png", "fascist cardback.png", username)
            $participantList.querySelector('#slidecard'+username).querySelector('.flip-card').classList.add("rotateandslideupanddown")
            $participantList.querySelector('#slidecard'+username).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
            // const $voteback = document.querySelector('#voteback'+username)
            // $voteback.classList.add("slideupanddown")
        }
        const hitler = startGameData.hitler
        $participantList.querySelector('#participant'+hitler).children[0].classList.add("Hitler")
        slideCardOneWithBack("party cardback.png", "hitler cardback.png", hitler)
        $participantList.querySelector('#slidecard'+hitler).querySelector('.flip-card').classList.add("rotateandslideupanddown")
        $participantList.querySelector('#slidecard'+hitler).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
        // const $voteback = document.querySelector('#voteback'+hitler)
        // $voteback.classList.add("slideupanddown")
        for (let i=0; i<$participantList.children.length; i++) {
            let participantuser = $participantList.children[i]
            console.log('children '+participantuser.children[0].classList)
            if (!participantuser.children[0].classList.contains("Fascist") && !participantuser.children[0].classList.contains("Hitler")) {
                participantuser.children[0].classList.add("Liberal")
                let username = participantuser.id.substring(11)
                console.log('first '+participantuser.id)
                console.log('username '+username)
                slideCardOneWithBack("party cardback.png", "liberal cardback.png", username)
                $participantList.querySelector('#slidecard'+username).querySelector('.flip-card').classList.add("rotateandslideupanddown")
                $participantList.querySelector('#slidecard'+username).querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")        
                // slidecard(slideCardTemplate, "voteback", "voting cardback.png")
                // const $voteback = document.querySelector('#voteback'+username)
                // $voteback.classList.add("slideupanddown")
            }
        }
    }
})

socket.on('new president', (newPresidentString) => {
    console.log('new president')
    const newPresidentData = JSON.parse(newPresidentString)
    const newPres = newPresidentData.newPres
    const oldChanc = newPresidentData.oldChanc
    const oldPres = newPresidentData.oldPres
    clearOverlay()
    clearSlide()
    let html = Mustache.render(imageSelectTemplate, {src: "president_label.png"});
    let $imageSelectOverlay = document.querySelector('#image-select-'+newPres);
    $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
    if (oldPres) {
        $imageSelectOverlay = document.querySelector('#image-select-'+oldPres);
        $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
        $imageSelectOverlay.children[0].classList.add("previous")
    }
    if (oldChanc) {
        html = Mustache.render(imageSelectTemplate, {src: "chancellor_label.png"});
        $imageSelectOverlay = document.querySelector('#image-select-'+oldChanc);
        $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
        $imageSelectOverlay.children[0].classList.add("previous")
    }
    let presParticipant = $participantList.querySelector("#participant"+newPres)
    console.log(presParticipant)
    presParticipant.querySelector(".loader").classList.add("active")

    if (newPres === username) {
        //TODO: eligibility from back end
        //currently just having the second person as the eligible one
        let eligible = [false, true]
        playerSelect(eligible, 'chooseChancellor')
    }
})

socket.on('chancellor chosen', (chancellorChosenString) => {
    clearOverlay()
    clearSlide()
    const chancellorChosenData = JSON.parse(chancellorChosenString)
    const president = chancellorChosenData.president
    const chancellor = chancellorChosenData.chancellor
    let html = Mustache.render(imageSelectTemplate, {src: "chancellor_label.png"});
    let $imageSelectOverlay = document.querySelector('#image-select-'+chancellor);
    $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
    $imageSelectOverlay.children[0].classList.add("blink")

    let presParticipant = $participantList.querySelector("#participant"+president)
    presParticipant.querySelector(".loader").classList.remove("active")
    
    //TODO: make loaders in sync
    slideUpVote()
})

const slideUpVote = () => {
    const list = $participantList.children
    for (let i=0; i<slidecards.length; i++) {
        slideCardOneWithBack("voting cardback.png", "yes cardback.png", usernames[i])
        slidecards[i].children[0].classList.add("slideup")
        slidecards[i].children[0].children[0].classList.add("slideup")

        participants[i].querySelector(".loader").classList.add("active")
    }
}

const getUsername = (i) => {
    return $participantList.children[i].id.substring(11)
}

const clearOverlay = () => {
    const list = $participantList.children
    for (let i=0; i<list.length; i++) {
        let username = getUsername(i)
        participantuser = list[i]
        let $imageSelectOverlay = participantuser.querySelector('#image-select-'+username)
        $imageSelectOverlay.innerHTML = ''
    }
}

const clearSlide = () => {
    const list = $participantList.children
    for (let i=0; i<list.length; i++) {
        participantuser=list[i]
        let username = participantuser.id.substring(11)
        let $slidecard = participantuser.querySelector('#slidecard'+username)
        $slidecard.innerHTML = ''
    }
}

const playerSelect = (eligible, eventType) => {
    let html=null; newButton=null;
    for (let i = 0; i < eligible.length; i++) {
        // console.log('player select image: ' + lobbyData.users[i].username);
        if (eligible[i]) {
            let username = getUsername(i)
            let $imageSelectOverlay = document.querySelector('#image-select-'+username);
            html = Mustache.render(imageSelectTemplate, { src: "blank.png"}, (error) => { if (error) { console.log('error'); } })
            $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
            newButton = $imageSelectOverlay.children[0]
            newButton.classList.add("glowing")
            // console.log('adding event listener');
            newButton.addEventListener('click', () => {
                // console.log('chosen');
                socket.emit(eventType, { room, choice: username }, (error) => { if (error) { console.log('error'); } })
            });
        }
    }
}







socket.on('policyPeek', (cardDataString) => {
    console.log('recieved policyPeek');
    console.log(cardDataString);
    cards = JSON.parse(cardDataString);
    console.log(cards);

    //remove buttons
    let currentButton = $lobbyActions.querySelector('button');
    while(currentButton) {
        currentButton.remove();
        currentButton = $lobbyActions.querySelector('button');
    }

    for (let i = 0; i < 3; i++) {
        let html = Mustache.render(actionButtonTemplate, { text: cards[i] ? 'Liberal' : 'Fascist', id:"card"+i });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
    }
});

socket.on('lobbyData', (lobbyDataString) => {
    // console.log('lobbyDataString:');
    // console.log(lobbyDataString);
    lobbyData = JSON.parse(lobbyDataString);

    //remove all current lobbyData
    // console.log('deleting lobbyData');
    participant = $participantList.querySelector('.participant');
    while(participant) {
        participant.remove();
        participant = $participantList.querySelector('.participant');
    }

    //creating new lobbydata
    // console.log('rendering new data');
    // console.log(lobbyData.users);
    lobbyData.users.forEach((person) => {
        // console.log(person);
        let typeString = '';
        if (person.type === TYPE_HOST) { typeString = 'Host' }
        else if (person.type === TYPE_PLAYER) { typeString = 'Player' }
        else if (person.type === TYPE_SPECTATOR) { typeString = 'Spectator' }
        else if (person.type === TYPE_LIBERAL) { typeString = 'Liberal' }
        else if (person.type === TYPE_FASCIST) { typeString = 'Fascist' }
        else if (person.type === TYPE_HITLER) { typeString = 'Hitler' }
        else { typeString = '' }

        let statusString = '';
        if (person.status === STATUS_VOTING) { statusString = 'voting...' }
        else if (person.status === STATUS_PRESCHOOSE) { statusString = 'President choosing Chancellor...' }
        else if (person.status === STATUS_PRESDEC) { statusString = 'President deciding...' }
        else if (person.status === STATUS_CHANCDEC) { statusString = 'Chancellor deciding...' }
        else if (person.status === STATUS_PRESACT1 || person.status === STATUS_PRESACT2 
            || person.status === STATUS_PRESACT3 || person.status === STATUS_PRESACT4) { statusString = 'President taking action...' }
        else { statusString = '' }

        const html = Mustache.render(participantTemplate, {
            participant_id: "participant"+person.username,
            username: person.username,
            username_img: person.username+"_img",
            type: typeString,
            status: statusString,
            slidecard_id: "slidecard"+person.username,
            image_select_id: "image-select-"+person.username,
            voteback_id: person.username,
            party_id: person.username
        });
        $participantList.insertAdjacentHTML('beforeend', html);
    });

    //if in lobby state, remove and replace buttons
    let currentButton = $lobbyActions.querySelector('button');
    while(currentButton) {
        currentButton.remove();
        currentButton = $lobbyActions.querySelector('button');
    }

    if (lobbyData.gameState === GAMESTATE_LOBBY) {
        let type = -1;
        lobbyData.users.every((person) => {
            if (person.username === username) {
                type = person.type;
                console.log('TYPE: ' + person.type);
                console.log('STATUS: ' + person.status);
                return false;
            }
            return true;
        });
        createLobbyButtons(type);
    } else if (lobbyData.gameState === GAMESTATE_FINISHED) {
        let type = null;
        lobbyData.users.every((person) => {
            if (person.username === username) {
                type = person.type;
                return false;
            }
            return true;
        });
        let winLossHtml = null;
        if (lobbyData.postGameData[0] === LIBERAL && type === TYPE_LIBERAL
                || lobbyData.postGameData[0] === FASCIST && (type === TYPE_FASCIST || type === TYPE_HITLER)) {
            winLossHtml = Mustache.render(actionButtonTemplate, { text: 'You Won!', id: 'won' });
        } else if (type !== TYPE_SPECTATOR) {
            winLossHtml = Mustache.render(actionButtonTemplate, { text: 'You Lost!', id: 'loss' });
        }
        $lobbyActions.insertAdjacentHTML('beforeend', winLossHtml);

        if (lobbyData.postGameData[1] === username) {
            const remakeLobbyHtml = Mustache.render(actionButtonTemplate, { text: 'Remake Lobby', id: 'remake' });
            $lobbyActions.insertAdjacentHTML('beforeend', remakeLobbyHtml);
            $lobbyActions.querySelector('#remake').addEventListener('click', () => {
                console.log('request remake lobby');
                socket.emit('remakeLobby', { room }, (error) => { if (error) { console.log('error'); } });
            });
        }
    } else if (lobbyData.gameState === GAMESTATE_ONGOING) {
        let myType = 0, myStatus = 0;
        lobbyData.users.every((person) => {
            if (person.username === username) {
                // console.log('presChoice user in browser');
                // console.log(person);
                myType = person.type;
                myStatus = person.status;
                return false;
            }
            return true;
        });

        // console.log('MY STATUS: ' + myStatus);
        // console.log('MY TYPE:' + myType);

        if (gameStartReveal) {
            gameStartReveal = false;
        }

        let otherUsersVoting = false;
        lobbyData.users.forEach((user) => (otherUsersVoting = otherUsersVoting || user.status === STATUS_VOTING));
        if (slideup && myStatus !== STATUS_VOTING && !otherUsersVoting) {
            // slidecard(slideCardTemplate, "voteback", "voting cardback.png")
            voteanim("slidedown");
        }
        if (myStatus === STATUS_VOTING || otherUsersVoting) {
            // slidecard(slideCardTemplate, "voteback", "voting cardback.png")
            console.log('slide'+document.querySelector('#voteback'+lobbyData.users[0].username).classList.contains('slideup'));
            if (!slideup) {
                // console.log('cha cha real smooth')
                voteanim("slideup")
            } else {
                voteanim("slidup")
            }
            const yesHtml = Mustache.render(actionButtonTemplate, { text: 'Yes', id:'yes' });
            const noHtml = Mustache.render(actionButtonTemplate, { text: 'No', id:'no' });
            $lobbyActions.insertAdjacentHTML('beforeend', yesHtml);
            $lobbyActions.insertAdjacentHTML('beforeend', noHtml);
            $lobbyActions.querySelector('#yes').addEventListener('click', () => {
                // console.log('voting yes');
                socket.emit('voting', { room, username, choice: true }, (error) => { if (error) { console.log('error'); } })
            });
            $lobbyActions.querySelector('#no').addEventListener('click', () => {
                // console.log('voing no');
                socket.emit('voting', { room, username, choice: false }, (error) => { if (error) { console.log('error'); } })
            });
        } else if (myStatus === STATUS_PRESCHOOSE) {
            let numPlayers = 0;
            lobbyData.users.forEach((person) => {
                if (person.type !== TYPE_SPECTATOR && person.type !== TYPE_DEAD) { numPlayers += 1; }
            });
            eligible = [];
            for (let i = 0; i < lobbyData.users.length; i++) {
                //if (lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD) { eligible.push(false); }
                //else
                if ((numPlayers > 5 && lobbyData.users[i].username === lobbyData.previousPresident) || lobbyData.users[i].username === lobbyData.previousChancellor || lobbyData.users[i].username === username 
                    || lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD) { eligible.push(false); }
                else { eligible.push(true); }
            }
            // console.log("president choosing");
            // console.log(lobbyData.users);
            // console.log(eligible);
            createPlayerSelect(lobbyData, eligible, 'chooseChancellor');
        } else if (myStatus === STATUS_PRESDEC) {
            for (let i = 0; i < lobbyData.policyCards.length; i++) {
                let html = null, newButton = null;
                if (lobbyData.policyCards[i] === LIBERAL) {
                    html = Mustache.render(actionButtonTemplate, { text: 'Liberal', id:"choice"+i });
                } else { //lobbyData.policyCards[i] === FASCIST
                    html = Mustache.render(actionButtonTemplate, { text: 'Fascist', id:"choice"+i });
                }
                $lobbyActions.insertAdjacentHTML('beforeend', html);
                newButton = $lobbyActions.querySelector('#choice'+i);
                // console.log('Chose ' + i);
                newButton.addEventListener('click', () => {
                    // console.log('Chose ' + i);
                    socket.emit('presDecision', { room: room, index: i}, (error) => { if (error) { console.log('error') } });
                });
            }
        } else if (myStatus === STATUS_CHANCDEC) { //basically the same as STATUS_PRESDEC
            for (let i = 0; i < lobbyData.policyCards.length; i++) {
                let html = null, newButton = null;
                if (lobbyData.policyCards[i] === LIBERAL) {
                    html = Mustache.render(actionButtonTemplate, { text: 'Liberal', id:"choice"+i });
                } else { //lobbyData.policyCards[i] === FASCIST
                    html = Mustache.render(actionButtonTemplate, { text: 'Fascist', id:"choice"+i });
                }
                $lobbyActions.insertAdjacentHTML('beforeend', html);
                newButton = $lobbyActions.querySelector('#choice'+i);
                // console.log('Chose ' + i);
                newButton.addEventListener('click', () => {
                    // console.log('Chose ' + i);
                    socket.emit('chancDecision', { room: room, index: i}, (error) => { if (error) { console.log('error') } });
                });
            }
        } else if (myStatus === STATUS_PRESACT1) { //investigate loyalty
            const eligible = [];
            lobbyData.users.forEach((person) => {
                if (person.username === username) {
                    eligible.push(false);
                } else {
                    eligible.push(true);
                }
            });
            createPlayerSelect(lobbyData, eligible, 'presAction1');
        } else if (myStatus === STATUS_PRESACT2){
            const eligible = [];
            for(let i=0; i<lobbyData.users.length; i++){
                if(lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD || lobbyData.users[i].username === username || lobbyData.users[i] === lobbyData.chancellor){

                    eligible.push(false);
                } else {
                    eligible.push(true);
                }
            }
            createPlayerSelect(lobbyData, eligible, 'presAction2');
        } else if (myStatus === STATUS_PRESACT3){
            console.log('doing presAct3');
            const html = Mustache.render(actionButtonTemplate, { text: 'View Cards', id:'viewCards' });
            $lobbyActions.insertAdjacentHTML('beforeend', html);
            const newButton = $lobbyActions.querySelector('#viewCards');
            newButton.addEventListener('click', () => {
                console.log('Requesting policy peek');
                socket.emit('presAction3', { room, id: socket.id }, (error) => { if (error) { console.log('error') } });
            });
        } else if (myStatus === STATUS_PRESACT4) {
            const eligible = [];
            for(let i=0; i<lobbyData.users.length; i++){
                if(lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD || lobbyData.users[i].username === username){
                    eligible.push(false);
                } else {
                    eligible.push(true);
                }
            }
            createPlayerSelect(lobbyData, eligible, 'presAction4');
        } else if (myStatus === STATUS_PRESVETOCHOICE){
            // console.log("president veto choice");
            const yesHtml = Mustache.render(actionButtonTemplate, { text: 'Yes', id:'yes' });
            const noHtml = Mustache.render(actionButtonTemplate, { text: 'No', id:'no' });
            $lobbyActions.insertAdjacentHTML('beforeend', yesHtml);
            $lobbyActions.insertAdjacentHTML('beforeend', noHtml);
            $lobbyActions.querySelector('#yes').addEventListener('click', () => {
                // console.log('veto voting yes');
                socket.emit('presVetoVoting', { room, choice: true }, (error) => { if (error) { console.log('error'); } })
            });
            $lobbyActions.querySelector('#no').addEventListener('click', () => {
                // console.log('veto voting no');
                socket.emit('presVetoVoting', { room, choice: false }, (error) => { if (error) { console.log('error'); } })
            });
        }  else if (myStatus === STATUS_CHANCVETOCHOICE){
            const yesHtml = Mustache.render(actionButtonTemplate, { text: 'Yes', id:'yes' });
            const noHtml = Mustache.render(actionButtonTemplate, { text: 'No', id:'no' });
            $lobbyActions.insertAdjacentHTML('beforeend', yesHtml);
            $lobbyActions.insertAdjacentHTML('beforeend', noHtml);
            $lobbyActions.querySelector('#yes').addEventListener('click', () => {
                // console.log('veto voting yes');
                socket.emit('chancellorVetoVoting', { room, choice: true }, (error) => { if (error) { console.log('error'); } })
            });
            $lobbyActions.querySelector('#no').addEventListener('click', () => {
                // console.log('veto voting no');
                socket.emit('chancellorVetoVoting', { room, choice: false }, (error) => { if (error) { console.log('error'); } })
            });
        }
    }
});

const createLobbyButtons = (playerType) => {
    let html = null, newButton = null;
    if (playerType === TYPE_HOST) {
        html = Mustache.render(actionButtonTemplate, { text: 'Start Game', id:"start-game" });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            // console.log('START GAME');
            socket.emit('startGame', { room: room }, (error) => { if (error) { console.log('error') } });
        });
    } else if (playerType === TYPE_PLAYER) {
        html = Mustache.render(actionButtonTemplate, { text: 'Spectate', id:"spectate" });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            // console.log('should change to spectate');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_SPECTATOR }, (error) => { if (error) { console.log('error'); } })
        });
    } else { //playerType === TYPE_SPECTATOR
        html = Mustache.render(actionButtonTemplate, { text: 'Play Game', id:"play-game" });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            // console.log('should change to play');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_PLAYER }, (error) => { if (error) { console.log('error'); } })
        });
    }
}

const createPlayerSelect = (lobbyData, eligible, eventType) => {
    playerImageSelect(lobbyData, eligible, eventType);
    let html = null, newButton = null;
    for (let i = 0; i < lobbyData.users.length; i++) {
        // console.log('player select button: ' + lobbyData.users[i].username);
        if (eligible[i]) {
            html = Mustache.render(actionButtonTemplate, { text: lobbyData.users[i].username, id: lobbyData.users[i].username }, (error) => { if (error) { console.log('error'); } })
            $lobbyActions.insertAdjacentHTML('beforeend', html);
            newButton = $lobbyActions.querySelector("#" + lobbyData.users[i].username);
            // console.log('adding event listener');
            newButton.addEventListener('click', () => {
                // console.log('chosen');
                socket.emit(eventType, { room, choice: lobbyData.users[i].username }, (error) => { if (error) { console.log('error'); } })
            });
        }
    }
}

const playerImageSelect = (lobbyData, eligible, eventType) => {
    let html=null; newButton=null;
    for (let i = 0; i < lobbyData.users.length; i++) {
        // console.log('player select image: ' + lobbyData.users[i].username);
        if (eligible[i]) {
            let $imageSelectOverlay = document.querySelector('#image-select-'+lobbyData.users[i].username);
            html = Mustache.render(imageSelectTemplate, { src: "blank.png"}, (error) => { if (error) { console.log('error'); } })
            $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
            newButton = $imageSelectOverlay.querySelector("#image-overlay-" + lobbyData.users[i].username);
            // console.log('adding event listener');
            newButton.addEventListener('click', () => {
                // console.log('chosen');
                socket.emit(eventType, { room, choice: lobbyData.users[i].username }, (error) => { if (error) { console.log('error'); } })
            });
        }
    }
}

const voteanim = (slide) => {
    console.log('voteanim')
    if (slide === "slideup") {
        console.log('slideup')
        slideup = true
        for (let i = 0; i < lobbyData.users.length; i++) {
            const $voteback = document.querySelector('#voteback'+lobbyData.users[i].username)
            $voteback.classList.add(slide)
        }
    } else if (slide === "slidedown") {
        console.log('slidedown')
        slideup = false
        for (let i = 0; i < lobbyData.users.length; i++) {
            const $voteback = document.querySelector('#voteback'+lobbyData.users[i].username)
            $voteback.classList.add(slide)
        }
    } else if (slide === "slidup") {
        console.log('slidup')
        for (let i = 0; i < lobbyData.users.length; i++) {
            const $voteback = document.querySelector('#voteback'+lobbyData.users[i].username)
            $voteback.classList.add(slide)
        }
    }
}



// const slidecard = (template, id, username, src) => {
//     let $slidecard = document.querySelector('#slidecard'+username)
//     html = Mustache.render(template, {id: id+username, src: src}, (error) => { if (error) { console.log('error'); } })
//         $slidecard.insertAdjacentHTML('beforeend', html);
// }

const slideCardOne = (src, username) => {
    console.log('generating slideCardOne')
    let $slidecard = document.querySelector('#slidecard'+username)
    console.log($slidecard)
    html = Mustache.render(slideCardTemplate, {src: src}, (error) => { if (error) { console.log('error'); } })
        $slidecard.insertAdjacentHTML('beforeend', html);
}

const slideCardOneWithBack = (src1, src2, username) => {
    console.log('generating slideCardOneWithBack with username '+username)
    let $slidecard = document.querySelector('#slidecard'+username)
    console.log($slidecard)
    html = Mustache.render(slideCardWithBackTemplate, {src1: src1, src2: src2}, (error) => { if (error) { console.log('error'); } })
        $slidecard.insertAdjacentHTML('beforeend', html);
}

// const slidecard = (id, src) => {
//     console.log('generating slidecard')
//     for (let i=0; i < lobbyData.users.length; i++) {
//         let username=lobbyData.users[i].username
//         let $slidecard = document.querySelector('#slidecard'+username)
//         console.log($slidecard)
//         html = Mustache.render(slideCardTemplate, {id: id+username, src: src}, (error) => { if (error) { console.log('error'); } })
//             $slidecard.insertAdjacentHTML('beforeend', html);
//     }
// }

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
