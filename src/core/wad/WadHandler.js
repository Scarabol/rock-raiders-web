import { NerpParser } from '../nerp/Nerp';
import { BitmapFont } from '../BitmapFont';
import { createContext, createDummyImage } from '../ImageHelper';
import { CfgFileParser } from './CfgFileParser';

let wad0File = null;
let wad1File = null;

let assets = [
    ['wad0nerp', 'Levels', 'nerpnrn.h'], // included by other nrn scripts

    // ~images~
    // menu resources
    ['wad0bmp', 'Interface/FrontEnd/MenuBGpic.bmp'], // main menu background
    ['wad0font', 'Interface/FrontEnd/Menu_Font_LO.bmp'], // main menu font
    ['wad0font', 'Interface/FrontEnd/Menu_Font_HI.bmp'], // (highlighted) main menu font
    ['wad0font', 'Interface/Fonts/Font5_Hi.bmp'],
    ['wad0bmp', 'Interface/Frontend/LP_Normal.bmp'], // back button in level select view
    ['wad0bmp', 'Interface/Frontend/LP_Glow.bmp'], // back button in level select view (hovered)
    ['wad0bmp', 'Interface/Frontend/LP_Dull.bmp'], // back button in level select view (pressed)
    ['wad0alpha', 'Interface/Frontend/LowerPanel.bmp'], // lower panel in level select view
    ['wad0bmp', 'Interface/Frontend/SaveLoad.bmp'],

    // level images
    ['wad0bmp', 'Interface/LEVELPICKER/Levelpick.bmp'], // level select menu background
    ['wad0bmp', 'Interface/LEVELPICKER/LevelpickT.bmp'], // tutorial level select menu background

    // pointers/cursors
    ['wad0alpha', 'Interface/Pointers/Aclosed.bmp'],
];

let GameManager = { // FIXME refactor this
    images: {},
    configuration: {},
    maps: {},
    sounds: {},
    objectLists: {},
    nerps: [],
    nerpMessages: [],
    fonts: [],
};

function getImage(imageName) {
    if (!imageName || imageName.length === 0) {
        throw 'imageName must not be undefined, null or empty - was ' + imageName;
    } else {
        const lImageName = imageName.toLowerCase();
        if (!(lImageName in GameManager.images) || GameManager.images[lImageName] === undefined || GameManager.images[lImageName] === null) {
            console.error('Image \'' + imageName + '\' unknown! Using placeholder image instead');
            GameManager.images[lImageName] = createDummyImage(64, 64);
        }
        return GameManager.images[lImageName];
    }
}

/**
 * load a script asset from the input path, setting the callback function to the input callback
 * @param path: the path from which to load the script asset
 * @param callback: the callback function to be called once the script has finished loading
 */
function loadScriptAsset(path, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';

    if (callback != null) {
        script.onload = callback;
    }

    script.src = path;

    // begin loading the script by appending it to the document head
    document.getElementsByTagName('head')[0].appendChild(script);
}

/**
 * load an image asset from the input path, setting the callback function to the input callback
 * @param path: the path from which to load the image asset
 * @param name: the name that should be used when referencing the image in the GameManager images dict
 * @param callback: the callback function to be called once the image has finished loading
 */
function loadImageAsset(path, name, callback) {
    const img = new Image();

    img.onload = function () {
        const context = createContext(img.naturalWidth, img.naturalHeight, false);
        context.drawImage(img, 0, 0);
        GameManager.images[name.toLowerCase()] = context;
        URL.revokeObjectURL(img.src);
        if (callback != null) {
            callback();
        }
    };

    img.src = path;
}

function loadWadImageAsset(name, callback) {
    loadImageAsset(wad0File.getEntry(name), name, callback);
}

/**
 * Adds an alpha channel to the bitmap by setting alpha to 0 for all black pixels
 * @param name
 * @param callback
 */
