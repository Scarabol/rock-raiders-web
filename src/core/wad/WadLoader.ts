import { NerpParser } from '../nerp/Nerp';
import { BitmapFont } from '../BitmapFont';
import { createContext } from '../ImageHelper';
import { CfgFileParser } from './CfgFileParser';
import { ResourceManager } from '../../game/engine/ResourceManager';
import { WadFile } from './WadFile';
import { Texture } from 'three/src/textures/Texture';
import { RGBAFormat, RGBFormat } from 'three/src/constants';
import { AnimEntityLoader } from '../../game/entity/AnimEntityLoader';
import { RonFile } from './RonFile';
import { getFilename, iGet } from '../Util';
import * as THREE from 'three';

class WadLoader {

    wad0File: WadFile = null;
    wad1File: WadFile = null;
    startTime: Date;
    assetIndex: number = 0;
    totalResources: number = 0;
    assetsFromCfg: any;
    assetsFromCfgByName: any;
    onInitialLoad: () => any = () => {
    };
    onLoad: () => any = () => {
    };
    onMessage: (msg: string) => any = (msg: string) => console.log(msg);
    onAssetLoaded: () => any = () => {
    };

    /**
     * load a script asset from the input path, setting the callback function to the input callback
     * @param path: the path from which to load the script asset
     * @param callback: the callback function to be called once the script has finished loading
     */
    loadScriptAsset(path, callback) {
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
    loadImageAsset(path, name, callback) {
        const img = new Image();

        img.onload = function () {
            const context = createContext(img.naturalWidth, img.naturalHeight);
            context.drawImage(img, 0, 0);
            ResourceManager.images[name.toLowerCase()] = context;
            URL.revokeObjectURL(img.src);
            if (callback != null) {
                callback();
            }
        };

        img.src = path;
    }

    loadWadImageAsset(name, callback) { // TODO use BitmapLoader and avoid creating local urls
        this.loadImageAsset(this.wad0File.getEntry(name), name, callback);
    }

    loadWadTexture(name, callback) { // TODO use BitmapLoader and avoid creating local urls
        const img = new Image();

        function isTransTexture(name): boolean { // TODO check for better approach
            const filename = getFilename(name);
            return !!filename.match(/\d\d\d\..+$/i) || !!filename.match(/^trans/i)
                || !!filename.match(/^telepulse/i) || !!filename.match(/^t_/i);
        }

        function isAlphaTexture(name): boolean { // TODO check for better approach
            const filename = getFilename(name);
            return !!filename.match(/^a.+/i) || isTransTexture(name);
        }

        img.onload = function () {
            const texture = new Texture();
            texture.format = isAlphaTexture(name) ? RGBAFormat : RGBFormat;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.needsUpdate = true;

            if (texture.format === RGBAFormat) {
                const context = createContext(img.naturalWidth, img.naturalHeight); // TODO move this to ImageUtils, same as in all other getImageData
                context.drawImage(img, 0, 0);
                const imgData = context.getImageData(0, 0, context.width, context.height);
                const alpha = {r: imgData.data[imgData.data.length - 4], g: imgData.data[imgData.data.length - 3], b: imgData.data[imgData.data.length - 2]}; // TODO how to determine alpha color?
                for (let n = 0; n < imgData.data.length; n += 4) {
                    if (isTransTexture(name)) {
                        imgData.data[n + 3] = Math.min(imgData.data[n], imgData.data[n + 1], imgData.data[n + 2]);
                    } else if (imgData.data[n] === alpha.r && imgData.data[n + 1] === alpha.g && imgData.data[n + 2] === alpha.b) {
                        imgData.data[n + 3] = 0;
                    }
                }
                texture.image = imgData;
            } else {
                texture.image = img;
            }

            ResourceManager.textures[name.toLowerCase()] = texture;

            URL.revokeObjectURL(img.src);
            if (callback != null) {
                callback();
            }
        };

        img.src = this.wad0File.getEntry(name);
    }

    /**
     * Adds an alpha channel to the bitmap by setting alpha to 0 for all black pixels
     * @param name
     * @param callback
     */
    loadAlphaImageAsset(name, callback) {
        const img = new Image();

        img.onload = function () {
            const context = createContext(img.naturalWidth, img.naturalHeight);
            context.drawImage(img, 0, 0);
            const imgData = context.getImageData(0, 0, context.width, context.height);
            for (let n = 0; n < imgData.data.length; n += 4) {
                if (imgData.data[n] <= 2 && imgData.data[n + 1] <= 2 && imgData.data[n + 2] <= 2) { // Interface/Reward/RSoxygen.bmp uses 2/2/2 as "black" alpha background
                    imgData.data[n + 3] = 0;
                }
            }
            context.putImageData(imgData, 0, 0);
            ResourceManager.images[name.toLowerCase()] = context;
            URL.revokeObjectURL(img.src);
            if (callback != null) {
                callback();
            }
        };

        img.src = this.wad0File.getEntry(name.toLowerCase());
    }

    /**
     * Adds an alpha channel to the image by setting alpha to 0 for all pixels, which have the same color as the pixel at position 0,0
     * @param name
     * @param callback
     */
    loadFontImageAsset(name, callback) {
        const img = new Image();

        img.onload = function () {
            const context = createContext(img.naturalWidth, img.naturalHeight);
            context.drawImage(img, 0, 0);
            const imgData = context.getImageData(0, 0, context.width, context.height);
            for (let n = 0; n < imgData.data.length; n += 4) {
                if (imgData.data[n] === imgData.data[0] && imgData.data[n + 1] === imgData.data[1] && imgData.data[n + 2] === imgData.data[2]) {
                    imgData.data[n + 3] = 0;
                }
            }
            context.putImageData(imgData, 0, 0);
            ResourceManager.fonts[name.toLowerCase()] = new BitmapFont(context);
            URL.revokeObjectURL(img.src);
            if (callback != null) {
                callback();
            }
        };

        img.src = this.wad0File.getEntry(name);
    }

    loadNerpAsset(name, callback) {
        name = name.replace(/.npl$/, '.nrn');
        const script = this.wad0File.getEntryText(name);
        ResourceManager.nerps[name] = NerpParser(script, ResourceManager.nerps);
        if (callback != null) {
            callback();
        }
    }

    numericNameToNumber(name) {
        if (name === undefined) {
            throw 'Numeric name must not be undefined';
        }
        const digits = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9};
        const specials = {
            ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
            sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
        };
        const tens = {twenty: 20, thirty: 30, forty: 40};
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

    parseNerpMsgFile(wadFile, name) {
        const result = [];
        const lines = wadFile.getEntryText(name).split('\n');
        for (let c = 0; c < lines.length; c++) {
            const line = lines[c].trim();
            if (line.length < 1 || line === '-') {
                continue;
            }
            // line formatting differs between wad0 and wad1 files!
            const txt0Match = line.match(/\\\[([^\\]+)\\](\s*#([^#]+)#)?/);
            const txt1Match = line.match(/^([^$][^#]+)(\s*#([^#]+)#)?/);
            const sndMatch = line.match(/\$([^\s]+)\s*([^\s]+)/);
            if (wadFile === this.wad0File && txt0Match) {
                const index = txt0Match[3] !== undefined ? this.numericNameToNumber(txt0Match[3]) : c; // THIS IS MADNESS! #number# at the end of line is OPTIONAL
                result[index] = result[index] || {};
                result[index].txt = txt0Match[1];
            } else if (wadFile === this.wad1File && txt1Match) {
                const index = txt1Match[3] !== undefined ? this.numericNameToNumber(txt1Match[3]) : c; // THIS IS MADNESS! #number# at the end of line is OPTIONAL
                result[index] = result[index] || {};
                result[index].txt = txt1Match[1].replace(/_/g, ' ').trim();
            } else if (sndMatch && sndMatch.length === 3) {
                const index = this.numericNameToNumber(sndMatch[1]);
                result[index] = result[index] || {};
                result[index].snd = sndMatch[2].replace(/\\/g, '/');
            } else {
                throw 'Line in nerps message file did not match anything';
            }
        }
        return result;
    }

    loadNerpMsg(name, callback) {
        const result = this.parseNerpMsgFile(this.wad0File, name);
        const msg1 = this.parseNerpMsgFile(this.wad1File, name);
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
        ResourceManager.nerpMessages[name] = result;
        if (callback) {
            callback();
        }
    }

    loadMapAsset(name, callback) {
        const buffer = this.wad0File.getEntryData(name);
        if (buffer.length < 13 || String.fromCharCode.apply(String, buffer.slice(0, 3)) !== 'MAP') {
            console.log('Invalid map data provided');
            return;
        }
        const map = {width: buffer[8], height: buffer[12], level: []};
        let row = [];
        for (let seek = 16; seek < buffer.length; seek += 2) {
            row.push(buffer[seek]);
            if (row.length >= map.width) {
                map.level.push(row);
                row = [];
            }
        }
        ResourceManager.maps[name] = map;
        if (callback) {
            callback();
        }
    }

    loadObjectListAsset(name, callback) {
        const lines = this.wad0File.getEntryText(name).split('\n');
        ResourceManager.objectLists[name] = [];
        let currentObject = null;
        for (let c = 0; c < lines.length; c++) {
            const line = lines[c].trim();
            const objectStartMatch = line.match(/(.+)\s+{/);
            const drivingMatch = line.match(/driving\s+(.+)/);
            if (line.length < 1 || line.startsWith(';') || line.startsWith('Lego*')) {
                // ignore empty lines, comments and the root object
            } else if (objectStartMatch) {
                currentObject = {};
                ResourceManager.objectLists[name][objectStartMatch[1]] = currentObject;
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
                let val: any = split[1];
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
    loadSoundAsset(path, name, callback) {
        const snd = document.createElement('audio');
        let srcType = '.ogg';
        // use ogg if supported, otherwise fall back to mp4 (cover all modern browsers)
        if (!(snd.canPlayType && snd.canPlayType('audio/ogg'))) {
            srcType = '.m4a';
        }

        if (callback != null) {
            snd.oncanplay = function () {
                snd.oncanplay = null; // otherwise the callback is triggered multiple times
                ResourceManager.sounds[name] = snd;
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
    loadWavAsset(path, callback, key) {
        const snd = document.createElement('audio');
        if (callback != null) {
            snd.oncanplay = function () {
                snd.oncanplay = null; // otherwise the callback is triggered multiple times
                const keyPath = key || path;
                // use array, because sounds have multiple variants sometimes
                ResourceManager.sounds[keyPath] = ResourceManager.sounds[keyPath] || [];
                ResourceManager.sounds[keyPath].push(snd);
                callback();
            };
        }
        // try (localized) wad1 file first, then use generic wad0 file
        try {
            snd.src = this.wad1File.getEntry(path);
        } catch (e) {
            snd.src = this.wad0File.getEntry(path);
        }
    }

    loadAnimatedEntity(aeFile: string, callback) {
        const content = this.wad0File.getEntryText(aeFile);
        const cfgRoot = iGet(new RonFile().parse(content), 'Lego*');
        const loader = new AnimEntityLoader();
        ResourceManager.entity[aeFile.toLowerCase()] = loader.loadModels(aeFile, cfgRoot);
        callback();
    }

    /**
     * Load essential files, to begin the chain of asset loading
     */
    startLoadingProcess() {
        this.startTime = new Date();
        this.assetsFromCfgByName = {};
        this.onMessage('Loading configuration...');
        ResourceManager.configuration = new CfgFileParser().parse(this.wad1File.getEntryData('Lego.cfg'));
        Promise.all([
            new Promise((resolve) => {
                const name = ResourceManager.configuration['Lego*']['Main']['LoadScreen']; // loading screen image
                this.loadWadImageAsset(name, resolve);
            }),
            new Promise((resolve) => {
                const name = ResourceManager.configuration['Lego*']['Main']['ProgressBar']; // loading bar container image
                this.loadWadImageAsset(name, resolve);
            }),
        ]).then(() => {
            this.onInitialLoad();
            const mainConf = ResourceManager.configuration['Lego*'];
            this.registerAllAssets(mainConf);
            // start loading assets
            this.assetsFromCfg = Object.values(this.assetsFromCfgByName);
            this.totalResources = ResourceManager.initialAssets.length + this.assetsFromCfg.length;
            this.assetIndex = 0;
            this.loadSequentialAssets();
        });
    }

    addAsset(method, assetPath, optional = false, assetKey = null) {
        if (!assetPath || this.assetsFromCfgByName.hasOwnProperty(assetPath.toLowerCase()) || assetPath === 'NULL') {
            return; // do not load assets twice
        }
        this.assetsFromCfgByName[assetKey || assetPath] = {
            method: method.bind(this),
            assetKey: assetKey,
            assetPath: assetPath,
            optional: optional,
        };
    }

    registerAllAssets(mainConf) { // dynamically register all assets from config
        // // back button
        // this.addAsset(this.loadWadImageAsset, mainConf['InterfaceBackButton'].slice(2, 4).forEach(imgPath => {
        //     this.addAsset(this.loadWadImageAsset, imgPath);
        // }));
        // this.addAsset(this.loadFontImageAsset, 'Interface/Fonts/ToolTipFont.bmp');
        // // crystal side bar
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/RightPanel/CrystalSideBar.bmp'); // right side overlay showing crystal and ore count
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/RightPanel/CrystalSideBar_Ore.bmp'); // image representing a single piece of ore on the overlay
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/RightPanel/NoSmallCrystal.bmp'); // image representing no energy crystal on the overlay
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/RightPanel/SmallCrystal.bmp'); // image representing a single energy crystal on the overlay
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/RightPanel/UsedCrystal.bmp'); // image representing a single in use energy crystal on the overlay
        // level files
        Object.keys(mainConf['Levels']).forEach(levelKey => {
            if (!(levelKey.startsWith('Tutorial') || levelKey.startsWith('Level'))) {
                return; // ignore incomplete test levels and duplicates
            }
            const levelConf = mainConf['Levels'][levelKey];
            this.addAsset(this.loadMapAsset, levelConf['SurfaceMap']);
            this.addAsset(this.loadMapAsset, levelConf['PreDugMap']);
            this.addAsset(this.loadMapAsset, levelConf['TerrainMap']);
            this.addAsset(this.loadMapAsset, levelConf['BlockPointersMap'], true);
            this.addAsset(this.loadMapAsset, levelConf['CryOreMap']);
            this.addAsset(this.loadMapAsset, levelConf['PathMap'], true);
            this.addAsset(this.loadObjectListAsset, levelConf['OListFile']);
            this.addAsset(this.loadNerpAsset, levelConf['NERPFile']);
            this.addAsset(this.loadNerpMsg, levelConf['NERPMessageFile']);
            const menuConf = levelConf['MenuBMP'];
            if (menuConf) {
                menuConf.forEach((imgKey) => {
                    this.addAsset(this.loadAlphaImageAsset, imgKey);
                });
            }
        });
        // load all shared textures
        this.wad0File.filterEntryNames('World/Shared/.+\\.bmp').forEach((texturePath) => {
            this.addAsset(this.loadWadTexture, texturePath);
        });
        // load all building types
        const buildingTypes = mainConf['BuildingTypes'];
        Object.values(buildingTypes).forEach((bType: string) => {
            const bName = bType.split('/')[1];
            const aeFile = bType + '/' + bName + '.ae';
            this.addAsset(this.loadAnimatedEntity, aeFile);
            // load all textures for this type
            this.wad0File.filterEntryNames(bType + '/.+\\.bmp').forEach((bTexture) => {
                this.addAsset(this.loadWadTexture, bTexture);
            });
        });
        this.addAsset(this.loadAnimatedEntity, 'mini-figures/pilot/pilot.ae');
        // // reward screen
        // const rewardConf = mainConf['Reward'];
        // this.addAsset(this.loadWadImageAsset, rewardConf['Wallpaper']);
        // this.addAsset(this.loadFontImageAsset, rewardConf['BackFont']);
        // Object.values(rewardConf['Fonts']).forEach(imgPath => {
        //     this.addAsset(this.loadFontImageAsset, imgPath);
        // });
        // Object.values(rewardConf['Images']).forEach(img => {
        //     this.addAsset(this.loadAlphaImageAsset, img[0]);
        // });
        // Object.values(rewardConf['BoxImages']).forEach(img => {
        //     this.addAsset(this.loadWadImageAsset, img[0]);
        // });
        // rewardConf['SaveButton'].slice(0, 4).forEach(imgPath => {
        //     this.addAsset(this.loadWadImageAsset, imgPath);
        // });
        // rewardConf['AdvanceButton'].slice(0, 4).forEach(imgPath => {
        //     this.addAsset(this.loadWadImageAsset, imgPath);
        // });
        // // icon panel buttons
        // Object.values(mainConf['InterfaceImages']).forEach(entry => {
        //     (entry as []).slice(0, 3).forEach(imgPath => {
        //         this.addAsset(this.loadWadImageAsset, imgPath);
        //     });
        // });
        // Object.values(mainConf['InterfaceBuildImages']).forEach(entry => {
        //     (entry as []).slice(0, -1).forEach(imgPath => {
        //         this.addAsset(this.loadWadImageAsset, imgPath);
        //     });
        // });
        // Object.values(mainConf['InterfaceSurroundImages']).forEach(entry => {
        //     this.addAsset(this.loadAlphaImageAsset, entry[0]);
        //     this.addAsset(this.loadAlphaImageAsset, entry[5]);
        // });
        // spaces
        // this.wad0File.filterEntryNames('World/WorldTextures/IceSplit/Ice..\\.bmp').forEach(imgPath => {
        //     this.addAsset(this.loadWadImageAsset, imgPath);
        // });
        // this.wad0File.filterEntryNames('World/WorldTextures/LavaSplit/Lava..\\.bmp').forEach(imgPath => {
        //     this.addAsset(this.loadWadImageAsset, imgPath);
        // });
        this.wad0File.filterEntryNames('World/WorldTextures/RockSplit/Rock..\\.bmp').forEach(imgPath => {
            this.addAsset(this.loadWadTexture, imgPath);
        });
        // // pause screen
        // const pauseConf = mainConf['Menu']['PausedMenu'];
        // this.addAsset(this.loadAlphaImageAsset, pauseConf['Menu1']['MenuImage'][0]);
        // this.addAsset(this.loadFontImageAsset, pauseConf['Menu1']['MenuFont']);
        // this.addAsset(this.loadFontImageAsset, pauseConf['Menu1']['HiFont']);
        // this.addAsset(this.loadFontImageAsset, pauseConf['Menu1']['LoFont']);
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_OffBar.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_OnBar.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Leftcap.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Rightcap.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Plus.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_Minus.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_PlusHi.bmp');
        // this.addAsset(this.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_MinusHi.bmp');
        // // sounds
        // const samplesConf = mainConf['Samples'];
        // Object.keys(samplesConf).forEach(sndKey => {
        //     let sndPath = samplesConf[sndKey] + '.wav';
        //     if (sndKey.startsWith('!')) { // TODO no clue what this means... loop? duplicate?!
        //         sndKey = sndKey.slice(1);
        //     }
        //     if (sndPath.startsWith('*')) { // TODO no clue what this means... don't loop, see telportup
        //         sndPath = sndPath.slice(1);
        //     } else if (sndPath.startsWith('@')) {
        //         // sndPath = sndPath.slice(1);
        //         // console.warn('Sound ' + sndPath + ' must be loaded from program files folder. Not yet implemented!');
        //         return;
        //     }
        //     sndPath.split(',').forEach(sndPath => {
        //         this.addAsset(this.loadWavAsset, sndPath, false, sndKey);
        //     });
        // });
    }

    onSequentialAssetLoaded() {
        this.assetIndex++;
        this.onAssetLoaded();
        this.loadSequentialAssets();
    }

    loadSequentialAssets() {
        if (this.assetIndex >= ResourceManager.initialAssets.length) {
            this.loadAssetsParallel(); // continue with parallel loading all other assets
            return;
        }
        const curAsset = ResourceManager.initialAssets[this.assetIndex];
        const assetName = curAsset[curAsset.length - 1].toLowerCase();
        const filename = curAsset[1] !== '' ? curAsset[1] + '/' + curAsset[2] : curAsset[2];
        if (curAsset[0] === 'js') {
            this.loadScriptAsset(filename, this.onSequentialAssetLoaded.bind(this));
        } else if (curAsset[0] === 'img') {
            this.loadImageAsset(filename, assetName, this.onSequentialAssetLoaded.bind(this));
        } else if (curAsset[0] === 'snd') {
            this.loadSoundAsset(filename, assetName, this.onSequentialAssetLoaded.bind(this));
        } else if (curAsset[0] === 'wad0bmp') {
            this.loadWadImageAsset(assetName, this.onSequentialAssetLoaded.bind(this));
        } else if (curAsset[0] === 'wad0alpha') {
            this.loadAlphaImageAsset(assetName, this.onSequentialAssetLoaded.bind(this));
        } else if (curAsset[0] === 'wad0font') {
            this.loadFontImageAsset(assetName, this.onSequentialAssetLoaded.bind(this));
        } else if (curAsset[0] === 'wad0nerp') {
            this.loadNerpAsset(filename, this.onSequentialAssetLoaded.bind(this));
        } else {
            throw 'Unknown key ' + curAsset[0] + ', can\'t load: ' + curAsset.join(', ');
        }
    }

    loadAssetsParallel() {
        const promises = [];
        const that = this;
        this.assetsFromCfg.forEach((asset) => {
            promises.push(new Promise((resolve) => {
                try {
                    asset.method(asset.assetPath, () => {
                        that.onAssetLoaded();
                        resolve();
                    }, asset.assetKey);
                } catch (e) {
                    if (!asset.optional) {
                        throw e;
                    }
                    that.onAssetLoaded();
                    resolve();
                }
            }));
        });
        Promise.all(promises).then(() => {
            // indicate that loading has finished, and display the total loading time
            console.log('Loading of about ' + this.totalResources + ' assets complete! Total load time: ' + ((new Date().getTime() - this.startTime.getTime()) / 1000).toFixed(2).toString() + ' seconds.');
            this.onLoad();
        });
    }

    /**
     * Read WAD file as binary blob from the given URL and parse it on success
     * @param url the url to the WAD file, can be local file url (file://...) too
     */
    loadWadFile(url) {
        return new Promise(resolve => {
            console.log('Loading WAD file from ' + url);
            fetch(url).then((response) => {
                if (response.ok) {
                    response.arrayBuffer().then((buffer) => {
                        const wadFile = new WadFile();
                        wadFile.parseWadFile(buffer);
                        resolve(wadFile);
                    });
                }
            });
        });
    }

    /**
     * Private helper method, which combines file loading and waits for them to become ready before continuing
     * @param wad0Url Url to parse the LegoRR0.wad file from
     * @param wad1Url Url to parse the LegoRR1.wad file from
     */
    loadWadFiles(wad0Url, wad1Url) {
        const that = this;
        Promise.all([this.loadWadFile(wad0Url), this.loadWadFile(wad1Url)]).then(wadFiles => {
            that.wad0File = wadFiles[0] as WadFile;
            that.wad1File = wadFiles[1] as WadFile;
            this.openLocalCache((objectStore) => {
                objectStore.put(that.wad0File, 'wad0');
                objectStore.put(that.wad1File, 'wad1');
            });
            this.startLoadingProcess();
        });
    }

    openLocalCache(onopen) {
        const request: IDBOpenDBRequest = indexedDB.open('RockRaidersWeb');
        request.onupgradeneeded = function () {
            const db = request.result;
            if (db.objectStoreNames.contains('wadfiles')) {
                db.deleteObjectStore('wadfiles');
            }
            db.createObjectStore('wadfiles');
        };
        request.onsuccess = function () {
            const db = request.result;
            const transaction = db.transaction(['wadfiles'], 'readwrite');
            const objectStore = transaction.objectStore('wadfiles');
            onopen(objectStore);
        };
    }

    startWithCachedFiles() {
        this.startTime = new Date();
        const _onerror = () => {
            this.onMessage('WAD files not found in cache');
            // as fallback load wad files from local URL
            // TODO load WAD files from HTML input element or external URL (CORS?!)
            this.loadWadFiles('./LegoRR0.wad', './LegoRR1.wad');
        };
        this.onMessage('Loading WAD files from cache...');
        const that = this;
        this.openLocalCache((objectStore) => {
            const request1 = objectStore.get('wad0');
            request1.onerror = _onerror;
            request1.onsuccess = function () {
                if (request1.result === undefined) {
                    _onerror();
                    return;
                }
                // console.log('First WAD file loaded from cache after ' + ((new Date().getTime() - that.startTime.getTime()) / 1000));
                that.wad0File = new WadFile();
                for (let prop in request1.result) { // class info are runtime info and not stored in cache => use copy constructor
                    if (request1.result.hasOwnProperty(prop)) {
                        that.wad0File[prop] = request1.result[prop];
                    }
                }
                const request2 = objectStore.get('wad1');
                request2.onerror = _onerror;
                request2.onsuccess = function () {
                    if (request2.result === undefined) {
                        _onerror();
                        return;
                    }
                    that.wad1File = new WadFile();
                    for (let prop in request2.result) { // class info are runtime info and not stored in cache => use copy constructor
                        if (request2.result.hasOwnProperty(prop)) {
                            that.wad1File[prop] = request2.result[prop];
                        }
                    }
                    console.log('WAD files loaded from cache after ' + ((new Date().getTime() - that.startTime.getTime()) / 1000));
                    that.startLoadingProcess();
                };
            };
        });
    }
}

export { WadLoader };
