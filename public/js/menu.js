// console.log("menu running")
let menuBoardContainer; // the div at the bottom of the page
let menu;
let blackoutBackground; // semi-transparent background

const makeBoardCreationMenu = ()=>{
    let body = (document.getElementsByTagName("BODY")[0])

    
    menuBoardContainer = document.createElement('div')
    menuBoardContainer.style.height = '0%'
    menuBoardContainer.style.width = '100%'
    menuBoardContainer.id = "menu-board-container"
    menuBoardContainer.style.position = "flex"
    menuBoardContainer.style.marginLeft = "auto"
    menuBoardContainer.style.marginRight = "auto"
    menuBoardContainer.style.alignItems = "center"
    menuBoardContainer.style.backgroundColor = "red"
    menuBoardContainer.style.overflow = "visible"
    menuBoardContainer.style.zIndex = "9999"
    menuBoardContainer.style.opacity = "100%"
    body.appendChild(menuBoardContainer);

        
    blackoutBackground = document.createElement('div');
    blackoutBackground.style.opacity = "75%"
    blackoutBackground.style.height = body.getBoundingClientRect().height + "px"
    blackoutBackground.style.width = "100%"
    blackoutBackground.style.backgroundColor = "black"
    blackoutBackground.style.position = "absolute"
    blackoutBackground.style.top = -body.getBoundingClientRect().height + "px"
    blackoutBackground.style.top = "-0px"
    blackoutBackground.style.zIndex = "999"
    menuBoardContainer.appendChild(blackoutBackground);

    // console.log(body.getBoundingClientRect())
    menu = document.createElement('div');
    menu.style.height = menuBoardContainer.getBoundingClientRect().y+"px"
    menu.style.width = '90%'
    menu.id = "menu-board"
    menu.style.position = "relative"
    menu.style.marginLeft = "auto"
    menu.style.marginRight = "auto"
    menu.style.top = -1.1*menuBoardContainer.getBoundingClientRect().y+"px" 
    menu.style.alignItems = "center"
    menu.style.backgroundColor = "red"
    menu.style.overflow = "visible"
    menu.style.zIndex = "99999"
    menuBoardContainer.appendChild(menu);

    // console.log(body.style.height);
}

makeBoardCreationMenu();