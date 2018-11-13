const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const { lstatSync, readdirSync } = require("fs");
const path = require("path");
const readChunk = require("read-chunk");
const fileType = require("file-type");
var os = require("os");

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory);

let main_menu;

let main_menu_renderer;

let gameWindow;

app.on("ready", open_main_menu);

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

ipcMain.on("game:type-select", (event, deckName) => {
  const options = {
    type: "info",
    title: "Game type",
    message: "Do you want to reverse the cards?",
    buttons: ["Yes", "No"]
  };

  dialog.showMessageBox(options, index => {
    if (index === 0) {
      startGame(deckName, true);
    } else {
      startGame(deckName, false);
    }
  });
});

function open_main_menu() {
  const iconPath = path.join(__dirname, "iconJPG");

  main_menu = new BrowserWindow({
    width: 400,
    height: 600,
    title: "Create Deck"
  });

  const mainMenuPath = path.join(__dirname, "mainMenu", "mainMenu.html");
  main_menu.loadFile(mainMenuPath);

  main_menu.on("close", () => {
    main_menu = app.exit();
  });
}

function startGame(deckName, reverse) {
  gameWindow = new BrowserWindow({ width: 750, height: 800, title: deckName });
  gameWindow.on("close", () => {
    gameWindow = null;
  });

  const gamePath = path.join(__dirname, "game", "game.html");
  gameWindow.loadFile(gamePath);

  gameWindow.webContents.on("did-finish-load", () => {
    const cards = getCards(deckName);
    gameWindow.webContents.send("start", cards, reverse);
  });
}

function getDeckName(deck) {
  if (os.platform() === "darwin") {
    let deckName = deck.split("/");
    return deckName[deckName.length - 1];
  } else {
    let deckName = deck.split("\\");
    return deckName[deckName.length - 1];
  }
}

function getCards(deckName) {
  const deckPath = path.join(__dirname, "decks", deckName);
  let cards = [];

  const files = readdirSync(deckPath);

  for (i = 0; i < files.length; ++i) {
    let filePath = path.join(deckPath, files[i]);
    const buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);

    const type = fileType(buffer);
    if (type === null) {
      continue;
    } else if (type.ext === "png" || type.ext === "jpg") {
      cards.push({
        path: filePath,
        name: files[i].split(".")[0]
      });
    }
  }

  return cards;
}
