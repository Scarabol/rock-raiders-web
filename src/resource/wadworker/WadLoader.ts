import { CfgFileParser } from './CfgFileParser';
import { WadFile } from './WadFile';
import { getFilename, getPath, iGet } from './WadUtil';
import { RonFile } from './RonFile';
import { AlphaBitmapDecoder } from './AlphaBitmapDecoder';

export class WadLoader {

    wad0File: WadFile = null;
    wad1File: WadFile = null;
    startTime: Date;
    assetIndex: number = 0;
    totalResources: number = 0;
    assetsFromCfg: any[];
    assetsFromCfgByName: {};

    onMessage: (msg: string) => any = (msg: string) => {
        console.log(msg);
    };
    onInitialLoad: (totalResources: number, cfg: any) => any = () => {
        console.log('Initial loading done.');
    };
    onAssetLoaded: (assetIndex: number, assetName: string, assetObj: any) => any = () => {
    };
    onLoadDone: (totalResources: number, loadingTimeSeconds: string) => any = (totalResources: number, loadingTimeSeconds: string) => {
        console.log('Loading of about ' + totalResources + ' assets complete! Total load time: ' + loadingTimeSeconds + ' seconds.');
    };

    loadWadImageAsset(name: string, callback: (obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name);
        const imgData = AlphaBitmapDecoder.parse(data);
        callback(imgData);
    }

    loadWadTexture(name: string, callback: (obj: ImageData) => any) {
        function isTranslucentTexture(name): boolean { // TODO check for better approach
            const filename = getFilename(name);
            return !!filename.match(/\d\d\d\..+$/i) || !!filename.match(/^trans/i)
                || !!filename.match(/telepulse/i) || !!filename.match(/^t_/i);
        }

        function isAlphaTexture(name): boolean { // TODO check for better approach
            return !!getFilename(name).match(/^a.+/i);
        }

        const data = this.wad0File.getEntryData(name);
        const imgData = AlphaBitmapDecoder.parse(data);
        const isTranslucent = isTranslucentTexture(name);
        if (isTranslucent || isAlphaTexture(name)) {
            const alpha = {r: imgData.data[imgData.data.length - 4], g: imgData.data[imgData.data.length - 3], b: imgData.data[imgData.data.length - 2]}; // TODO how to determine alpha color?
            for (let n = 0; n < imgData.data.length; n += 4) {
                if (isTranslucent) {
                    if (imgData.data[n] === 255 && imgData.data[n + 1] === 255 && imgData.data[n + 2] === 255) {
                        // TODO dirty hack, because BitmapDecoder not working for sequence textures (surrounding is white instead of black)
                        imgData.data[n + 3] = 0;
                    } else {
                        imgData.data[n + 3] = Math.min(255, (imgData.data[n] * 3 + imgData.data[n + 1] * 3 + imgData.data[n + 2] * 3) / 3);
                    }
                } else if (imgData.data[n] === alpha.r && imgData.data[n + 1] === alpha.g && imgData.data[n + 2] === alpha.b) {
                    imgData.data[n + 3] = 0;
                }
            }
        }
        callback(imgData);
    }

    loadAlphaImageAsset(name: string, callback: (obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name);
        const imgData = AlphaBitmapDecoder.parse(data);
        for (let n = 0; n < imgData.data.length; n += 4) {
            if (imgData.data[n] <= 2 && imgData.data[n + 1] <= 2 && imgData.data[n + 2] <= 2) { // Interface/Reward/RSoxygen.bmp uses 2/2/2 as "black" alpha background
                imgData.data[n + 3] = 0;
            }
        }
        callback(imgData);
    }