function loadAlphaImageAsset(name, callback) {
    const img = new Image();

    img.onload = function () {
        const context = createContext(img.naturalWidth, img.naturalHeight, false);
        context.drawImage(img, 0, 0);
        const imgData = context.getImageData(0, 0, context.width, context.height);
        for (let n = 0; n < imgData.data.length; n += 4) {
            if (imgData.data[n] <= 2 && imgData.data[n + 1] <= 2 && imgData.data[n + 2] <= 2) { // Interface/Reward/RSoxygen.bmp uses 2/2/2 as "black" alpha background
                imgData.data[n + 3] = 0;
            }
        }
        context.putImageData(imgData, 0, 0);
        GameManager.images[name.toLowerCase()] = context;
        URL.revokeObjectURL(img.src);
        if (callback != null) {
            callback();
        }
    };

    img.src = wad0File.getEntry(name.toLowerCase());
}

/**
 * Adds an alpha channel to the image by setting alpha to 0 for all pixels, which have the same color as the pixel at position 0,0
 * @param name
 * @param callback
 */
function loadFontImageAsset(name, callback) {
    const img = new Image();

    img.onload = function () {
        const context = createContext(img.naturalWidth, img.naturalHeight, false);
        context.drawImage(img, 0, 0);
        const imgData = context.getImageData(0, 0, context.width, context.height);
        for (let n = 0; n < imgData.data.length; n += 4) {
            if (imgData.data[n] === imgData.data[0] && imgData.data[n + 1] === imgData.data[1] && imgData.data[n + 2] === imgData.data[2]) {
                imgData.data[n + 3] = 0;
            }
        }
        context.putImageData(imgData, 0, 0);
        GameManager.fonts[name.toLowerCase()] = new BitmapFont(context);
        URL.revokeObjectURL(img.src);
        if (callback != null) {
            callback();
        }
    };

    img.src = wad0File.getEntry(name);
}

function encodeChar(charCode) { // encoding of the original files still remains a mystery
    if (charCode === 130) {
        return 'ä'.charCodeAt(0);
    } else if (charCode === 142) {
        return 'Ä'.charCodeAt(0);
    } else if (charCode === 162) {
        return 'ö'.charCodeAt(0);
    } else if (charCode === 167) {
        return 'Ü'.charCodeAt(0);
    } else if (charCode === 171) {
        return 'ü'.charCodeAt(0);
    } else if (charCode === 195) {
        return 'ß'.charCodeAt(0);
    }
    return charCode;
}

function loadNerpAsset(name, callback) {
    name = name.replace(/.npl$/, '.nrn');
    const buffer = wad0File.getEntryData(name);
    const script = String.fromCharCode.apply(String, buffer);
    GameManager.nerps[name] = NerpParser(script, GameManager.nerps);
    if (callback != null) {
        callback();
    }
}

function numericNameToNumber(name) {
    if (name === undefined) {
        throw 'Numeric name must not be undefined';
    }
    const digits = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
    const specials = {
        ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
        sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    };
    const tens = { twenty: 20, thirty: 30, forty: 40 };
    let number = specials[name] || digits[name];
    if (number === undefined) {
        Object.keys(tens).forEach(ten => {
            if (name.startsWith(ten)) {
                const digitName = name.replace(ten, '');
                number = tens[ten] + (digitName ? digits[digitName] : 0);
            }
        });
    }
    if (number === undefined) {
        throw 'Found unexpected numeric name ' + name;
    }
    return number;
}

