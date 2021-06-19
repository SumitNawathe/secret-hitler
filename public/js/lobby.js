
const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $participantList = document.querySelector('#participant-list');
const participantTemplate = document.querySelector('#participant-template').innerHTML;
const $lobbyActions = document.querySelector('#actions');
const actionButtonTemplate = document.querySelector('#action-button-template').innerHTML;
const imageSelectTemplate = document.querySelector('#image-select-template').innerHTML;

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

const STATUS_PRESVETOCHOICE = 9;
const STATUS_CHANCVETOCHOICE = 10;

//create lobby page heading
const $heading = document.querySelector('#heading');
const headingTemplate = document.querySelector('#heading-template').innerHTML;
const headingHtml = Mustache.render(headingTemplate, {
    room: room
});
$heading.insertAdjacentHTML('beforeend', headingHtml);

socket.on('lobbyData', (lobbyDataString) => {
    console.log('lobbyDataString:');
    console.log(lobbyDataString);
    lobbyData = JSON.parse(lobbyDataString);

    //remove all current lobbyData
    console.log('deleting lobbyData');
    participant = $participantList.querySelector('.participant');
    while(participant) {
        participant.remove();
        participant = $participantList.querySelector('.participant');
    }

    //creating new lobbydata
    console.log('rendering new data');
    console.log(lobbyData.users);
    lobbyData.users.forEach((person) => {
        console.log(person);
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
            username: person.username,
            username_img: person.username+"_img",
            type: typeString,
            status: statusString,
            image_select_id: "image-select-"+person.username,
            voteback_id: person.username
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
    } else if (lobbyData.gameState === GAMESTATE_ONGOING) {
        let myType = 0, myStatus = 0;
        lobbyData.users.every((person) => {
            if (person.username === username) {
                console.log('presChoice user in browser');
                console.log(person);
                myType = person.type;
                myStatus = person.status;
                return false;
            }
            return true;
        });

        console.log('MY STATUS: ' + myStatus);
        console.log('MY TYPE:' + myType);
        if (myStatus !== startslide && myStatus !== STATUS_VOTING) {
            //voteanim("slidedown");
        }
        if (myStatus === STATUS_VOTING) {
            console.log('slide'+document.querySelector('#voteback'+lobbyData.users[0].username).classList.contains('slideup'));
            if (!document.querySelector('#voteback'+lobbyData.users[0].username).classList.contains("slideup")
            || !document.querySelector('#voteback'+lobbyData.users[0].username).classList.contains("slidup")) {
                console.log('cha cha real smooth')
                voteanim("slideup")
            } else {
                voteanim("slidup")
            }
            const yesHtml = Mustache.render(actionButtonTemplate, { text: 'Yes', id:'yes' });
            const noHtml = Mustache.render(actionButtonTemplate, { text: 'No', id:'no' });
            $lobbyActions.insertAdjacentHTML('beforeend', yesHtml);
            $lobbyActions.insertAdjacentHTML('beforeend', noHtml);
            $lobbyActions.querySelector('#yes').addEventListener('click', () => {
                console.log('voting yes');
                socket.emit('voting', { room, username, choice: true }, (error) => { if (error) { console.log('error'); } })
            });
            $lobbyActions.querySelector('#no').addEventListener('click', () => {
                console.log('voing no');
                socket.emit('voting', { room, username, choice: false }, (error) => { if (error) { console.log('error'); } })
            });
        } else if (myStatus === STATUS_PRESCHOOSE) {
            eligible = [];
            for (let i = 0; i < lobbyData.users.length; i++) {
                //if (lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD) { eligible.push(false); }
                //else
                if (i === lobbyData.previousPresident || i === lobbyData.previousChancellor || lobbyData.users[i].username === username 
                    || lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD) { eligible.push(false); }
                else { eligible.push(true); }
            }
            console.log("president choosing");
            console.log(lobbyData.users);
            console.log(eligible);
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
                console.log('Chose ' + i);
                newButton.addEventListener('click', () => {
                    console.log('Chose ' + i);
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
                console.log('Chose ' + i);
                newButton.addEventListener('click', () => {
                    console.log('Chose ' + i);
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
                if(lobbyData.users[i].type === TYPE_SPECTATOR || lobbyData.users[i].type === TYPE_DEAD || lobbyData.users[i].username === username || i === lobbyData.chancellor){
                    eligible.push(false);
                } else {
                    eligible.push(true);
                }
            }
            createPlayerSelect(lobbyData, eligible, 'presAction2');
        } else if (myStatus === STATUS_PRESACT3){
            let eligible = [];
            for(let i=0; i<lobbyData.users.length; i++){
                eligible.push(true);
            }
            createPlayerSelect(lobbyData, eligible, 'presAction3');
        } else if (myStatus === STATUS_PRESACT4){
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
            console.log("president veto choice");
            const yesHtml = Mustache.render(actionButtonTemplate, { text: 'Yes', id:'yes' });
            const noHtml = Mustache.render(actionButtonTemplate, { text: 'No', id:'no' });
            $lobbyActions.insertAdjacentHTML('beforeend', yesHtml);
            $lobbyActions.insertAdjacentHTML('beforeend', noHtml);
            $lobbyActions.querySelector('#yes').addEventListener('click', () => {
                console.log('veto voting yes');
                socket.emit('presVetoVoting', { room, choice: true }, (error) => { if (error) { console.log('error'); } })
            });
            $lobbyActions.querySelector('#no').addEventListener('click', () => {
                console.log('veto voting no');
                socket.emit('presVetoVoting', { room, choice: false }, (error) => { if (error) { console.log('error'); } })
            });
        }  else if (myStatus === STATUS_CHANCVETOCHOICE){
            const yesHtml = Mustache.render(actionButtonTemplate, { text: 'Yes', id:'yes' });
            const noHtml = Mustache.render(actionButtonTemplate, { text: 'No', id:'no' });
            $lobbyActions.insertAdjacentHTML('beforeend', yesHtml);
            $lobbyActions.insertAdjacentHTML('beforeend', noHtml);
            $lobbyActions.querySelector('#yes').addEventListener('click', () => {
                console.log('veto voting yes');
                socket.emit('chancellorVetoVoting', { room, choice: true }, (error) => { if (error) { console.log('error'); } })
            });
            $lobbyActions.querySelector('#no').addEventListener('click', () => {
                console.log('veto voting no');
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
            console.log('START GAME');
            socket.emit('startGame', { room: room }, (error) => { if (error) { console.log('error') } });
        });
    } else if (playerType === TYPE_PLAYER) {
        html = Mustache.render(actionButtonTemplate, { text: 'Spectate', id:"spectate" });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            console.log('should change to spectate');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_SPECTATOR }, (error) => { if (error) { console.log('error'); } })
        });
    } else { //playerType === TYPE_SPECTATOR
        html = Mustache.render(actionButtonTemplate, { text: 'Play Game', id:"play-game" });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            console.log('should change to play');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_PLAYER }, (error) => { if (error) { console.log('error'); } })
        });
    }
}

