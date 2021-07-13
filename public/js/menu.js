// console.log("menu running")
let menuBoardContainer; // the div at the bottom of the page
let menuBack; // background of the menu
let blackoutBackground; // semi-transparent background
let menu; // menu including the board and sliders
let spacerOnTopOfMenu; 
let boardImage;
let boardImageDiv;
let sliders = [null, null, null, null, null];
let sliderIntervals = [null, null, null, null, null];

const maxSliderLength = 175;
const minSliderLength = 52;
const sliderSpeed = 0.5; // percent per millisecond
const sliderRefreshDuration = 2; // millisecond

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
    menuBack.style.height ="400px"
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
    spacerOnTopOfMenu.style.height = 0.05*menuBack.getBoundingClientRect().height+"px"
    spacerOnTopOfMenu.style.width = "100%"
    spacerOnTopOfMenu.style.position = "flex"
    spacerOnTopOfMenu.id = "menu-board-spacer"
    spacerOnTopOfMenu.style.backgroundColor = "blue"
    spacerOnTopOfMenu.style.overflow = "visible"
    spacerOnTopOfMenu.style.visibility = 'hidden'
    // menuBack.appendChild(spacerOnTopOfMenu);


    menu = document.createElement("div");
    menu.style.position = "absolute"
    menu.id = "menu-board"
    menu.style.overflow = "visible"
    menu.style.top = "10%"
    menu.style.height = "70%"
    // menu.style.left = "50%"
    // menu.style.transform = "translateX(-50%)"
    menuBack.appendChild(menu);


    boardImage =  document.createElement("img");
    boardImage.src = "/img/fascist_back_56.png"
    boardImage.style.height = "100%";
    boardImage.style.width = "auto";


    menu.appendChild(boardImage)

    for(let i = 0; i<sliders.length; i++){
        let slider = document.createElement('div')
        sliders[i] = slider;
        menu.appendChild(slider)
        slider.style.width = "11.6%"
        slider.style.height = "52%"
        slider.style.left = 8.3 + 14.3*i+"%"
        slider.style.top = "24%"
        slider.style.position = "absolute"
        slider.style.backgroundColor = "blue"
    }

    // console.log("sliders: "+ sliders)

    


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
        {duration: 1500, delay: 500, easing: "ease-out"},
    )
    let animationOpenMenu = new Animation(keyframeEffect, document.timeline);
    animationOpenMenu.addEventListener('finish', ()=>{
        menuBack.style.width = '90%'
        menuBack.style.opacity = '100%'
        menuBack.style.overflow = "visible"
        addEventListenersToSliders();
    })

    keyframeEffect = new KeyframeEffect(
        menu,
        [
            { transform: "translateX(0%)", left: "0%"},
            { transform: "translateX(-50%)", left: "50%"}                ],
        {duration: 2000, delay: 000, easing: "ease-out"},
    )
    let menuSlideIntoPlace = new Animation(keyframeEffect, document.timeline);
    menuSlideIntoPlace.addEventListener('finish', ()=>{
        menu.style.transform = "translateX(-50%)"
        menu.style.left = "50%"
    })

    animationBlackOutFadeIn.play(); // blacks out anything that isn't the board creation menu
    animationOpenMenu.play()
    menuSlideIntoPlace.play();

    // console.log(body.style.height);
}

const addEventListenersToSliders = ()=> {
    for(let i = 0; i<sliders.length; i++){
        sliders[i].addEventListener('mouseenter', () => {
            console.log("entered: " +i)
            if(sliderIntervals[i] !== null){
                clearInterval(sliderIntervals[i])
            }

            let sliderInterval = setInterval(() => {
                let sliderHeight = parseFloat(sliders[i].style.height.substring(0, sliders[i].style.height.length-1))
                console.log(sliderHeight)
                if(sliderHeight >= maxSliderLength){
                    sliders[i].style.height = maxSliderLength+"%"
                    console.log("clearing")
                    clearInterval(sliderInterval)
                } else {
                    sliderHeight += sliderRefreshDuration * sliderSpeed
                    sliders[i].style.height = sliderHeight+"%"
                }
            }, sliderRefreshDuration);

            sliderIntervals[i] = sliderInterval
        })
        sliders[i].addEventListener('mouseleave', () => {
            console.log("left: " +i)
            if(sliderIntervals[i] !== null){
                clearInterval(sliderIntervals[i])
            }

            let sliderInterval = setInterval(() => {
                let sliderHeight = parseFloat(sliders[i].style.height.substring(0, sliders[i].style.height.length-1))
                console.log(sliderHeight)
                if(sliderHeight <= minSliderLength){
                    sliders[i].style.height = minSliderLength+"%"
                    console.log("clearing")
                    clearInterval(sliderInterval)
                } else {
                    sliderHeight -= sliderRefreshDuration * sliderSpeed
                    sliders[i].style.height = sliderHeight+"%"
                }
            }, sliderRefreshDuration);

            sliderIntervals[i] = sliderInterval
        })
    }
}

makeBoardCreationMenu();