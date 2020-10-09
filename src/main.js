import { loadWadFiles, startWithCachedFiles } from './core/wad/WadHandler';

// const cfgLoader = new FileLoader();
// cfgLoader.responseType = 'arraybuffer';
// cfgLoader.load('./LegoRR1/lego.cfg', (content) => {
//     // console.log(content);
//     // console.log(typeof content);
//     const cfgParser = new CfgFileParser();
//     const result = cfgParser.parse(new Uint8Array(content));
//     const legoCfg = result['Lego*'];
//
//     // level files
//     Object.keys(legoCfg["Levels"]).forEach(levelKey => {
//         if (!(levelKey.startsWith("Tutorial") || levelKey.startsWith("Level"))) {
//             return; // ignore incomplete test levels and duplicates
//         }
//         const levelConf = legoCfg["Levels"][levelKey];
//         addAsset(loadMapAsset, levelConf["SurfaceMap"]);
//         addAsset(loadMapAsset, levelConf["PreDugMap"]);
//         addAsset(loadMapAsset, levelConf["TerrainMap"]);
//         addAsset(loadMapAsset, levelConf["BlockPointersMap"], true);
//         addAsset(loadMapAsset, levelConf["CryOreMap"]);
//         addAsset(loadMapAsset, levelConf["PathMap"], true);
//         addAsset(loadObjectListAsset, levelConf["OListFile"]);
//         addAsset(loadNerpAsset, levelConf["NERPFile"]);
//         addAsset(loadNerpMsg, levelConf["NERPMessageFile"]);
//         const menuConf = levelConf["MenuBMP"];
//         if (menuConf) {
//             menuConf.split(",").forEach((imgKey) => {
//                 addAsset(loadAlphaImageAsset, imgKey);
//             });
//         }
//     });
//
//
// });

// /**
//  * Start the game by using locally provided WAD files
//  */
// function startGameFileLocal() {
//     const wad0Url = URL.createObjectURL(document.getElementById('wad0-file').files[0]);
//     const wad1Url = URL.createObjectURL(document.getElementById('wad1-file').files[0]);
//     loadWadFiles(wad0Url, wad1Url);
// }
//
// /**
//  * Start the game by downloading and using remotely available WAD files
//  */
// function startGameUrl() {
//     setLoadingMessage("Downloading WAD files... please wait", 20, loadingCanvas.height - 30);
//     const antiCorsPrefix = "https://cors-anywhere.herokuapp.com/"; // BAD IDEA! This enables MITM attacks! But it's just a game... and nobody cares...
//     loadWadFiles(antiCorsPrefix + document.getElementById('wad0-url').value, antiCorsPrefix + document.getElementById('wad1-url').value);
// }
//
// function startWithCachedFiles(onerror) {
//     setLoadingMessage("loading WAD files from cache");
//     openLocalCache((objectStore) => {
//         const request1 = objectStore.get("wad0");
//         request1.onerror = onerror;
//         request1.onsuccess = function () {
//             if (request1.result === undefined) {
//                 onerror();
//                 return;
//             }
//             wad0File = new WadHandler(); // class info are runtime info and not stored in cache => use copy constructor
//             for (let prop in request1.result) wad0File[prop] = request1.result[prop];
//             const request2 = objectStore.get("wad1");
//             request2.onerror = onerror;
//             request2.onsuccess = function () {
//                 if (request2.result === undefined) {
//                     onerror();
//                     return;
//                 }
//                 wad1File = new WadHandler(); // class info are runtime info and not stored in cache => use copy constructor
//                 for (let prop in request2.result) wad1File[prop] = request2.result[prop];
//                 startLoadingProcess();
//             };
//         };
//     });
// }
//
// function setLoadingMessage(text) {
//     // clear the lower portion of the canvas and update the loading status to display rygame.js
//     loadingContext.fillStyle = "black";
//     loadingContext.fillRect(0, loadingCanvas.height - 70, loadingCanvas.width, 50);
//     loadingContext.fillStyle = 'white';
//     loadingContext.fillText(text, 20, loadingCanvas.height - 30);
// }
//
// // if a script assigns a function to this variable, the function will be called when refreshing the screen after each asset load
// overrideLoadingScreen = null;
//
// // Any JS file containing an object named 'object' will have the contents of that object stored in GameManager.scriptObjects
// // if the file contains additional code, it will still be executed immediately as normal. Example: object = { list : [0,1,7] };
// object = null;
// assetObject = null;
//
// let wad0File;
// let wad1File;
//
// const loadingCanvas = document.getElementById('rygameCanvas');
// const loadingContext = loadingCanvas.getContext('2d');
//
// // clear the screen to black
// loadingContext.fillStyle = "black";
// loadingContext.fillRect(0, 0, loadingCanvas.width, loadingCanvas.height);
//
// // draw the loading title
// loadingContext.font = "48px Arial";
// loadingContext.fillStyle = 'white';
// loadingContext.fillText("Loading Rock Raiders", 5, loadingCanvas.height - 80);
//
// // hard-code the first loading message as assets will always be stored in assets.js
// loadingContext.font = "30px Arial";
// loadingContext.fillStyle = 'white';
// loadingContext.fillText("loading", 20, loadingCanvas.height - 30);

startWithCachedFiles(() => {
    // setLoadingMessage("WAD files not found in cache"); // TODO emit some kind of event
    // as fallback load wad files from local URL
    loadWadFiles('./LegoRR0.wad', './LegoRR1.wad');
});
