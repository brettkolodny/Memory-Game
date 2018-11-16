import { app, BrowserWindow, ipcMain, dialog } from "electron";

const fs = require("fs");
const { lstatSync, readdirSync } = require("fs");
const path = require("path");
const readChunk = require("read-chunk");
const fileType = require("file-type");
const os = require("os");

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory);

let main_menu: BrowserWindow;

let main_menu_renderer: any;

let gameWindow: BrowserWindow;

app.on("ready", openMainMenu);

ipcMain.on("decks:get", event => {
  const decksPath = path.join(__dirname, "decks");

  let decks = getDirectories(decksPath);

  for (let i in decks) {
    decks[i] = getDeckName(decks[i]);
  }

  if (main_menu_renderer === undefined) {
    main_menu_renderer = event.sender;
  }

  main_menu_renderer.send("decks:update", decks);
});

ipcMain.on("deck_name:create", (event, deckName: string) => {
  const decks_path = path.join(__dirname, "decks", deckName);
  fs.mkdir(decks_path, { recursive: 1 }, error => {
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

function openMainMenu() {
  main_menu = new BrowserWindow({
    width: 400,
    height: 600,
    title: "Create Deck"
  });

  const mainMenuPath: string = path.join(
    __dirname,
    "mainMenu",
    "mainMenu.html"
  );
  main_menu.loadFile(mainMenuPath);

  main_menu.on("close", () => {
    app.exit();
  });
}

function startGame(deckName: string, reverse: boolean) {
  gameWindow = new BrowserWindow({ width: 750, height: 800, title: deckName });
  gameWindow.on("close", () => {
    gameWindow = null;
  });

  const gamePath: string = path.join(__dirname, "game", "game.html");
  gameWindow.loadFile(gamePath);

  gameWindow.webContents.on("did-finish-load", () => {
    const cards: string[] = getCards(deckName);
    gameWindow.webContents.send("start", cards, reverse);
  });
}

function getDeckName(deck: string) {
  if (os.platform() === "darwin") {
    let deckName = deck.split("/");
    return deckName[deckName.length - 1];
  } else {
    let deckName = deck.split("\\");
    return deckName[deckName.length - 1];
  }
}

function getCards(deckName: string) {
  const deckPath = path.join(__dirname, "decks", deckName);
  let cards = [];

  const files = readdirSync(deckPath);

  for (let i in files) {
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
