// console.log("menu running")
let menuBoardContainer; // the div at the bottom of the page
let menuBack; // background of the menu
let blackoutBackground; // semi-transparent background
let menu; // menu including the board and sliders
let spacerOnTopOfMenu; 
let boardImage;
let boardImageDiv;

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
    blackoutBackground.style.opacity = "0%"
    blackoutBackground.style.height = body.getBoundingClientRect().height + "px"
    blackoutBackground.style.width = "100%"
    blackoutBackground.style.backgroundColor = "black"
    blackoutBackground.style.position = "absolute"
    blackoutBackground.style.top = -body.getBoundingClientRect().height + "px"
    blackoutBackground.style.top = "-0px"
    blackoutBackground.style.zIndex = "999"
    menuBoardContainer.appendChild(blackoutBackground);


    // console.log(body.getBoundingClientRect())
    menuBack = document.createElement('div');
    menuBack.style.height ="350px"
    menuBack.style.width = '90%'
    menuBack.id = "menu-board-back"
    menuBack.style.position = "relative"
    menuBack.style.marginLeft = "auto"
    menuBack.style.marginRight = "auto"
    menuBack.style.top = -1.1*menuBoardContainer.getBoundingClientRect().y+"px" 
    menuBack.style.alignItems = "center"
    menuBack.style.backgroundColor = "red"
    menuBack.style.overflow = "hidden"
    menuBack.style.zIndex = "99999"
    menuBack.style.opacity = "0"
    menuBoardContainer.appendChild(menuBack);


    spacerOnTopOfMenu = document.createElement("div");
    spacerOnTopOfMenu.style.height = 0.1*menuBack.getBoundingClientRect().height+"px"
    spacerOnTopOfMenu.style.width = "100%"
    spacerOnTopOfMenu.style.marginTop = "auto"
    spacerOnTopOfMenu.style.marginLeft = "auto"
    spacerOnTopOfMenu.style.marginRight = "auto"
    spacerOnTopOfMenu.style.position = "flex"
    spacerOnTopOfMenu.id = "menu-board-spacer"
    spacerOnTopOfMenu.style.backgroundColor = "blue"
    spacerOnTopOfMenu.style.overflow = "visible"
    spacerOnTopOfMenu.style.visibility = 'hidden'
    menuBack.appendChild(spacerOnTopOfMenu);


    menu = document.createElement("div");
    menu.style.top = "0"
    menu.style.left = "-50%"
    menu.style.height = "80%"
    menu.style.width = "80%"
    menu.style.marginLeft = "auto"
    menu.style.marginRight = "auto"
    menu.style.position = "flex"
    menu.id = "menu-board"
    menu.style.backgroundColor = "green"
    menu.style.overflow = "visible"
    menuBack.appendChild(menu);


    boardImage =  document.createElement("img");
    boardImage.src = "/img/fascist_back_56.png"
    boardImage.style.marginLeft = "auto"
    boardImage.style.marginRight = "auto"
    boardImage.style.height = "100%";
    boardImage.style.width = "auto";
    menu.appendChild(boardImage)


    boardImageDiv = document.createElement('div')



    let keyframeEffect = new KeyframeEffect(
        blackoutBackground,
        [
            { opacity: "0%"},
            { opacity: "85%"}                ],
        {duration: 1000, delay: 500, easing: "ease"},
    )
    let animationBlackOutFadeIn = new Animation(keyframeEffect, document.timeline);
    animationBlackOutFadeIn.addEventListener('finish', ()=>{
        blackoutBackground.style.opacity = "85%"
    })
    
    keyframeEffect = new KeyframeEffect(
        menuBack,
        [
            { width: "0%", opacity: "100%"},
            { width: "90%", opacity: "100%"}                ],
        {duration: 1200, delay: 500, easing: "ease"},
    )
    let animationOpenMenu = new Animation(keyframeEffect, document.timeline);
    animationOpenMenu.addEventListener('finish', ()=>{
        menuBack.style.width = '90%'
        menuBack.style.opacity = '100%'
        menuBack.style.overflow = "visible"
    })

    animationBlackOutFadeIn.play(); // blacks out anything that isn't the board creation menu
    animationOpenMenu.play()

    // console.log(body.style.height);
}

makeBoardCreationMenu();