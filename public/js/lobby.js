const socket = io();
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

let $participantList = document.querySelector('#participant-list');
let participantTemplate = document.querySelector('#participant-template').innerHTML;
let $lobbyActions = document.querySelector('#actions');
let actionButtonTemplate = document.querySelector('#action-button-template').innerHTML;
let imageSelectTemplate = document.querySelector('#image-overlay').innerHTML;
let slideCardTemplate = document.querySelector('#slidecard-template').innerHTML;
let slideCardWithBackTemplate = document.querySelector('#slidecardwithback-template').innerHTML

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

const STATUS_PRESVETOCHOICE = 9;
const STATUS_CHANCVETOCHOICE = 10;

//create lobby page heading
const $heading = document.querySelector('#heading');
const headingTemplate = document.querySelector('#heading-template').innerHTML;
const headingHtml = Mustache.render(headingTemplate, {
    room: room
});

let spectator = false
let dead = false

let usernames = []
let participants = []
let slidecards = []
let overlays = []
let previouslabels = ["img[src='img/previous president label.png']", "img[src='img/previous_chancellor_label.png']"]
let currentlabels = ["img[src='img/president_label.png']", "img[src='img/chancellor_label.png']"]
let ppolicies = [document.querySelector(".ppolicy1"), document.querySelector(".ppolicy2"), document.querySelector(".ppolicy3")]
let cpolicies = [document.querySelector(".cpolicy1"), document.querySelector(".cpolicy2")]

let javote = document.querySelector(".javote")
let neinvote = document.querySelector(".neinvote")

let $tracker = document.querySelector('.tracker')

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
    //TODO: clean up this terrible terrible mess
    let currentButton = $lobbyActions.querySelector('button');
    while(currentButton) {
        currentButton.remove();
        currentButton = $lobbyActions.querySelector('button');
    }

    var audio = new Audio('audio/CardPlacingSound.mp3');
    //audio.play();
    console.log('start game')
    const startGameData = JSON.parse(startGameDataString)
    const type = startGameData.type
    const players = startGameData.players
    console.log('players '+players)
    if (players<7) {
        document.querySelector(".fasboard").src = "img/fascist_back_56.png"
    } else if (players>8) {
        document.querySelector(".fasboard").src = "img/fascist_back_910.png"
    } else {
        document.querySelector(".fasboard").src = "img/fascist_back_78.png"
    }
    try {
        for (let i=0; i<$participantList.children.length; i++) {
            $participantList.querySelector('.spectator').remove()
        }
    } catch (error) {}
    const list = $participantList.children
    for (let i=0; i<list.length; i++) {
        let username = getUsername(i)
        usernames.push(username)
        var newObject = new Object()
        newObject.username = username
        newObject.div = $participantList.querySelector('#participant'+username)
        newObject.dead = false
        participants.push(newObject)
        newObject = new Object()
        newObject.username = username
        newObject.div = $participantList.querySelector('#slidecard'+username)
        slidecards.push(newObject)
        newObject = new Object()
        newObject.username = username
        newObject.div = $participantList.querySelector('#image-select-'+username)
        overlays.push(newObject)
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
        if (players<7) {
            const fascists = startGameData.fascists
            for (let username of fascists) {
                getDivFromUsername(participants, username).children[0].classList.add("Fascist")
                slideCardOneWithBack("party cardback.png", "fascist cardback.png", username)
                let $slidecard = getDivFromUsername(slidecards, username)
                $slidecard.querySelector('.flip-card').classList.add("rotateandslideupanddown")
                $slidecard.querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
            }
        }
        // const $voteback = document.querySelector('#voteback'+username)
        // $voteback.classList.add("slideupanddown")
        //TODO: depending on player number see others
    } else if (type === TYPE_SPECTATOR) {
        spectator = true
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
    console.log('new pres '+newPres)
    const oldChanc = newPresidentData.oldChanc
    const oldPres = newPresidentData.oldPres
    console.log('oldChanc '+oldChanc)
    console.log('oldPres '+oldPres)
    clearLobbyActions()
    removeLoaders()
    clearOverlay()
    clearSlide()
    let html = Mustache.render(imageSelectTemplate, {src: "president_label.png"});
    let $imageSelectOverlay = document.querySelector('#image-select-'+newPres);
    $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
    if (oldPres) {
        html = Mustache.render(imageSelectTemplate, {src: "previous president label.png"});
        $imageSelectOverlay = document.querySelector('#image-select-'+oldPres);
        $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
        $imageSelectOverlay.querySelector(previouslabels[0]).classList.add("previous")
    }
    if (oldChanc) {
        html = Mustache.render(imageSelectTemplate, {src: "previous_chancellor_label.png"});
        $imageSelectOverlay = document.querySelector('#image-select-'+oldChanc);
        $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
        $imageSelectOverlay.querySelector(previouslabels[1]).classList.add("previous")
    }
    let presParticipant = $participantList.querySelector("#participant"+newPres)
    console.log(presParticipant)
    presParticipant.querySelector(".loader").classList.add("active")

    if (newPres === username) {
        const eligibleChancellors = newPresidentData.eligibleChancellors
        console.log('eligible '+eligibleChancellors[0])
        let eligible = []
        for (let i=0; i<usernames.length; i++) {
            if (eligibleChancellors.includes(usernames[i])) {
                eligible.push(true)
            } else {
                eligible.push(false)
            }
        }
        playerSelect(eligible, 'chooseChancellor')
    }
})