function parseNerpMsgFile(wadFile, name) {
    const result = [];
    const lines = String.fromCharCode.apply(String, wadFile.getEntryData(name).map(c => encodeChar(c))).split('\n');
    for (let c = 0; c < lines.length; c++) {
        const line = lines[c].trim();
        if (line.length < 1 || line === '-') {
            continue;
        }
        // line formatting differs between wad0 and wad1 files!
        const txt0Match = line.match(/\\\[([^\\]+)\\](\s*#([^#]+)#)?/);
        const txt1Match = line.match(/^([^$][^#]+)(\s*#([^#]+)#)?/);
        const sndMatch = line.match(/\$([^\s]+)\s*([^\s]+)/);
        if (wadFile === wad0File && txt0Match) {
            const index = txt0Match[3] !== undefined ? numericNameToNumber(txt0Match[3]) : c; // THIS IS MADNESS! #number# at the end of line is OPTIONAL
            result[index] = result[index] || {};
            result[index].txt = txt0Match[1];
        } else if (wadFile === wad1File && txt1Match) {
            const index = txt1Match[3] !== undefined ? numericNameToNumber(txt1Match[3]) : c; // THIS IS MADNESS! #number# at the end of line is OPTIONAL
            result[index] = result[index] || {};
            result[index].txt = txt1Match[1].replace(/_/g, ' ').trim();
        } else if (sndMatch && sndMatch.length === 3) {
            const index = numericNameToNumber(sndMatch[1]);
            result[index] = result[index] || {};
            result[index].snd = sndMatch[2].replace(/\\/g, '/');
        } else {
            throw 'Line in nerps message file did not match anything';
        }
    }
    return result;
}

function loadNerpMsg(name, callback) {
    const result = parseNerpMsgFile(wad0File, name);
    const msg1 = parseNerpMsgFile(wad1File, name);
    for (let c = 0; c < msg1.length; c++) {
        const m1 = msg1[c];
        if (!m1) continue;
        if (m1.txt) {
            result[c].txt = m1.txt;
        }
        if (m1.snd) {
            result[c].snd = m1.snd;
        }
    }
    GameManager.nerpMessages[name] = result;
    if (callback) {
        callback();
    }
}

function loadMapAsset(name, callback) {
    const buffer = wad0File.getEntryData(name);
    if (buffer.length < 13 || String.fromCharCode.apply(String, buffer.slice(0, 3)) !== 'MAP') {
        console.log('Invalid map data provided');
        return;
    }
    const map = { width: buffer[8], height: buffer[12], level: [] };
    let row = [];
    for (let seek = 16; seek < buffer.length; seek += 2) {
        row.push(buffer[seek]);
        if (row.length >= map.width) {
            map.level.push(row);
            row = [];
        }
    }
    GameManager.maps[name] = map;
    if (callback) {
        callback();
    }
}

function loadObjectListAsset(name, callback) {
    const buffer = wad0File.getEntryData(name);
    const lines = String.fromCharCode.apply(String, buffer).split('\n');
    GameManager.objectLists[name] = [];
    let currentObject = null;
    for (let c = 0; c < lines.length; c++) {
        const line = lines[c].trim();
        const objectStartMatch = line.match(/(.+)\s+{/);
        const drivingMatch = line.match(/driving\s+(.+)/);
        if (line.length < 1 || line.startsWith(';') || line.startsWith('Lego*')) {
            // ignore empty lines, comments and the root object
        } else if (objectStartMatch) {
            currentObject = {};
            GameManager.objectLists[name][objectStartMatch[1]] = currentObject;
        } else if (line === '}') {
            currentObject = null;
        } else if (drivingMatch) {
            currentObject.driving = drivingMatch[1];
        } else {
            const split = line.split(/\s+/);
            if (split.length !== 2 || currentObject === null) {
                throw 'Unexpected key value entry: ' + line;
            }
            const key = split[0];
            let val = split[1];
            if (key === 'xPos' || key === 'yPos' || key === 'heading') {
                val = parseFloat(val);
            } else if (key !== 'type') {
                throw 'Unexpected key value entry: ' + line;
            }
            currentObject[key] = val;
        }
    }
    if (callback) {
        callback();
    }
}

/**
 * load a sound asset from the input path, setting the callback function to the input callback
 * @param path: the path from which to load the sound asset
 * @param name: the name that should be used when referencing the sound in the GameManager sounds dict
 * @param callback:  the callback function to be called once the sound has finished loading
 */
function loadSoundAsset(path, name, callback) {
    const snd = document.createElement('audio');
    let srcType = '.ogg';
    // use ogg if supported, otherwise fall back to mp4 (cover all modern browsers)
    if (!(snd.canPlayType && snd.canPlayType('audio/ogg'))) {
        srcType = '.m4a';
    }

    if (callback != null) {
        snd.oncanplay = function () {
            snd.oncanplay = null; // otherwise the callback is triggered multiple times
            GameManager.sounds[name] = snd;
            callback();
        };
    }

    snd.src = path + srcType;
}

/**
 * Load a WAV file format sound asset from the WAD file.
 * @param path Path inside the WAD file
 * @param callback A callback that is triggered after the file has been loaded
 * @param key Optional key to store the sound, should look like SND_pilotdrill
 */
function loadWavAsset(path, callback, key) {
    const snd = document.createElement('audio');
    snd.keyname = key; // can be used to identify the sound later
    if (callback != null) {
        snd.oncanplay = function () {
            snd.oncanplay = null; // otherwise the callback is triggered multiple times
            const keyPath = key || path;
            // use array, because sounds have multiple variants sometimes
            GameManager.sounds[keyPath] = GameManager.sounds[keyPath] || [];
            GameManager.sounds[keyPath].push(snd);
            callback();
        };
    }
    // try (localized) wad1 file first, then use generic wad0 file
    try {
        snd.src = wad1File.getEntry(path);
    } catch (e) {
        snd.src = wad0File.getEntry(path);
    }
}

function updateLoadingScreen() {
    updateLoadingScreen.totalResources = updateLoadingScreen.totalResources || 1;
    updateLoadingScreen.curResource = updateLoadingScreen.curResource || 0;
    const ctx = loadingCanvas.getContext('2d');
    const loadingImg = getImage(GameManager.configuration['Lego*']['Main']['LoadScreen']).canvas;
    const screenZoom = ctx.canvas.width / loadingImg.width;
    const loadingBarX = 142 * screenZoom;
    const loadingBarY = 450 * screenZoom;
    const loadingBarWidth = 353 * updateLoadingScreen.curResource / updateLoadingScreen.totalResources * screenZoom;
    const loadingBarHeight = 9 * screenZoom;
    ctx.drawImage(loadingImg, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(getImage(GameManager.configuration['Lego*']['Main']['ProgressBar']).canvas, loadingBarX, loadingBarY, loadingBarWidth, loadingBarHeight);
}

function onAssetLoaded(callback) {
    return () => {
        updateLoadingScreen.curResource++;
        updateLoadingScreen();
        callback();
    };
}

/**
 * load in essential files, to begin the chain of asset loading
 */
function startLoadingProcess() {
    startLoadingProcess.startTime = new Date();
    startLoadingProcess.assetsFromCfgByName = {};
    setLoadingMessage('Loading configuration...');
    new Promise((resolve) => {
        new CfgFileParser().parse(wad1File.getEntryData('Lego.cfg'), (result) => {
            GameManager.configuration = result;
            resolve();
        });
    }).then(loadLoadingScreen);
}

/**
 * Load loading screen files, which are read from configuration
 */
function loadLoadingScreen() { // loading screen resources
    Promise.all([
        new Promise((resolve) => {
            const name = GameManager.configuration['Lego*']['Main']['LoadScreen']; // loading screen image
            loadWadImageAsset(name, () => {
                updateLoadingScreen();
                resolve();
            });
        }),
        new Promise((resolve) => {
            const name = GameManager.configuration['Lego*']['Main']['ProgressBar']; // loading bar container image
            loadWadImageAsset(name, resolve);
        }),
    ]).then(registerAllAssets);
}

function addAsset(method, assetPath, optional = false, assetKey = null) {
    if (!assetPath || startLoadingProcess.assetsFromCfgByName.hasOwnProperty(assetPath.toLowerCase()) || assetPath === 'NULL') {
        return; // do not load assets twice
    }
    startLoadingProcess.assetsFromCfgByName[assetKey || assetPath] = {
        method: method,
        assetKey: assetKey,
        assetPath: assetPath,
        optional: optional,
    };
}

function registerAllAssets() {
    // register static assets from asset.js
    const sequentialAssetsByName = {};
    assets.forEach((curAsset) => {
        const assetName = curAsset[curAsset.length - 1].toLowerCase();
        if (sequentialAssetsByName.hasOwnProperty(assetName)) {
            console.log('Duplicate entry for ' + assetName + ' in assets');
            return;
        }
        sequentialAssetsByName[assetName] = curAsset;
    });
    registerAllAssets.sequentialAssets = Object.values(sequentialAssetsByName);
    // dynamically register assets from config
    const mainConf = GameManager.configuration['Lego*'];
    // back button
    addAsset(loadWadImageAsset, mainConf['InterfaceBackButton'].slice(2, 4).forEach(imgPath => {
        addAsset(loadWadImageAsset, imgPath);
    }));
    addAsset(loadFontImageAsset, 'Interface/Fonts/ToolTipFont.bmp');
    // crystal side bar
    addAsset(loadAlphaImageAsset, 'Interface/RightPanel/CrystalSideBar.bmp'); // right side overlay showing crystal and ore count
    addAsset(loadAlphaImageAsset, 'Interface/RightPanel/CrystalSideBar_Ore.bmp'); // image representing a single piece of ore on the overlay
    addAsset(loadAlphaImageAsset, 'Interface/RightPanel/NoSmallCrystal.bmp'); // image representing no energy crystal on the overlay
    addAsset(loadAlphaImageAsset, 'Interface/RightPanel/SmallCrystal.bmp'); // image representing a single energy crystal on the overlay
    addAsset(loadAlphaImageAsset, 'Interface/RightPanel/UsedCrystal.bmp'); // image representing a single in use energy crystal on the overlay
    // level files
    Object.keys(mainConf['Levels']).forEach(levelKey => {
        if (!(levelKey.startsWith('Tutorial') || levelKey.startsWith('Level'))) {
            return; // ignore incomplete test levels and duplicates
        }
        const levelConf = mainConf['Levels'][levelKey];
        addAsset(loadMapAsset, levelConf['SurfaceMap']);
        addAsset(loadMapAsset, levelConf['PreDugMap']);
        addAsset(loadMapAsset, levelConf['TerrainMap']);
        addAsset(loadMapAsset, levelConf['BlockPointersMap'], true);
        addAsset(loadMapAsset, levelConf['CryOreMap']);
        addAsset(loadMapAsset, levelConf['PathMap'], true);
        addAsset(loadObjectListAsset, levelConf['OListFile']);
        addAsset(loadNerpAsset, levelConf['NERPFile']);
        addAsset(loadNerpMsg, levelConf['NERPMessageFile']);
        const menuConf = levelConf['MenuBMP'];
        if (menuConf) {
            menuConf.forEach((imgKey) => {
                addAsset(loadAlphaImageAsset, imgKey);
            });
        }
    });
    // reward screen
    const rewardConf = mainConf['Reward'];
    addAsset(loadWadImageAsset, rewardConf['Wallpaper']);
    addAsset(loadFontImageAsset, rewardConf['BackFont']);
    Object.values(rewardConf['Fonts']).forEach(imgPath => {
        addAsset(loadFontImageAsset, imgPath);
    });
    Object.values(rewardConf['Images']).forEach(img => {
        addAsset(loadAlphaImageAsset, img[0]);
    });
    Object.values(rewardConf['BoxImages']).forEach(img => {
        addAsset(loadWadImageAsset, img[0]);
    });
    rewardConf['SaveButton'].slice(0, 4).forEach(imgPath => {
        addAsset(loadWadImageAsset, imgPath);
    });
    rewardConf['AdvanceButton'].slice(0, 4).forEach(imgPath => {
        addAsset(loadWadImageAsset, imgPath);
    });
    // icon panel buttons
    Object.values(mainConf['InterfaceImages']).forEach(entry => {
        entry.slice(0, 3).forEach(imgPath => {
            addAsset(loadWadImageAsset, imgPath);
        });
    });
    Object.values(mainConf['InterfaceBuildImages']).forEach(entry => {
        entry.slice(0, -1).forEach(imgPath => {
            addAsset(loadWadImageAsset, imgPath);
        });
    });
    Object.values(mainConf['InterfaceSurroundImages']).forEach(entry => {
        addAsset(loadAlphaImageAsset, entry[0]);
        addAsset(loadAlphaImageAsset, entry[5]);
    });
    // spaces
    wad0File.filterEntryNames('World/WorldTextures/IceSplit/Ice..\\.bmp').forEach(imgPath => {
        addAsset(loadWadImageAsset, imgPath);
    });
    wad0File.filterEntryNames('World/WorldTextures/LavaSplit/Lava..\\.bmp').forEach(imgPath => {
        addAsset(loadWadImageAsset, imgPath);
    });
    wad0File.filterEntryNames('World/WorldTextures/RockSplit/Rock..\\.bmp').forEach(imgPath => {
        addAsset(loadWadImageAsset, imgPath);
    });
    // pause screen
    const pauseConf = mainConf['Menu']['PausedMenu'];
    addAsset(loadAlphaImageAsset, pauseConf['Menu1']['MenuImage'][0]);
    addAsset(loadFontImageAsset, pauseConf['Menu1']['MenuFont']);
    addAsset(loadFontImageAsset, pauseConf['Menu1']['HiFont']);
    addAsset(loadFontImageAsset, pauseConf['Menu1']['LoFont']);
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_OffBar.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_OnBar.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Leftcap.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Rightcap.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Plus.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Minus.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_PlusHi.bmp');
    addAsset(loadAlphaImageAsset, 'Interface/FrontEnd/Vol_MinusHi.bmp');
    // sounds
    const samplesConf = mainConf['Samples'];
    Object.keys(samplesConf).forEach(sndKey => {
        let sndPath = samplesConf[sndKey] + '.wav';
        if (sndKey.startsWith('!')) { // TODO no clue what this means... loop? duplicate?!
            sndKey = sndKey.slice(1);
        }
        if (sndPath.startsWith('*')) { // TODO no clue what this means... not loop, see telportup
            sndPath = sndPath.slice(1);
        } else if (sndPath.startsWith('@')) { // sound must be loaded from programm files folder, can't handle this case yet
            sndPath = sndPath.slice(1);
            return;
        }
        sndPath.split(',').forEach(sndPath => {
            addAsset(loadWavAsset, sndPath, false, sndKey, true);
        });
    });
    // start loading assets
    loadSequentialAssets.assetsFromCfg = Object.values(startLoadingProcess.assetsFromCfgByName);
    updateLoadingScreen.totalResources = registerAllAssets.sequentialAssets.length + loadSequentialAssets.assetsFromCfg.length;
    loadSequentialAssets.assetIndex = 0;
    loadSequentialAssets();
}

function onSequentialAssetLoaded() {
    loadSequentialAssets.assetIndex++;
    onAssetLoaded(loadSequentialAssets)();
}

function loadSequentialAssets() {
    if (loadSequentialAssets.assetIndex >= registerAllAssets.sequentialAssets.length) {
        loadAssetsParallel(); // continue with parallel loading all other assets
        return;
    }
    const curAsset = registerAllAssets.sequentialAssets[loadSequentialAssets.assetIndex];
    const assetName = curAsset[curAsset.length - 1];
    const filename = curAsset[1] !== '' ? curAsset[1] + '/' + curAsset[2] : curAsset[2];
    if (curAsset[0] === 'js') {
        loadScriptAsset(filename, onSequentialAssetLoaded);
    } else if (curAsset[0] === 'img') {
        loadImageAsset(filename, assetName, onSequentialAssetLoaded);
    } else if (curAsset[0] === 'snd') {
        loadSoundAsset(filename, assetName, onSequentialAssetLoaded);
    } else if (curAsset[0] === 'wad0bmp') {
        loadWadImageAsset(assetName, onSequentialAssetLoaded);
    } else if (curAsset[0] === 'wad0alpha') {
        loadAlphaImageAsset(assetName, onSequentialAssetLoaded);
    } else if (curAsset[0] === 'wad0font') {
        loadFontImageAsset(assetName, onSequentialAssetLoaded);
    } else if (curAsset[0] === 'wad0nerp') {
        loadNerpAsset(filename, onSequentialAssetLoaded);
    } else {
        throw 'Unknown key ' + curAsset[0] + ', can\'t load: ' + curAsset.join(', ');
    }
}

function loadAssetsParallel() {
    const promises = [];
    loadSequentialAssets.assetsFromCfg.forEach((asset) => {
        promises.push(new Promise((resolve) => {
            try {
                asset.method(asset.assetPath, onAssetLoaded(resolve), asset.assetKey);
            } catch (e) {
                if (!asset.optional) {
                    throw e;
                }
                onAssetLoaded(resolve)();
            }
        }));
    });
    Promise.all(promises).then(() => {
        // main game file (put last as this contains the main game loop)
        // loadScriptAsset('rockRaiders.js', () => {
        // indicate that loading has finished, and display the total loading time
        console.log('Loading of about ' + updateLoadingScreen.totalResources + ' assets complete! Total load time: ' + ((new Date().getTime() - startLoadingProcess.startTime.getTime()) / 1000).toFixed(2).toString() + ' seconds.');
        // remove globals used during loading phase so as not to clutter the memory, if even only by a small amount
        // delete object;
        // });
    });
}

/**
 * Read WAD file as binary blob from the given URL and parse it on success
 * @param url the url to the WAD file, can be local file url (file://...) too
 */
function loadWadFile(url) {
    return new Promise(resolve => {
        console.log('Loading wad file from ' + url);
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer'; // jQuery cant handle response type arraybuffer
        xhr.onload = function () {
            if (this.status === 200) {
                resolve(parseWadFile(this.response));
            }
        };
        xhr.send();
    });
}

/**
 * Validate and parse the given data object as binary blob of a WAD file
 * @param data binary blob
 * @returns {WadHandler} Returns a handler for this WAD file on success
 */
function parseWadFile(data) {
    const debug = true; // TODO refactor this
    const dataView = new DataView(data);
    const buffer = new Int8Array(data);
    let pos = 0;
    if (String.fromCharCode.apply(null, buffer.slice(pos, 4)) !== 'WWAD') {
        throw 'Invalid WAD0 file provided';
    }
    if (debug)
        console.log('WAD0 file seems legit');
    pos = 4;
    const numberOfEntries = dataView.getInt32(pos, true);
    if (debug)
        console.log(numberOfEntries);
    pos = 8;

    const wad = new WadHandler(buffer);

    let bufferStart = pos;
    for (let i = 0; i < numberOfEntries; pos++) {
        if (buffer[pos] === 0) {
            wad.entries[i] = String.fromCharCode.apply(null, buffer.slice(bufferStart, pos)).replace(/\\/g, '/').toLowerCase();
            bufferStart = pos + 1;
            i++;
        }
    }
    if (debug)
        console.log(wad.entries);
    for (let i = 0; i < numberOfEntries; pos++) {
        if (buffer[pos] === 0) {
            bufferStart = pos + 1;
            i++;
        }
    }
    if (debug)
        console.log('Offset after absolute original names is ' + pos);

    for (let i = 0; i < numberOfEntries; i++) {
        wad.fLength[i] = dataView.getInt32(pos + 8, true);
        wad.fStart[i] = dataView.getInt32(pos + 12, true);
        pos += 16;
    }
    if (debug) {
        console.log(wad.fLength);
        console.log(wad.fStart);
    }
    return wad;
}

/**
 * Returns the entries content by name extracted from the managed WAD file
 * @param entryName Entry name to be extracted
 * @returns {string} Returns the local object url to the extracted data
 */
WadHandler.prototype.getEntry = function (entryName) {
    const lEntryName = entryName.toLowerCase();
    for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i] === lEntryName) {
            return URL.createObjectURL(new Blob([this.buffer.slice(this.fStart[i], this.fStart[i] + this.fLength[i])], { 'type': 'image/bmp' }));
        }
    }
    throw 'Entry \'' + entryName + '\' not found in wad file';
};

WadHandler.prototype.getEntryData = function (entryName) {
    const lEntryName = entryName.toLowerCase();
    for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i] === lEntryName) {
            return new Uint8Array(this.buffer.slice(this.fStart[i], this.fStart[i] + this.fLength[i]));
        }
    }
    throw 'Entry \'' + entryName + '\' not found in wad file';
};

WadHandler.prototype.filterEntryNames = function (regexStr) {
    const regex = new RegExp(regexStr.toLowerCase());
    const result = [];
    for (let c = 0; c < this.entries.length; c++) {
        const entry = this.entries[c];
        if (entry.toLowerCase().match(regex)) {
            result.push(entry);
        }
    }
    return result;
};

/**
 * Handles the extraction of single files from a bigger WAD data blob
 * @param buffer A data blob which contains the raw data in one piece
 * @constructor
 */
function WadHandler(buffer) {
    this.buffer = buffer;
    this.entries = [];
    this.fLength = [];
    this.fStart = [];
}

/**
 * Private helper method, which combines file loading and waits for them to become ready before continuing
 * @param wad0Url Url to parse the LegoRR0.wad file from
 * @param wad1Url Url to parse the LegoRR1.wad file from
 */
function loadWadFiles(wad0Url, wad1Url) {
    // $('#wadfiles_select_modal').modal('hide'); // TODO emit some kind of event
    Promise.all([loadWadFile(wad0Url), loadWadFile(wad1Url)]).then(wadFiles => {
        wad0File = wadFiles[0];
        wad1File = wadFiles[1];
        storeFilesInCache();
        startLoadingProcess();
    });
}

function openLocalCache(onopen) {
    const request = indexedDB.open('RockRaidersRemake');
    let db = null;
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (db.objectStoreNames.contains('wadfiles')) {
            db.deleteObjectStore('wadfiles');
        }
        db.createObjectStore('wadfiles');
    };
    request.onsuccess = function (event) {
        db = db ? db : event.target.result;
        const transaction = db.transaction(['wadfiles'], 'readwrite');
        const objectStore = transaction.objectStore('wadfiles');
        onopen(objectStore);
    };
}

