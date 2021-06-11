const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $participantList = document.querySelector('#participant-list');
const participantTemplate = document.querySelector('#participant-template').innerHTML;
const $lobbyActions = document.querySelector('#actions');
const actionButtonTemplate = document.querySelector('#action-button-template').innerHTML;

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

//create lobby page heading
const $heading = document.querySelector('#heading');
const headingTemplate = document.querySelector('#heading-template').innerHTML;
const headingHtml = Mustache.render(headingTemplate, {
    room: room
});
$heading.insertAdjacentHTML('beforeend', headingHtml);

socket.on('lobbyData', (lobbyDataString) => {
    console.log(lobbyDataString);
    lobbyData = JSON.parse(lobbyDataString);

    //remove all current lobbyData
    console.log('deleting lobbyData')
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
        else if (person.status === STATUS_PRESDEC) { statusString = 'President deciding...' }
        else if (person.status === STATUS_CHANCDEC) { statusString = 'Chancellor deciding...' }
        else if (person.status === STATUS_PRESACT) { statusString = 'President taking action...' }
        else { person.status = '' }

        const html = Mustache.render(participantTemplate, {
            username: person.username,
            type: typeString,
            status: statusString
        });
        $participantList.insertAdjacentHTML('beforeend', html);
    });

    //if in lobby state, remove and replace buttons
    if (lobbyData.gameState === GAMESTATE_LOBBY) {
        const currentButton = $lobbyActions.querySelector('button');
        if (currentButton) { console.log('removing button'); currentButton.remove(); }
        let type = -1;
        lobbyData.users.every((person) => {
            if (person.username === username) {
                type = person.type;
                return false;
            }
            return true;
        });
        createLobbyButtons(type);
    }
});

const createLobbyButtons = (playerType) => {
    let html = null, newButton = null;
    if (playerType === TYPE_HOST) {
        html = Mustache.render(actionButtonTemplate, { text: 'Start Game' });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            console.log('START GAME');
            socket.emit('startGame', { room: room}, (error) => { if (error) { console.log('error') } });
        });
    } else if (playerType === TYPE_PLAYER) {
        html = Mustache.render(actionButtonTemplate, { text: 'Spectate' });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            console.log('should change to spectate');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_SPECTATOR }, (error) => { if (error) { console.log('error'); } })
        });
    } else { //playerType === TYPE_SPECTATOR
        html = Mustache.render(actionButtonTemplate, { text: 'Play Game' });
        $lobbyActions.insertAdjacentHTML('beforeend', html);
        newButton = $lobbyActions.querySelector('button');
        newButton.addEventListener('click', () => {
            console.log('should change to play');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_PLAYER }, (error) => { if (error) { console.log('error'); } })
        });
    }
}

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