socket.on('chancellor chosen', (chancellorChosenString) => {
    clearOverlayExcept(previouslabels)
    clearSlide()
    const chancellorChosenData = JSON.parse(chancellorChosenString)
    const president = chancellorChosenData.president
    const chancellor = chancellorChosenData.chancellor
    console.log('chancellor '+chancellor)

    let html = Mustache.render(imageSelectTemplate, {src: "president_label.png"});
    $imageSelectOverlay = getDivFromUsername(overlays, president)
    $imageSelectOverlay.insertAdjacentHTML('beforeend', html)
    getDivFromUsername(participants, president).querySelector(".loader").classList.remove("active")

    html = Mustache.render(imageSelectTemplate, {src: "chancellor_label.png"});
    $imageSelectOverlay = document.querySelector('#image-select-'+chancellor);
    $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
    $imageSelectOverlay.querySelector("img[src='img/chancellor_label.png']").classList.add("blink")
    
    //TODO: maybe make loaders sync up
    setVote()
})

socket.on('did vote', (didVoteString) => {
    const didVoteData = JSON.parse(didVoteString)
    const username = didVoteData.username
    getDivFromUsername(participants, username).querySelector(".loader").classList.remove("active")
})

socket.on('rescind vote', (didVoteString) => {
    const didVoteData = JSON.parse(didVoteString)
    const username = didVoteData.username
    getDivFromUsername(participants, username).querySelector(".loader").classList.add("active")
}) 

socket.on('vote finished', (voteFinishedString) => {
    if (!spectator && !dead)
        clearVote()
    const voteData = JSON.parse(voteFinishedString)
    const votes = voteData.votes
    for (let i=0; i<votes.length; i++) {
        const username = votes[i].username
        const yes = votes[i].yes
        if (!yes) {
            getDivFromUsername(slidecards, username).querySelector(".flip-card-back")
                .children[0].src = 'img/no cardback.png'
        }
    }
    for (let i=0; i<participants.length; i++) {
        if (!participants[i].dead) {
            participants[i].div.querySelector(".flip-card").classList.add("rotateandslidedown")
            participants[i].div.querySelector(".flip-card-inner").classList.add("rotateandslidedown")
        }
    }
})

const setVote = () => {
    for (let i=0; i<slidecards.length; i++) {
        if (!participants[i].dead) {
            slideCardOneWithBack("voting cardback.png", "yes cardback.png", usernames[i])
            slidecards[i].div.children[0].classList.add("slideup")
            slidecards[i].div.children[0].children[0].classList.add("slideup")

            participants[i].div.querySelector(".loader").classList.add("active")
        }
    }
    if (!spectator && !dead) {
        javote.classList.add("vote-place")
        neinvote.classList.add("vote-place")
        //might have to be more specific for veto stuff later
        javote.addEventListener('click', jaEventListener)
        neinvote.addEventListener('click', neinEventListener)
    }
}