function storeFilesInCache() {
    openLocalCache((objectStore) => {
        objectStore.put(wad0File, 'wad0');
        objectStore.put(wad1File, 'wad1');
    });
}

function startWithCachedFiles(onerror) {
    const _onerror = () => {
        setLoadingMessage('WAD files not found in cache');
        onerror();
    };
    setLoadingMessage('Loading WAD files from cache...');
    openLocalCache((objectStore) => {
        const request1 = objectStore.get('wad0');
        request1.onerror = _onerror;
        request1.onsuccess = function () {
            if (request1.result === undefined) {
                _onerror();
                return;
            }
            wad0File = new WadHandler(); // class info are runtime info and not stored in cache => use copy constructor
            for (let prop in request1.result) wad0File[prop] = request1.result[prop];
            const request2 = objectStore.get('wad1');
            request2.onerror = _onerror;
            request2.onsuccess = function () {
                if (request2.result === undefined) {
                    _onerror();
                    return;
                }
                wad1File = new WadHandler(); // class info are runtime info and not stored in cache => use copy constructor
                for (let prop in request2.result) wad1File[prop] = request2.result[prop];
                startLoadingProcess();
            };
        };
    });
}

function setLoadingMessage(text) {
    // clear the lower portion of the canvas and update the loading status
    loadingContext.fillStyle = 'black';
    loadingContext.fillRect(0, loadingCanvas.height - 70, loadingCanvas.width, 50);
    loadingContext.fillStyle = 'white';
    loadingContext.fillText(text, 20, loadingCanvas.height - 30);
}

const loadingCanvas = document.getElementById('loadingCanvas');
const loadingContext = loadingCanvas.getContext('2d');

export { startWithCachedFiles, loadWadFiles };
