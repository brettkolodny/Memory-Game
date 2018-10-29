const { app, BrowserWindow } = require("electron");
const path = require("path");

let main_menu;

createDeckBtn.addEventListener("click", event => {
  alert("Pressed");
});

function open_main_menu() {
  main_menu = new BrowserWindow({ width: 400, height: 600 });
  main_menu.loadFile("main_menu.html");
  main_menu.on("close", () => {
    main_menu = app.exit;
  });
  const createDeckBtn = document.getElementById("create-deck");
}

app.on("ready", open_main_menu);