function jaEventListener() {
    if (javote.classList.contains("selectvote")) {
        javote.classList.remove("selectvote")
    } else {
        javote.classList.add("selectvote")
        neinvote.classList.remove("selectvote")
    }
    socket.emit('voting', { room, username, choice: true }, (error) => { if (error) { console.log('error'); } })
}
function neinEventListener() {
    if (neinvote.classList.contains("selectvote")) {
        neinvote.classList.remove("selectvote")
    } else {
        neinvote.classList.add("selectvote")
        javote.classList.remove("selectvote")
    }
    socket.emit('voting', { room, username, choice: false }, (error) => { if (error) { console.log('error'); } })
}
const clearVote = () => {
    javote.removeEventListener('click', jaEventListener)
    neinvote.removeEventListener('click', neinEventListener)
    //javote.classList.remove("vote-place")
    javote.classList.add("vote-remove")
    //neinvote.classList.remove("vote-place")
    neinvote.classList.add("vote-remove")
    setTimeout(function() {
        javote.classList.remove("vote-place", "vote-remove", "selectvote")
        neinvote.classList.remove("vote-place", "vote-remove", "selectvote")
    }, 1000)
}

socket.on('election passes', (electionPassString) => {
    clearOverlayExcept(currentlabels)
    clearSlide()
    const passData = JSON.parse(electionPassString)
    const president = passData.presidentUsername
    const chancellor = passData.chancellorUsername
    getDivFromUsername(participants, president).querySelector(".loader").classList.add("active")
    $overlay = getDivFromUsername(overlays, chancellor)
    $overlay.querySelector("img[src='img/chancellor_label.png']").classList.remove("blink")
})

socket.on('election failed', (electionFailString) => {
    clearOverlayExcept(previouslabels)
    clearSlide()
    const passData = JSON.parse(electionFailString)
    //TODO: election tracker stuff
})

socket.on('get three cards', (threeCardsString) => {
    $lobbyActions.insertAdjacentHTML('beforeend', "Choose a policy to discard")
    //TODO: add text about discarding if necessary
    const threeCardsData = JSON.parse(threeCardsString)
    const cards = threeCardsData.cards
    for (let i=0; i<cards.length; i++) {
        if (cards[i]) {
            ppolicies[i].src = "img/liberal policy.png"
        } else {
            ppolicies[i].src = "img/fascist policy.png"
        }
    }
    for (let policy of ppolicies) {
        policy.classList.add("policy-slide")
    }
    setTimeout(function() {
        for (let policy of ppolicies) {
            policy.addEventListener('click', ppolicyListener)
        }
    }, 1000)

})

function ppolicyListener(e) {
    e.target.classList.add("selectvote")
    for (let policy of ppolicies) {
        policy.removeEventListener('click', ppolicyListener)
        policy.classList.add("policy-slideup")
    }
    setTimeout(function() {
        for (let policy of ppolicies) {
            policy.classList.remove("policy-slide", "policy-slideup", "selectvote")
        }
        socket.emit('presDecision', { room: room, index: Number(e.target.classList[0].substring(7))-1}, 
            (error) => { if (error) { console.log('error') } });
    }, 1500)
}

socket.on('president discard', (presidentDiscardString) => {
    clearLobbyActions()
    const presidentDiscardData = JSON.parse(presidentDiscardString)
    const president = presidentDiscardData.president
    const chancellor = presidentDiscardData.chancellor
    getDivFromUsername(participants, president).querySelector(".loader").classList.remove("active")
    getDivFromUsername(participants, chancellor).querySelector(".loader").classList.add("active")
})

socket.on('chancellor get two cards', (twoCardsString) => {
    $lobbyActions.insertAdjacentHTML('beforeend', "Choose a policy to enact")
    const twoCardsData = JSON.parse(twoCardsString)
    const cards = twoCardsData.policyCards
    for (let i=0; i<cards.length; i++) {
        if (cards[i]) {
            cpolicies[i].src = "img/liberal policy.png"
        } else {
            cpolicies[i].src = "img/fascist policy.png"
        }
    }
    for (let policy of cpolicies) {
        policy.classList.add("policy-slide")
    }
    setTimeout(function() {
        for (let policy of cpolicies) {
            policy.addEventListener('click', cpolicyListener)
        }
    }, 1000)
})