    loadFontImageAsset(name, callback) {
        console.error('Font loading not yet implemented'); // TODO implement this
        // const img = new Image();
        //
        // img.onload = function () {
        //     const context = createContext(img.naturalWidth, img.naturalHeight);
        //     context.drawImage(img, 0, 0);
        //     const imgData = context.getImageData(0, 0, context.width, context.height);
        //     for (let n = 0; n < imgData.data.length; n += 4) {
        //         if (imgData.data[n] === imgData.data[0] && imgData.data[n + 1] === imgData.data[1] && imgData.data[n + 2] === imgData.data[2]) {
        //             imgData.data[n + 3] = 0;
        //         }
        //     }
        //     context.putImageData(imgData, 0, 0);
        //     ResourceManager.fonts[name.toLowerCase()] = new BitmapFont(context);
        //     URL.revokeObjectURL(img.src);
        //     if (callback != null) callback();
        // };
        //
        // img.src = this.wad0File.getEntryUrl(name);
    }

    loadNerpAsset(name, callback) {
        console.error('Nerp loading not yet implemented'); // TODO implement this
        // name = name.replace(/.npl$/, '.nrn');
        // const script = this.wad0File.getEntryText(name);
        // ResourceManager.nerps[name] = NerpParser(script, ResourceManager.nerps);
        // if (callback != null) {
        //     callback();
        // }
    }

    parseNerpMsgFile(wadFile, name) {
        console.error('Nerp parsing not yet implemented'); // TODO implement this
        // const result = [];
        // const lines = wadFile.getEntryText(name).split('\n');
        // for (let c = 0; c < lines.length; c++) {
        //     const line = lines[c].trim();
        //     if (line.length < 1 || line === '-') {
        //         continue;
        //     }
        //     // line formatting differs between wad0 and wad1 files!
        //     const txt0Match = line.match(/\\\[([^\\]+)\\](\s*#([^#]+)#)?/);
        //     const txt1Match = line.match(/^([^$][^#]+)(\s*#([^#]+)#)?/);
        //     const sndMatch = line.match(/\$([^\s]+)\s*([^\s]+)/);
        //     if (wadFile === this.wad0File && txt0Match) {
        //         const index = txt0Match[3] !== undefined ? this.numericNameToNumber(txt0Match[3]) : c; // THIS IS MADNESS! #number# at the end of line is OPTIONAL
        //         result[index] = result[index] || {};
        //         result[index].txt = txt0Match[1];
        //     } else if (wadFile === this.wad1File && txt1Match) {
        //         const index = txt1Match[3] !== undefined ? this.numericNameToNumber(txt1Match[3]) : c; // THIS IS MADNESS! #number# at the end of line is OPTIONAL
        //         result[index] = result[index] || {};
        //         result[index].txt = txt1Match[1].replace(/_/g, ' ').trim();
        //     } else if (sndMatch && sndMatch.length === 3) {
        //         const index = this.numericNameToNumber(sndMatch[1]);
        //         result[index] = result[index] || {};
        //         result[index].snd = sndMatch[2].replace(/\\/g, '/');
        //     } else {
        //         throw 'Line in nerps message file did not match anything';
        //     }
        // }
        // return result;
    }

    // numericNameToNumber(name) {
    //     if (name === undefined) {
    //         throw 'Numeric name must not be undefined';
    //     }
    //     const digits = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9};
    //     const specials = {
    //         ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    //         sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    //     };
    //     const tens = {twenty: 20, thirty: 30, forty: 40};
    //     let number = specials[name] || digits[name];
    //     if (number === undefined) {
    //         Object.keys(tens).forEach(ten => {
    //             if (name.startsWith(ten)) {
    //                 const digitName = name.replace(ten, '');
    //                 number = tens[ten] + (digitName ? digits[digitName] : 0);
    //             }
    //         });
    //     }
    //     if (number === undefined) {
    //         throw 'Found unexpected numeric name ' + name;
    //     }
    //     return number;
    // }

