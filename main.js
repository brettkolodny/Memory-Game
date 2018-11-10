const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const { lstatSync, readdirSync } = require("fs");
const path = require("path");
const detect = require("detect-file-type");

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory);

let main_menu;

let main_menu_renderer;

let gameWindow;

let currentCards;

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

ipcMain.on("decks:get", event => {
  const decksPath = path.join(__dirname, "decks");

  let decks = getDirectories(decksPath);

  for (i = 0; i < decks.length; ++i) {
    decks[i] = getDeckName(decks[i]);
  }

  if (main_menu_renderer === undefined) {
    main_menu_renderer = event.sender;
  }

  main_menu_renderer.send("decks:update", decks);
});

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

ipcMain.on("game:start", (event, deckName) => {
  gameWindow = new BrowserWindow({ width: 750, height: 750, title: deckName });

  gameWindow.on("close", () => {
    gameWindow = null;
  });

  gameWindow.loadFile("game.html");
  const cards = getCards(deckName);
  gameWindow.webContents.send("start", cards);
});

function getDeckName(deck) {
  let deckName = deck.split("/");
  return deckName[deckName.length - 1];
}

function getCards(deckName) {
  const deckPath = path.join(__dirname, "decks", deckName);
  let cards = [];

  readdirSync(deckPath).forEach(file => {
    const filePath = path.join(deckPath, file);
    detect.fromFile(filePath, (err, result) => {
      if (result === null) {
        return;
      }
      const fileType = result.ext;
      if (fileType === "png" || fileType === "jpg") {
        cards.push(filePath);
      }
    });
  });

  console.log(cards);
}

app.on("ready", open_main_menu);