function cpolicyListener(e) {
    e.target.classList.add("selectvote")
    for (let policy of cpolicies) {
        policy.removeEventListener('click', cpolicyListener)
        policy.classList.add("policy-slideup")
    }
    setTimeout(function() {
        for (let policy of cpolicies) {
            policy.classList.remove("policy-slide", "policy-slideup", "selectvote")
        }
        socket.emit('chancDecision', { room: room, index: Number(e.target.classList[0].substring(7))-1}, 
            (error) => { if (error) { console.log('error') } });
    }, 1500)
}

socket.on('place card', (placeCardString) => {
    clearLobbyActions()
    removeLoaders() //might need to change this for veto stuff
    const placeCardData = JSON.parse(placeCardString)
    const type = placeCardData.type
    const liberalsPlaced = placeCardData.liberalsPlacedIncludingThisCard
    const fascistsPlaced = placeCardData.fascistsPlacedIncludingThisCard
    if (type) {
        document.querySelector('.liberal-overlay'+liberalsPlaced).classList
            .add("liberal"+liberalsPlaced+"-placeandrotate")
        document.querySelector('.liberal-overlay'+liberalsPlaced).children[0].classList
            .add("policy-rotate")
    } else {
        document.querySelector('.fascist-overlay'+fascistsPlaced).classList
            .add("fascist"+fascistsPlaced+"-placeandrotate")
        document.querySelector('.fascist-overlay'+fascistsPlaced).children[0].classList
            .add("policy-rotate")
            //this can be cleaned up a lot on html side
    }
})

socket.on('president loading', (loadingString) => {
    console.log('presLoading')
    loadingData = JSON.parse(loadingString)
    const president = loadingData.president
    getDivFromUsername(participants, president).querySelector('.loader').classList.add("active")
})

socket.on('president action 1', (firstString) => {
    console.log('presAction1')
    $lobbyActions.insertAdjacentHTML('beforeend', "Choose a player to investigate")
    const firstData = JSON.parse(firstString)
    const president = firstData.president
    const eligible = []
    for (let i=0; i<participants.length; i++) {
        if (participants[i].username !== president && !participants[i].dead) { eligible.push(true) }
        else { eligible.push(false) }
    }
    playerSelect(eligible, 'presAction1')
})

socket.on('investigation results', (investString) => {
    const investData = JSON.parse(investString)
    const president = investData.president
    const investigated = investData.investigated
    const type = investData.type
    if (username !== president) {
        slideCardOne("party cardback.png", investigated)
        let div = getDivFromUsername(slidecards, investigated)
        div.querySelector('.flip-card').classList.add("slideupanddown")
        div.querySelector('.flip-card-inner').classList.add("slideupanddown")
    } else {
        //TODO: add separate lib and fas party membership specific cards
        if (type) {
            slideCardOneWithBack("party cardback.png", "liberal cardback.png", investigated)
            getDivFromUsername(participants, investigated).children[0].classList.add("Liberal")
        } else {
            slideCardOneWithBack("party cardback.png", "fascist cardback.png", investigated)
            getDivFromUsername(participants, investigated).children[0].classList.add("Fascist")
        }
        let div = getDivFromUsername(slidecards, investigated)
        div.querySelector('.flip-card').classList.add("rotateandslideupanddown")
        div.querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
    }
})

socket.on('president action 2', (secondString) => {
    $lobbyActions.insertAdjacentHTML('beforeend', "Choose the next president")
    const secondData = JSON.parse(secondString)
    const president = secondData.president
    const eligible = []
    for (let i=0; i<participants.length; i++) {
        if (participants[i].username !== president && !participants[i].dead) { eligible.push(true) }
        else { eligible.push(false) }
    }
    playerSelect(eligible, 'presAction2')
})

socket.on('president action 3', (thirdString) => {
    let html = Mustache.render(actionButtonTemplate, { text: "View next three cards" });
    $lobbyActions.insertAdjacentHTML('beforeend', html)
    let button = $lobbyActions.querySelector('.button')
    button.addEventListener('click', () => {
        clearLobbyActions()
        socket.emit('presAction3', { room }, (error) => { if (error) { console.log('error'); } })
    })
})