const createPlayerSelect = (lobbyData, eligible, eventType) => {
    playerImageSelect(lobbyData, eligible, eventType);
    let html = null, newButton = null;
    for (let i = 0; i < lobbyData.users.length; i++) {
        console.log('player select button: ' + lobbyData.users[i].username);
        if (eligible[i]) {
            html = Mustache.render(actionButtonTemplate, { text: lobbyData.users[i].username, id: lobbyData.users[i].username }, (error) => { if (error) { console.log('error'); } })
            $lobbyActions.insertAdjacentHTML('beforeend', html);
            newButton = $lobbyActions.querySelector("#" + lobbyData.users[i].username);
            console.log('adding event listener');
            newButton.addEventListener('click', () => {
                console.log('chosen');
                socket.emit(eventType, { room, choice: lobbyData.users[i].username }, (error) => { if (error) { console.log('error'); } })
            });
        }
    }
}

const playerImageSelect = (lobbyData, eligible, eventType) => {
    let html=null; newButton=null;
    for (let i = 0; i < lobbyData.users.length; i++) {
        console.log('player select image: ' + lobbyData.users[i].username);
        if (eligible[i]) {
            const $imageSelectOverlay = document.querySelector('#image-select-'+lobbyData.users[i].username);
            html = Mustache.render(imageSelectTemplate, {image_id: "image-overlay-" + lobbyData.users[i].username, src: "test carback.png", id: lobbyData.users[i].username }, (error) => { if (error) { console.log('error'); } })
            $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
            newButton = $imageSelectOverlay.querySelector("#image-overlay-" + lobbyData.users[i].username);
            console.log('adding event listener');
            newButton.addEventListener('click', () => {
                console.log('chosen');
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

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
