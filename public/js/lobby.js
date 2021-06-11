const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $participantList = document.querySelector('#participant-list');
const participantTemplate = document.querySelector('#participant-template').innerHTML;
const $lobbyAction = document.querySelector('#action');
const lobbyActionStartTemplate = document.querySelector('#action-start').innerHTML;
const lobbyActionPlayTemplate = document.querySelector('#action-play').innerHTML;
const lobbyActionSpectateTemplate = document.querySelector('#action-spectate').innerHTML;

const TYPE_SPECTATOR = -1;
const TYPE_HOST = 0;
const TYPE_PLAYER = 1;
const TYPE_LIBERAL = 2;
const TYPE_FASCIST = 3;
const TYPE_HITLER = 4;
const GAMESTATE_LOBBY = 0;
const GAMESTATE_ONGOING = 1;
const GAMESTATE_FINISHED = 2;

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
        else { typeString = 'Spectator' }
        const html = Mustache.render(participantTemplate, {
            username: person.username,
            type: typeString
        });
        $participantList.insertAdjacentHTML('beforeend', html);
    });

    //remove and replace button
    const currentButton = $lobbyAction.querySelector('button');
    if (currentButton) { console.log('removing button'); currentButton.remove(); }
    let type = -1;
    lobbyData.users.every((person) => {
        if (person.username === username) {
            type = person.type;
            return false;
        }
        return true;
    });
    let html = null;
    if (type === TYPE_HOST) {
        html = Mustache.render(lobbyActionStartTemplate);
    } else if (type === TYPE_PLAYER) {
        html = Mustache.render(lobbyActionSpectateTemplate);
    } else { //type === TYPE_SPECTATOR
        html = Mustache.render(lobbyActionPlayTemplate);
    }
    $lobbyAction.insertAdjacentHTML('beforeend', html);
    const newButton = $lobbyAction.querySelector('button');
    if (type === TYPE_HOST) {
        newButton.addEventListener('click', () => {
            console.log('START GAME');
        });
    } else if (type === TYPE_PLAYER) {
        newButton.addEventListener('click', () => {
            console.log('should change to spectate');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_SPECTATOR }, (error) => { if (error) { console.log('error'); } })
        });
    } else { //type === TYPE_SPECTATOR
        newButton.addEventListener('click', () => {
            console.log('should change to play');
            socket.emit('changeLobbyInfo', { username, room, newType: TYPE_PLAYER }, (error) => { if (error) { console.log('error'); } })
        });
    }
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