socket.on('president action 4', (fourthString) => {
    //TODO: add confirmation on execute
    $lobbyActions.insertAdjacentHTML('beforeend', "WARNING: Choose a player to execute")
    const fourthData = JSON.parse(fourthString)
    const president = fourthData.president
    const eligible = []
    for (let i=0; i<participants.length; i++) {
        if (participants[i].username !== president && !participants[i].dead) { eligible.push(true) }
        else { eligible.push(false) }
    }
    playerSelect(eligible, 'presAction4')
})

socket.on('user killed', (killedString) => {
    const killedData = JSON.parse(killedString)
    const killedUser = killedData.killedUser
    slideCardOne("dead.png", killedUser)
    let div = getDivFromUsername(slidecards, killedUser)
    div.querySelector('.flip-card').classList.add("slideup")
    div.querySelector('.flip-card-inner').classList.add("slideup")
    for (let participant of participants) {
        if (participant.username === killedUser) {
            participant.dead = true
            break
        }
    }
    if (username === killedUser) dead = true
    setTimeout(() => {
        document.querySelector('#'+killedUser+'_img').src = "img/dead.png"
    }, 1000);
})

socket.on('next three cards', (cardsString) => {
    const cardsData = JSON.parse(cardsString)
    const cards = cardsData.cards
    for (let i=0; i<cards.length; i++) {
        if (cards[i]) {
            ppolicies[i].src = "img/liberal policy.png"
        } else {
            ppolicies[i].src = "img/fascist policy.png"
        }
    }
    for (let policy of ppolicies) {
        policy.classList.add("policy-slidedownandup")
        setTimeout(() => {
            policy.classList.remove("policy-slidedownandup")
        }, 5000);
    }
})

socket.on('failed election tracker', (trackerString) => {
    const trackerData = JSON.parse(trackerString)
    const start = trackerData.start
    const end = trackerData.end
    if (end !== 0) {
        $tracker.classList.remove("tracker1", "tracker2", "tracker3",
                "backtracker1", "backtracker2", "backtracker3")
        $tracker.classList.add("tracker"+end)
    } else {
        $tracker.classList.add("backtracker"+start)
        setTimeout(() => {
            $tracker.classList.remove("tracker1", "tracker2", "tracker3",
                "backtracker1", "backtracker2", "backtracker3")
        }, 1500);
    }
})

socket.on('chancellor veto choice', () => {
    clearLobbyActions()
    $lobbyActions.insertAdjacentHTML('beforeend', "Would you like to veto?")
    javote.classList.add("vote-place")
    neinvote.classList.add("vote-place")
    setTimeout(() => {
        javote.addEventListener('click', cjaEventListenerVeto)
        neinvote.addEventListener('click', cneinEventListenerVeto)
    }, 1000);
})

function cjaEventListenerVeto() {
    javote.removeEventListener('click', cjaEventListenerVeto)
    neinvote.removeEventListener('click', cneinEventListenerVeto)
    javote.classList.add("selectvote")
    javote.classList.add("vote-remove")
    neinvote.classList.add("vote-remove")
    setTimeout(function() {
        clearLobbyActions()
        javote.classList.remove("vote-place", "vote-remove", "selectvote")
        neinvote.classList.remove("vote-place", "vote-remove", "selectvote")
    }, 1000)
    socket.emit('chancellorVetoVoting', { room, choice: true },
        (error) => { if (error) { console.log('error'); } })
}
function cneinEventListenerVeto() {
    javote.removeEventListener('click', cjaEventListenerVeto)
    neinvote.removeEventListener('click', cneinEventListenerVeto)
    neinvote.classList.add("selectvote")
    javote.classList.add("vote-remove")
    neinvote.classList.add("vote-remove")
    setTimeout(function() {
        clearLobbyActions()
        javote.classList.remove("vote-place", "vote-remove", "selectvote")
        neinvote.classList.remove("vote-place", "vote-remove", "selectvote")
    }, 1000)
    socket.emit('chancellorVetoVoting', { room, choice: false },
        (error) => { if (error) { console.log('error'); } })
}

socket.on('chancellor veto decide', (cDecideString) => {
    removeLoaders()
    clearSlide()
    const cDecideData = JSON.parse(cDecideString)
    const choice = cDecideData.choice
    const chancellor = cDecideData.chancellor
    const president = cDecideData.president
    if (choice) {
        slideCardOneWithBack("voting cardback.png", "yes cardback.png", chancellor)
    } else {
        slideCardOneWithBack("voting cardback.png", "no cardback.png", chancellor)
    }
    let $slidecard = getDivFromUsername(slidecards, chancellor)
    $slidecard.querySelector('.flip-card').classList.add("rotateandslideupanddown")
    $slidecard.querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
})

