function togglePopup(){
    document.getElementById("popup-1").classList.toggle("active");
    console.log("popup button pressed");
  }
  document.querySelector("#open popup").addEventListener("click", togglePopup);