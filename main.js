/**
 * Created by ricardomendes on 11/12/15.
 */
var src = process.cwd() + '/app/';
var config = require(src + 'config/config');

var log = require(src + 'log/log')(module);
var port = config.get('serverWebSocket:port') || 4000;
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

var locallydb = require('locallydb');
var db = new locallydb(src + 'db');

global.collection = db.collection('links');
global.alertIcon = src + 'images/alert.png';
global.app = app;

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

/**
 * Quit when all windows are closed.
 */
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

/**
 * On ready
 *
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 */
app.on('ready', function () {
    var iconPath = src + '/images/Icon.png';
    var electronScreen = require('screen');
    var cachedBounds;

    appTry = new Tray(iconPath);
    appTry.setToolTip("youTubePlayer");
    appTry.on('click', clicked);

    createWindow(false);

    /**
     * Create Window
     * @param show
     * @param x
     * @param y
     */
    function createWindow(show, x, y) {
        mainWindow = new BrowserWindow({
            show: show,
            width: 340,
            height: 600,
            resizable: false,
            frame: false,
            'always-on-top': true,
            'web-preferences': {
                'web-security': true,
                'plugins': true,
                'overlay-fullscreen-video': true
            }
        });

        if (show) {
            mainWindow.setPosition(x, y);
        }

        mainWindow.loadURL('http://' + host + ':' + port);

        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    }

    /**
     * Click on Trigger
     * @param e
     * @param bounds
     * @returns {*}
     */
    function clicked(e, bounds) {
        if (mainWindow && mainWindow.isVisible()) {
            return hideWindow();
        } else {
            var size = electronScreen.getDisplayNearestPoint(electronScreen.getCursorScreenPoint()).workArea;

            if (bounds){
                cachedBounds = bounds;
            } else{
                bounds = {x: size.width + size.x - (340 / 2), y: 0};
                cachedBounds = bounds;
            }
            return showWindow(bounds);
        }
    }

    /**
     * Show Window
     * @param triggerPos
     */
    function showWindow(triggerPos) {
        var x = Math.floor(triggerPos.x - 340 + triggerPos.width);
        var y = triggerPos.y;

        if (!mainWindow) {
            createWindow(true, x, y)
        } else {
            mainWindow.show();
            //mainWindow.openDevTools();
            mainWindow.setPosition(x, y);
        }
    }

    /**
     * Hide Window
     */
    function hideWindow() {
        if (!mainWindow) return;
        mainWindow.hide();
    }
});

webapp.use('/vendor', express.static(src + 'vendor'));
webapp.use('/stylesheets', express.static(src + 'stylesheets'));
webapp.use('/scripts', express.static(src + 'scripts'));
webapp.use('/images', express.static(src + 'images'));

webapp.get('/', function (req, res) {
    res.sendFile(src + 'index.html');
});

var server = http.listen(port, function () {
    log.info('Express server listening at http://%s:%s', host, port);
    console.log('Express server listening at http://%s:%s', host, port);
});