socket.on('president veto choice', () => {
    clearLobbyActions()
    $lobbyActions.insertAdjacentHTML('beforeend', "Would you like to veto?")
    javote.classList.add("vote-place")
    neinvote.classList.add("vote-place")
    setTimeout(() => {
        javote.addEventListener('click', pjaEventListenerVeto)
        neinvote.addEventListener('click', pneinEventListenerVeto)
    }, 1000);
})

function pjaEventListenerVeto() {
    javote.removeEventListener('click', pjaEventListenerVeto)
    neinvote.removeEventListener('click', pneinEventListenerVeto)
    javote.classList.add("selectvote")
    javote.classList.add("vote-remove")
    neinvote.classList.add("vote-remove")
    setTimeout(function() {
        clearLobbyActions()
        javote.classList.remove("vote-place", "vote-remove", "selectvote")
        neinvote.classList.remove("vote-place", "vote-remove", "selectvote")
    }, 1000)
    socket.emit('presVetoVoting', { room, choice: true },
        (error) => { if (error) { console.log('error'); } })
}
function pneinEventListenerVeto() {
    javote.removeEventListener('click', pjaEventListenerVeto)
    neinvote.removeEventListener('click', pneinEventListenerVeto)
    neinvote.classList.add("selectvote")
    javote.classList.add("vote-remove")
    neinvote.classList.add("vote-remove")
    setTimeout(function() {
        clearLobbyActions()
        javote.classList.remove("vote-place", "vote-remove", "selectvote")
        neinvote.classList.remove("vote-place", "vote-remove", "selectvote")
    }, 1000)
    socket.emit('presVetoVoting', { room, choice: false },
        (error) => { if (error) { console.log('error'); } })
}

socket.on('president veto decide', (pVetoString) => {
    const pVetoData = JSON.parse(pVetoString)
    const choice = pVetoData.choice
    const president = pVetoData.president
    removeLoaders()
    clearSlide()
    if (choice) {
        slideCardOneWithBack("voting cardback.png", "yes cardback.png", president)
    } else {
        slideCardOneWithBack("voting cardback.png", "no cardback.png", president)
    }
    let $slidecard = getDivFromUsername(slidecards, president)
    $slidecard.querySelector('.flip-card').classList.add("rotateandslideupanddown")
    $slidecard.querySelector('.flip-card-inner').classList.add("rotateandslideupanddown")
})

socket.on('end game', (endGameString) => {
    removeLoaders()
    clearOverlay()
    clearSlide()
    clearLobbyActions()
    const endGameData = JSON.parse(endGameString)
    const winningTeam = endGameData.winningTeam
    const users = endGameData.users
    for (let person of users) {
        getDivFromUsername(participants, person.username).children[0]
                .classList.remove("Liberal", "Fascist", "Hitler")
        //might cause flash of white names depending on computer speed
        if (person.type === TYPE_LIBERAL) {
            slideCardOneWithBack("party cardback.png", "liberal cardback.png", person.username)
            getDivFromUsername(participants, person.username).children[0]
                .classList.add("Liberal")
        } else if (person.type === TYPE_FASCIST) {
            slideCardOneWithBack("party cardback.png", "fascist cardback.png", person.username)
            getDivFromUsername(participants, person.username).children[0]
                .classList.add("Fascist")
        } else {
            slideCardOneWithBack("party cardback.png", "hitler cardback.png", person.username)
            getDivFromUsername(participants, person.username).children[0]
                .classList.add("Hitler")
        }
        let $slidecard = getDivFromUsername(slidecards, person.username)
        $slidecard.querySelector('.flip-card').classList.add("rotateandslideup")
        $slidecard.querySelector('.flip-card-inner').classList.add("rotateandslideup")
    }
    setTimeout(() => {
        const remakeLobbyHtml = Mustache.render(actionButtonTemplate, { text: 'Remake Lobby'});
        $lobbyActions.insertAdjacentHTML('beforeend', remakeLobbyHtml);
        //this is bad but i dont care
        $lobbyActions.children[0].addEventListener('click', () => {
            console.log('request remake lobby');
            socket.emit('remakeLobby', { room }, (error) => { if (error) { console.log('error'); } });
        });
    }, 4000);
})

