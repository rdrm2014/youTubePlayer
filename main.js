/**
 * Created by ricardomendes on 11/12/15.
 */
var src = process.cwd() + '/app/';
var config = require(src + 'config/config');

var log = require(src + 'log/log')(module);
var port = config.get('serverWebSocket:port') || 3000;
var host = config.get('serverWebSocket:ipaddr') || '127.0.0.1';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

// Report crashes to our server.
electron.crashReporter.start();

var Tray = require('tray');
var events = require('events');
var fs = require('fs');
var clipboard = require('clipboard');

var express = require('express');
var webapp = express();
var http = require('http').Server(webapp);

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
    var iconPath = src + '/images/Icon.png';

    appTry = new Tray(iconPath);
    appTry.setToolTip("Youtube Music Player");
    appTry.on('click', clicked);

    createWindow(0, 0);

    function createWindow(x, y) {
        mainWindow = new BrowserWindow({
            show: true,
            width: 800,
            height: 600,
            resizable: false,
            frame: false,
            'always-on-top': false,
            'web-preferences': {
                'web-security': true,
                'plugins': true,
                'overlay-fullscreen-video': true
            }
        });
        mainWindow.setPosition(x, y);

        mainWindow.loadURL('http://' + host + ':' + port);

        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    }

    function clicked() {
        if (mainWindow && mainWindow.isVisible()) {
            return hideWindow();
        } else {
            return showWindow();
        }
    }

    function showWindow() {
        if (!mainWindow) {
            createWindow(0, 0)
        } else {
            mainWindow.show();
            mainWindow.setPosition(0, 0);
        }
    }

    function hideWindow() {
        if (!mainWindow) return;
        mainWindow.hide();
    }
});

webapp.get('/', function (req, res) {
    res.sendFile(__dirname + '/app/index.html');
});

var server = http.listen(port, function () {
    log.info('Express server listening at http://%s:%s', host, port);
    console.log('Express server listening at http://%s:%s', host, port);
});