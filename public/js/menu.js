// console.log("menu running")
let menuBoardContainer; // the div at the bottom of the page
let menu;

const makeBoardCreationMenu = ()=>{
    let body = (document.getElementsByTagName("BODY")[0])

    menuBoardContainer = document.createElement('div')
    menuBoardContainer.style.height = '300px'
    menuBoardContainer.style.width = '600px'
    menuBoardContainer.id = "menu-board-container"
    menuBoardContainer.style.position = "flex"
    menuBoardContainer.style.marginLeft = "auto"
    menuBoardContainer.style.marginRight = "auto"
    menuBoardContainer.style.alignItems = "center"
    menuBoardContainer.style.backgroundColor = "red"
    menuBoardContainer.style.overflow = "visible"
    menuBoardContainer.style.zIndex = "999999"
    
    body.appendChild(menuBoardContainer);







}

makeBoardCreationMenu();