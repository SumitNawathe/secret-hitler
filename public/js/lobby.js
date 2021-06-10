const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $participantList = document.querySelector('#participant-list');
const participantTemplate = document.querySelector('#participant-template').innerHTML;
const $lobbyAction = document.querySelector('#action');
const lobbyActionStartTemplate = document.querySelector('#action-start').innerHTML;
const lobbyActionPlayTemplate = document.querySelector('#action-play').innerHTML;
const lobbyActionSpectateTemplate = document.querySelector('#action-spectate').innerHTML;

const HOST = 0;
const SPECTATOR = -1;
const PLAYER = 1;

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
    console.log(lobbyData);
    lobbyData.forEach((person) => {
        console.log(person);
        let typeString = '';
        if (person.type === HOST) { typeString = 'Host' }
        else if (person.type === PLAYER) { typeString = 'Player' }
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
    lobbyData.every((person) => {
        if (person.username === username) {
            type = person.type;
            return false;
        }
        return true;
    });
    let html = null;
    if (type === HOST) {
        html = Mustache.render(lobbyActionStartTemplate);
    } else if (type === PLAYER) {
        html = Mustache.render(lobbyActionSpectateTemplate);
    } else { //type === SPECTATOR
        html = Mustache.render(lobbyActionPlayTemplate);
    }
    $lobbyAction.insertAdjacentHTML('beforeend', html);
    const newButton = $lobbyAction.querySelector('button');
    if (type === HOST) {
        newButton.addEventListener('click', () => {
            console.log('START GAME');
        });
    } else if (type === PLAYER) {
        newButton.addEventListener('click', () => {
            console.log('should change to spectate');
            socket.emit('changeLobbyInfo', { username, room, newType: SPECTATOR }, (error) => { if (error) { console.log('error'); } })
        });
    } else { //type === SPECTATOR
        newButton.addEventListener('click', () => {
            console.log('should change to play');
            socket.emit('changeLobbyInfo', { username, room, newType: PLAYER }, (error) => { if (error) { console.log('error'); } })
        });
    }
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
