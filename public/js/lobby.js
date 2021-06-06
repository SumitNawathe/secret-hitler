const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const $participantList = document.querySelector('#participant-list');
const participantTemplate = document.querySelector('#participant-template').innerHTML;

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
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
