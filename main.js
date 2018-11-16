"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var fs = require("fs");
var _a = require("fs"), lstatSync = _a.lstatSync, readdirSync = _a.readdirSync;
var path = require("path");
var readChunk = require("read-chunk");
var fileType = require("file-type");
var os = require("os");
var isDirectory = function (source) { return lstatSync(source).isDirectory(); };
var getDirectories = function (source) {
    return readdirSync(source)
        .map(function (name) { return path.join(source, name); })
        .filter(isDirectory);
};
var main_menu;
var main_menu_renderer;
var gameWindow;
electron_1.app.on("ready", openMainMenu);
electron_1.ipcMain.on("decks:get", function (event) {
    var decksPath = path.join(__dirname, "decks");
    var decks = getDirectories(decksPath);
    for (var i in decks) {
        decks[i] = getDeckName(decks[i]);
    }
    if (main_menu_renderer === undefined) {
        main_menu_renderer = event.sender;
    }
    main_menu_renderer.send("decks:update", decks);
});
electron_1.ipcMain.on("deck_name:create", function (event, deckName) {
    var decks_path = path.join(__dirname, "decks", deckName);
    fs.mkdir(decks_path, { recursive: 1 }, function (error) {
        if (error) {
            if (error.code === "EEXIST") {
                event.sender.send("alert", "Deck already exists");
            }
            else {
                event.sender.send("alert", error.message);
            }
        }
        else {
            event.sender.getOwnerBrowserWindow().close();
        }
    });
});
electron_1.ipcMain.on("game:type-select", function (event, deckName) {
    var options = {
        type: "info",
        title: "Game type",
        message: "Do you want to reverse the cards?",
        buttons: ["Yes", "No"]
    };
    electron_1.dialog.showMessageBox(options, function (index) {
        if (index === 0) {
            startGame(deckName, true);
        }
        else {
            startGame(deckName, false);
        }
    });
});
function openMainMenu() {
    main_menu = new electron_1.BrowserWindow({
        width: 400,
        height: 600,
        title: "Create Deck"
    });
    var mainMenuPath = path.join(__dirname, "mainMenu", "mainMenu.html");
    main_menu.loadFile(mainMenuPath);
    main_menu.on("close", function () {
        electron_1.app.exit();
    });
}
function startGame(deckName, reverse) {
    gameWindow = new electron_1.BrowserWindow({ width: 750, height: 800, title: deckName });
    gameWindow.on("close", function () {
        gameWindow = null;
    });
    var gamePath = path.join(__dirname, "game", "game.html");
    gameWindow.loadFile(gamePath);
    gameWindow.webContents.on("did-finish-load", function () {
        var cards = getCards(deckName);
        gameWindow.webContents.send("start", cards, reverse);
    });
}
function getDeckName(deck) {
    if (os.platform() === "darwin") {
        var deckName = deck.split("/");
        return deckName[deckName.length - 1];
    }
    else {
        var deckName = deck.split("\\");
        return deckName[deckName.length - 1];
    }
}
function getCards(deckName) {
    var deckPath = path.join(__dirname, "decks", deckName);
    var cards = [];
    var files = readdirSync(deckPath);
    for (var i in files) {
        var filePath = path.join(deckPath, files[i]);
        var buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);
        var type = fileType(buffer);
        if (type === null) {
            continue;
        }
        else if (type.ext === "png" || type.ext === "jpg") {
            cards.push({
                path: filePath,
                name: files[i].split(".")[0]
            });
        }
    }
    return cards;
}