const getUsername = (i) => {
    console.log('getusername '+i)
    return $participantList.children[i].id.substring(11)
}

const getDivFromUsername = (arr, username) => {
    console.log('arr '+arr)
    console.log('username '+username)
    for (let o of arr) {
        console.log(o.username)
    }
    return arr.find(o => o.username === username).div;
}

const clearOverlay = () => {
    for (let i=0; i<overlays.length; i++) {
        overlays[i].div.innerHTML = ''
    }
}

const clearOverlayExcept = (arr) => {
    for (let i=0; i<overlays.length; i++) {
        let div=overlays[i].div
        let keep = []
        for (let except of arr) {
            if (div.querySelector(except)) {
                keep.push(div.querySelector(except))
            }
        }
        div.innerHTML = ''
        for (let child of keep)
            div.appendChild(child)
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

const removeLoaders = () => {
    for (let participant of participants) {
        participant.div.querySelector('.loader').classList.remove("active")
    }
}

const clearLobbyActions = () => {
    $lobbyActions.innerHTML = ''
}

const playerSelect = (eligible, eventType) => {
    let html=null; newButton=null;
    console.log('eligible array '+eligible)
    for (let i = 0; i < eligible.length; i++) {
        // console.log('player select image: ' + lobbyData.users[i].username);
        if (eligible[i]) {
            let username = getUsername(i)
            console.log('eligible '+username)
            let $imageSelectOverlay = document.querySelector('#image-select-'+username);
            html = Mustache.render(imageSelectTemplate, { src: "blank.png"}, (error) => { if (error) { console.log('error'); } })
            $imageSelectOverlay.insertAdjacentHTML('beforeend', html);
            newButton = $imageSelectOverlay.querySelector("img[src='img/blank.png']")
            newButton.classList.add("glowing")
            // console.log('adding event listener');
            newButton.addEventListener('click', () => {
                clearOverlayExcept(previouslabels.concat(currentlabels))
                // console.log('chosen');
                //ID isnt used rn so just in case i put the username as the ID
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

const clearCards = () => {
    for (let i=1; i<6; i++) {
        document.querySelector('.liberal-overlay'+i).classList
            .remove("liberal"+i+"-placeandrotate")
        document.querySelector('.liberal-overlay'+i).children[0].classList
            .remove("policy-rotate")
    }
    for (let i=1; i<7; i++) {
        document.querySelector('.fascist-overlay'+i).classList
            .remove("fascist"+i+"-placeandrotate")
        document.querySelector('.fascist-overlay'+i).children[0].classList
            .remove("policy-rotate")
    }
}

socket.on('lobbyData', (lobbyDataString) => {
    //spectator image problem but nobody cares
    clearCards()
    $participantList = document.querySelector('#participant-list');
 participantTemplate = document.querySelector('#participant-template').innerHTML;
 $lobbyActions = document.querySelector('#actions');
 actionButtonTemplate = document.querySelector('#action-button-template').innerHTML;
 imageSelectTemplate = document.querySelector('#image-overlay').innerHTML;
 slideCardTemplate = document.querySelector('#slidecard-template').innerHTML;
 slideCardWithBackTemplate = document.querySelector('#slidecardwithback-template').innerHTML

 spectator = false
 dead = false
 
usernames = []
  participants = []
  slidecards = []
  overlays = []
 previouslabels = ["img[src='img/previous president label.png']", "img[src='img/previous_chancellor_label.png']"]
  currentlabels = ["img[src='img/president_label.png']", "img[src='img/chancellor_label.png']"]
  ppolicies = [document.querySelector(".ppolicy1"), document.querySelector(".ppolicy2"), document.querySelector(".ppolicy3")]
 cpolicies = [document.querySelector(".cpolicy1"), document.querySelector(".cpolicy2")]
 
  javote = document.querySelector(".javote")
  neinvote = document.querySelector(".neinvote")
 
  $tracker = document.querySelector('.tracker')

clearOverlay()
clearSlide()
clearLobbyActions()
removeLoaders()


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
