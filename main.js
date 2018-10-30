const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

let main_menu;

function open_main_menu() {
  main_menu = new BrowserWindow({
    width: 400,
    height: 600,
    title: "Create Deck"
  });

  main_menu.loadFile("main_menu.html");

  main_menu.on("close", () => {
    main_menu = app.exit();
  });
}

ipcMain.on("deck_name:create", (event, deck_name) => {
  const decks_path = path.join(__dirname, "decks", deck_name);
  fs.mkdir(decks_path, { recursive: true }, error => {
    if (error) {
      if (error.code === "EEXIST") {
        event.sender.send("alert", "Deck already exists");
      } else {
        event.sender.send("alert", error.message);
      }
    } else {
      event.sender.getOwnerBrowserWindow().close();
    }
  });
});

app.on("ready", open_main_menu);