    loadNerpMsg(name, callback) {
        console.error('Nerp msg not yet implemented'); // TODO implement this
        // const result = this.parseNerpMsgFile(this.wad0File, name);
        // const msg1 = this.parseNerpMsgFile(this.wad1File, name);
        // for (let c = 0; c < msg1.length; c++) {
        //     const m1 = msg1[c];
        //     if (!m1) continue;
        //     if (m1.txt) {
        //         result[c].txt = m1.txt;
        //     }
        //     if (m1.snd) {
        //         result[c].snd = m1.snd;
        //     }
        // }
        // ResourceManager.nerpMessages[name] = result;
        // if (callback) {
        //     callback();
        // }
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
        callback(map);
    }

    loadObjectListAsset(name, callback) {
        const lines = this.wad0File.getEntryText(name).split('\n');
        const objectList = [];
        let currentObject = null;
        for (let c = 0; c < lines.length; c++) {
            const line = lines[c].trim();
            const objectStartMatch = line.match(/(.+)\s+{/);
            const drivingMatch = line.match(/driving\s+(.+)/);
            if (line.length < 1 || line.startsWith(';') || line.startsWith('Lego*')) {
                // ignore empty lines, comments and the root object
            } else if (objectStartMatch) {
                currentObject = {};
                objectList[objectStartMatch[1]] = currentObject;
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
        callback(objectList);
    }

    /**
     * Load a WAV file format sound asset from the WAD file.
     * @param path Path inside the WAD file
     * @param callback A callback that is triggered after the file has been loaded
     * @param key Optional key to store the sound, should look like SND_pilotdrill
     */
    loadWavAsset(path, callback, key) {
        console.error('wav asset loading not yet implemented'); // TODO implement this
        // const snd = document.createElement('audio');
        // if (callback != null) {
        //     snd.oncanplay = function () {
        //         snd.oncanplay = null; // otherwise the callback is triggered multiple times
        //         const keyPath = key || path;
        //         // use array, because sounds have multiple variants sometimes
        //         ResourceManager.sounds[keyPath] = ResourceManager.sounds[keyPath] || [];
        //         ResourceManager.sounds[keyPath].push(snd);
        //         callback();
        //     };
        // }
        // // try (localized) wad1 file first, then use generic wad0 file
        // try {
        //     snd.src = this.wad1File.getEntryUrl(path);
        // } catch (e) {
        //     snd.src = this.wad0File.getEntryUrl(path);
        // }
    }

    // loadAnimatedEntity(aeFile: string, callback) {
    //     const content = this.wad0File.getEntryText(aeFile);
    //     const cfgRoot = iGet(new RonFile().parse(content), 'Lego*');
    //     console.error('Animated entity loading not yet implemented');
    //     AnimEntityLoader.loadModels(aeFile, cfgRoot);
    //     // callback(entity);
    // }

    loadLWOFile(lwoFilepath, callback) {
        let lwoContent;
        try {
            lwoContent = this.wad0File.getEntryBuffer(lwoFilepath);
        } catch (e) {
            // console.log('load failed for ' + subObj.filename + ' trying shared path at ' + sharedPath + filename + '; error: ' + e); // TODO debug logging
            try {
                lwoContent = this.wad0File.getEntryBuffer('world/shared/' + getFilename(lwoFilepath));
            } catch (e) {
                console.error('Could not load LWO file ' + lwoFilepath + '; Error: ' + e);
                return;
            }
        }
        callback(lwoContent.buffer);
    }

    registerAllAssets(mainConf) { // dynamically register all assets from config
        // this.addAsset(this.loadFontImageAsset, 'Interface/Fonts/ToolTipFont.bmp');
        this.addAssetFolder('Interface/TopPanel/'); // top panel
        this.addAssetFolder('Interface/RightPanel/'); // crystal side bar
        this.addAssetFolder('Interface/RadarPanel/');
        this.addAssetFolder('Interface/MessagePanel/');
        this.addAsset(this.loadWadImageAsset, 'Interface/Airmeter/msgpanel_air_juice.bmp');
        this.addAssetFolder('Interface/InfoPanel/');
        this.addAssetFolder('Interface/PriorityPanel/');
        this.addAssetFolder('Interface/Priorities');
        this.addAssetFolder('Interface/CameraControl/');
        this.addAssetFolder('Interface/MessageTabs/');
        this.addAssetFolder('Interface/IconPanel/');
        this.addAssetFolder('Interface/Icons/');
        this.addAssetFolder('Interface/Menus/');
        // level files
        Object.keys(mainConf['Levels']).forEach(levelKey => {
            if (!(levelKey.startsWith('Tutorial') || levelKey.startsWith('Level'))) return; // ignore incomplete test levels and duplicates
            const levelConf = mainConf['Levels'][levelKey];
            this.addAsset(this.loadMapAsset, levelConf['SurfaceMap']);
            this.addAsset(this.loadMapAsset, levelConf['PreDugMap']);
            this.addAsset(this.loadMapAsset, levelConf['TerrainMap']);
            this.addAsset(this.loadMapAsset, levelConf['BlockPointersMap'], true);
            this.addAsset(this.loadMapAsset, levelConf['CryOreMap']);
            this.addAsset(this.loadMapAsset, levelConf['PathMap'], true);
            this.addAsset(this.loadObjectListAsset, levelConf['OListFile']);
            // this.addAsset(this.loadNerpAsset, levelConf['NERPFile']); // TODO add nerp support
            // this.addAsset(this.loadNerpMsg, levelConf['NERPMessageFile']); // TODO add nerp support
            const menuConf = levelConf['MenuBMP'];
            if (menuConf) menuConf.forEach((imgKey) => this.addAsset(this.loadAlphaImageAsset, imgKey));
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
            this.addAnimatedEntity(aeFile);
        });
        this.addAnimatedEntity('mini-figures/pilot/pilot.ae');
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
        // spaces
        this.wad0File.filterEntryNames('World/WorldTextures/IceSplit/Ice..\\.bmp').forEach(imgPath => {
            this.addAsset(this.loadWadTexture, imgPath);
        });
        this.wad0File.filterEntryNames('World/WorldTextures/LavaSplit/Lava..\\.bmp').forEach(imgPath => {
            this.addAsset(this.loadWadTexture, imgPath);
        });
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

    addAnimatedEntity(aeFile: string) {
        const content = this.wad0File.getEntryText(aeFile);
        const cfgRoot = iGet(new RonFile().parse(content), 'Lego*');
        this.onAssetLoaded(0, aeFile, cfgRoot);
        const path = getPath(aeFile);
        ['HighPoly', 'MediumPoly', 'LowPoly'].forEach((polyType) => { // TODO add 'FPPoly' (contains two cameras)
            const cfgPoly = iGet(cfgRoot, polyType);
            if (cfgPoly) {
                Object.keys(cfgPoly).forEach((key) => {
                    this.addAsset(this.loadLWOFile, path + cfgPoly[key] + '.lwo');
                });
            }
        });
        const activities = iGet(cfgRoot, 'Activities');
        if (activities) {
            Object.keys(activities).forEach((activity) => {
                try {
                    let keyname = iGet(activities, activity);
                    const act = iGet(cfgRoot, keyname);
                    const file = iGet(act, 'FILE');
                    const isLws = iGet(act, 'LWSFILE') === true;
                    const looping = iGet(act, 'LOOPING') === true;
                    if (isLws) {
                        const lwsFilepath = path + file + '.lws';
                        const content = this.wad0File.getEntryText(lwsFilepath);
                        this.onAssetLoaded(0, lwsFilepath, content);
                        const lwoFiles: string[] = this.extractLwoFiles(path, content);
                        lwoFiles.forEach((lwoFile) => this.addAsset(this.loadLWOFile, lwoFile));
                    } else {
                        console.error('Found activity which is not an LWS file');
                    }
                } catch (e) {
                    console.error(e);
                    console.log(cfgRoot);
                    console.log(activities);
                    console.log(activity);
                }
            });
        }
        // load all textures for this type
        this.wad0File.filterEntryNames(getPath(aeFile) + '.+\\.bmp').forEach((bTexture) => {
            this.addAsset(this.loadWadTexture, bTexture);
        });
    }

    extractLwoFiles(path: string, content: string): string[] {
        const lines: string[] = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim());

        if (lines[0] !== 'LWSC') {
            throw 'Invalid start of file! Expected \'LWSC\' in first line';
        }

        return lines.filter((line) => line.toLowerCase().startsWith('LoadObject '.toLowerCase()))
            .map((objLine) => path + getFilename(objLine.substring('LoadObject '.length)).toLowerCase());
    }

    addAssetFolder(folderPath) {
        this.wad0File.filterEntryNames(folderPath + '.+\\.bmp').forEach((assetPath) => {
            this.addAsset(this.loadAlphaImageAsset, assetPath);
        });
    }

    addAsset(method, assetPath, optional = false) {
        if (!assetPath || this.assetsFromCfgByName.hasOwnProperty(assetPath.toLowerCase()) || assetPath === 'NULL') {
            return; // do not load assets twice
        }
        this.assetsFromCfgByName[assetPath] = {
            method: method.bind(this),
            assetPath: assetPath,
            optional: optional,
        };
    }

    loadAssetsParallel() {
        const promises = [];
        const that = this;
        this.assetsFromCfg.forEach((asset) => {
            promises.push(new Promise((resolve) => {
                try {
                    asset.method(asset.assetPath, (assetObj) => {
                        this.assetIndex++;
                        that.onAssetLoaded(this.assetIndex, asset.assetPath, assetObj);
                        resolve();
                    }, asset.assetKey);
                } catch (e) {
                    if (!asset.optional) throw e;
                    this.assetIndex++;
                    that.onAssetLoaded(this.assetIndex, asset.assetPath, null);
                    resolve();
                }
            }));
        });
        Promise.all(promises).then(() => {
            // indicate that loading has finished, and display the total loading time
            const loadingTimeSeconds = ((new Date().getTime() - this.startTime.getTime()) / 1000).toFixed(3).toString();
            this.onLoadDone(this.totalResources, loadingTimeSeconds);
        });
    }

    startWithCachedFiles(onCacheMiss: () => any) {
        this.startTime = new Date();
        const _onerror = () => {
            this.onMessage('WAD files not found in cache');
            onCacheMiss();
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

    /**
     * Load essential files, to begin the chain of asset loading
     */
    startLoadingProcess() {
        this.startTime = new Date();
        this.assetsFromCfgByName = {};
        this.onMessage('Loading configuration...');
        const cfg = CfgFileParser.parse(this.wad1File.getEntryData('Lego.cfg'));
        this.registerAllAssets(cfg);
        this.onMessage('Loading initial assets...');
        Promise.all([
            new Promise((resolve) => {
                const name = iGet(cfg, 'Main', 'LoadScreen'); // loading screen image
                this.loadWadImageAsset(name, (imgData) => {
                    this.onAssetLoaded(0, name, imgData);
                    resolve();
                });
            }),
            new Promise((resolve) => {
                const name = iGet(cfg, 'Main', 'ProgressBar'); // loading bar container image
                this.loadWadImageAsset(name, (imgData) => {
                    this.onAssetLoaded(0, name, imgData);
                    resolve();
                });
            }),
        ]).then(() => {
            this.onMessage('Start loading assets...');
            this.assetsFromCfg = Object.values(this.assetsFromCfgByName);
            this.totalResources = this.assetsFromCfg.length;
            this.onInitialLoad(this.totalResources, cfg);
            this.assetIndex = 0;
            this.loadAssetsParallel();
        });
    }

}
