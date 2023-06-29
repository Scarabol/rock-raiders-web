import { GameConfig } from '../../cfg/GameConfig'
import { MenuCfg } from '../../cfg/MenuCfg'
import { getFilename, getPath, iGet, yieldToMainThread } from '../../core/Util'
import { RonFileParser } from './parser/RonFileParser'
import { WadLoader } from './WadLoader'
import { TOOLTIP_FONT_NAME } from '../../params'

interface WadAsset {
    method: ((name: string, callback: (assetName: string[], assetData: any) => void) => void)
    assetPath: string
    optional: boolean
    sfxKeys: string[]
}

export class WadAssetRegistry extends Map<string, WadAsset> {
    readonly inProgress: Promise<void>[] = []

    constructor(readonly wadLoader: WadLoader) {
        super()
    }

    async registerAllAssets(gameConfig: GameConfig) {
        // add fonts and cursors
        this.addAssetFolder(this.wadLoader.loadAlphaImageAsset, 'Interface/Pointers/')
        this.wadLoader.wad0File.filterEntryNames(`Interface/Pointers/.+\\.flh`).forEach((assetPath) => {
            this.addAsset(this.wadLoader.loadFlhAsset, assetPath)
        })
        this.addAsset(this.wadLoader.loadFontImageAsset, TOOLTIP_FONT_NAME)
        // add menu assets
        this.addMenuWithAssets(gameConfig.menu.mainMenuFull, false)
        this.addMenuWithAssets(gameConfig.menu.pausedMenu)
        this.addMenuWithAssets(gameConfig.menu.optionsMenu)
        this.addAsset(this.wadLoader.loadAlphaImageAsset, 'Interface/BriefingPanel/BriefingPanel.bmp')
        this.addAsset(this.wadLoader.loadObjectiveTexts, 'Languages/ObjectiveText.txt')
        this.addAsset(this.wadLoader.loadAlphaImageAsset, gameConfig.dialog.image)
        this.addAsset(this.wadLoader.loadAlphaImageAsset, gameConfig.dialog.contrastOverlay)
        // add in-game assets
        this.addAlphaImageFolder('Interface/TopPanel/') // top panel
        this.addAlphaImageFolder('Interface/RightPanel/') // crystal side bar
        this.addAlphaImageFolder('Interface/RadarPanel/')
        this.addAlphaImageFolder('Interface/MessagePanel/')
        this.addAsset(this.wadLoader.loadWadImageAsset, 'Interface/Airmeter/msgpanel_air_juice.bmp')
        this.addAlphaImageFolder('Interface/InfoPanel/')
        this.addAlphaImageFolder('Interface/PriorityPanel/')
        this.addAlphaImageFolder('Interface/Priorities')
        this.addAlphaImageFolder('Interface/CameraControl/')
        this.addAlphaImageFolder('Interface/MessageTabs/')
        this.addAlphaImageFolder('Interface/IconPanel/')
        this.addAlphaImageFolder('Interface/Icons/')
        this.addAlphaImageFolder('Interface/Menus/')
        this.addAlphaImageFolder('Interface/Buttons/')
        this.addAlphaImageFolder('Interface/InfoImages/')
        this.addAssetFolder(this.wadLoader.loadAlphaImageAsset, 'Interface/FrontEnd/Vol_')
        this.addAssetFolder(this.wadLoader.loadWadImageAsset, 'Interface/FrontEnd/lp_')
        this.addAssetFolder(this.wadLoader.loadAlphaImageAsset, 'Interface/ToolTipIcons/')
        this.addAsset(this.wadLoader.loadAlphaImageAsset, 'Interface/FrontEnd/LowerPanel.bmp')
        // level files
        this.addAsset(this.wadLoader.loadNerpAsset, 'Levels/nerpnrn.h')
        gameConfig.levels.levelCfgByName.forEach((level) => {
            level.menuBMP.forEach((bmpName) => {
                this.addAsset(this.wadLoader.loadAlphaImageAsset, bmpName)
            })
            this.addAsset(this.wadLoader.loadMapAsset, level.surfaceMap)
            this.addAsset(this.wadLoader.loadMapAsset, level.predugMap)
            this.addAsset(this.wadLoader.loadMapAsset, level.terrainMap)
            this.addAsset(this.wadLoader.loadMapAsset, level.blockPointersMap, true)
            this.addAsset(this.wadLoader.loadMapAsset, level.cryOreMap)
            this.addAsset(this.wadLoader.loadMapAsset, level.pathMap, true)
            if (level.fallinMap) this.addAsset(this.wadLoader.loadMapAsset, level.fallinMap)
            if (level.erodeMap) this.addAsset(this.wadLoader.loadMapAsset, level.erodeMap)
            if (level.emergeMap) this.addAsset(this.wadLoader.loadMapAsset, level.emergeMap, true)
            this.addAsset(this.wadLoader.loadObjectListAsset, level.oListFile)
            this.addAsset(this.wadLoader.loadNerpAsset, level.nerpFile)
            this.addAsset(this.wadLoader.loadNerpMsg, level.nerpMessageFile)
        })
        // load all shared textures
        this.addTextureFolder('World/Shared/')
        this.addTextureFolder('Vehicles/SharedUG/')
        // load all entity upgrades
        Array.from(gameConfig.upgradeTypesCfg.values()).forEach((uType) => {
            this.addMeshObjects(uType)
        })
        // load all building types
        const buildingTypes = iGet(gameConfig, 'BuildingTypes')
        Object.values<string>(buildingTypes).forEach((bType) => {
            this.addMeshObjects(bType)
        })
        this.addTextureFolder('Buildings/E-Fence')
        this.addAnimatedEntity('mini-figures/pilot/pilot.ae')
        // load monsters
        const rockMonsterTypes = iGet(gameConfig, 'RockMonsterTypes')
        Object.values<string>(rockMonsterTypes).forEach((mType) => {
            this.addMeshObjects(mType)
        })
        await yieldToMainThread()
        // load vehicles
        const vehicleTypes = iGet(gameConfig, 'VehicleTypes')
        Object.values<string>(vehicleTypes).forEach((v) => {
            Array.ensure(v).forEach((vType) => {
                this.addMeshObjects(vType)
            })
        })
        // load bubbles
        Object.values(gameConfig.bubbles).forEach((b) => {
            this.addAsset(this.wadLoader.loadAlphaImageAsset, b)
        })
        // load misc objects
        this.addTextureFolder('MiscAnims/Crystal/')
        this.addAsset(this.wadLoader.loadLWOFile, 'World/Shared/Crystal.lwo') // high-poly version
        this.addAsset(this.wadLoader.loadWadTexture, 'MiscAnims/Ore/Ore.bmp')
        const miscObjects = iGet(gameConfig, 'MiscObjects')
        Object.values<string>(miscObjects).forEach((mType) => {
            this.addMeshObjects(mType)
        })
        const rockFallStyles = iGet(gameConfig, 'RockFallStyles')
        Object.values<string[]>(rockFallStyles).forEach((entry) => {
            const falls = entry.slice(1) // first entry is always "Item_Null"
            falls.forEach((shape) => {
                const textureFolder = shape.split('/').slice(0, -1).join('/')
                this.addTextureFolder(textureFolder)
                const lwsFilename = `${shape}.lws`
                this.addLWSFile(lwsFilename)
            })
        })
        this.addAsset(this.wadLoader.loadAlphaImageAsset, 'Interface/Dependencies/+.bmp')
        this.addAsset(this.wadLoader.loadAlphaImageAsset, 'Interface/Dependencies/=.bmp')
        // spaces
        this.addTextureFolder('World/WorldTextures/IceSplit/Ice')
        this.addTextureFolder('World/WorldTextures/LavaSplit/Lava')
        this.addTextureFolder('World/WorldTextures/RockSplit/Rock')
        // reward screen
        this.addAsset(this.wadLoader.loadWadImageAsset, gameConfig.reward.wallpaper)
        this.addAsset(this.wadLoader.loadFontImageAsset, gameConfig.reward.backFont)
        Object.values(gameConfig.reward.fonts).forEach(imgPath => this.addAsset(this.wadLoader.loadFontImageAsset, imgPath))
        gameConfig.reward.images.forEach(img => this.addAsset(this.wadLoader.loadAlphaImageAsset, img.filePath))
        gameConfig.reward.boxImages.forEach(img => this.addAsset(this.wadLoader.loadWadImageAsset, img.filePath));
        [gameConfig.reward.saveButton, gameConfig.reward.advanceButton].forEach((cfg) => {
            this.addAsset(this.wadLoader.loadWadImageAsset, cfg.imgNormalFilepath)
            this.addAsset(this.wadLoader.loadWadImageAsset, cfg.imgHoverFilepath)
            this.addAsset(this.wadLoader.loadWadImageAsset, cfg.imgPressedFilepath)
            this.addAsset(this.wadLoader.loadWadImageAsset, cfg.imgDisabledFilepath)
        })
        // sounds
        const sndPathToKeys = new Map<string, string[]>()
        const samplesConf = gameConfig['Samples']
        Object.keys(samplesConf).forEach((sndKey) => {
            const value = samplesConf[sndKey]
            sndKey = sndKey.toLowerCase()
            if (sndKey === '!sfx_drip') {
                return // Sounds/dripB.wav missing and seems unused anyway
            } else if (sndKey.startsWith('!')) { // TODO no clue what this means... loop? duplicate?!
                sndKey = sndKey.slice(1)
            }
            const sndFilePaths = Array.isArray(value) ? value : [value]
            sndFilePaths.forEach(sndPath => {
                if (sndPath.startsWith('*')) { // TODO no clue what this means... don't loop maybe, see telportup
                    sndPath = sndPath.slice(1)
                } else if (sndPath.startsWith('@')) {
                    // sndPath = sndPath.slice(1)
                    // console.warn(`Sound ${sndPath} must be loaded from program files folder. Not yet implemented!`)
                    return // TODO implement sounds from program files folder
                }
                sndPathToKeys.getOrUpdate(`${sndPath}.wav`, () => []).push(sndKey)
            })
        })
        sndPathToKeys.forEach((sndKeys, sndPath) => {
            this.addAsset(this.wadLoader.loadWavAsset, sndPath, false, sndKeys)
        })
        await Promise.all(this.inProgress)
    }

    addMeshObjects(basePath: string) {
        const aeFilepath = `${basePath}/${basePath.split('/').last()}.ae`
        if (this.wadLoader.wad0File.hasEntry(aeFilepath)) this.addAnimatedEntity(aeFilepath)
        const aeSharedFilepath = `world/shared/${basePath.split('/').last()}.ae`
        if (this.wadLoader.wad0File.hasEntry(aeSharedFilepath)) this.addAnimatedEntity(aeSharedFilepath)
        const lwsFilepath = `${basePath}.lws`
        if (this.wadLoader.wad0File.hasEntry(lwsFilepath)) this.addLWSFile(lwsFilepath)
        const lwsSharedFilepath = `world/shared/${basePath.split('/').last()}.lws`
        if (this.wadLoader.wad0File.hasEntry(lwsSharedFilepath)) this.addLWSFile(lwsSharedFilepath)
        const lwoFilepath = `${basePath}.lwo`
        if (this.wadLoader.wad0File.hasEntry(lwoFilepath)) this.addAsset(this.wadLoader.loadLWOFile, lwoFilepath)
        const lwoSharedFilepath = `world/shared/${basePath.split('/').last()}.lwo`
        if (this.wadLoader.wad0File.hasEntry(lwoSharedFilepath)) this.addAsset(this.wadLoader.loadLWOFile, lwoSharedFilepath)
    }

    addAnimatedEntity(aeFile: string) {
        const content = this.wadLoader.wad0File.getEntryText(aeFile)
        const cfgRoot = RonFileParser.parse(aeFile, content)
        this.wadLoader.onAssetLoaded(0, [aeFile], cfgRoot)
        const path = getPath(aeFile)
        // load all textures for this type
        this.addTextureFolder(path)
        const wheelMeshName = iGet(cfgRoot, 'WheelMesh')
        if (wheelMeshName && !'NULL_OBJECT'.equalsIgnoreCase(wheelMeshName)) {
            this.addAsset(this.wadLoader.loadLWOFile, `${path + wheelMeshName}.lwo`)
        }
        ['HighPoly', 'MediumPoly', 'LowPoly'].forEach((polyType) => { // TODO add 'FPPoly' (contains two cameras)
            const cfgPoly = iGet(cfgRoot, polyType)
            if (cfgPoly) {
                Object.keys(cfgPoly).forEach((key) => {
                    this.addAsset(this.wadLoader.loadLWOFile, `${path + cfgPoly[key]}.lwo`)
                })
            }
        })
        Object.keys(cfgRoot).forEach((cfgKey) => {
            const value = cfgRoot[cfgKey]
            const isLws = iGet(value, 'LWSFILE') === true
            if (isLws) {
                const file = iGet(value, 'FILE')
                this.addLWSFile(`${path + file}.lws`)
            }
        })
    }

    addLWSFile(lwsFilepath: string) {
        this.inProgress.push(new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const content = this.wadLoader.wad0File.getEntryText(lwsFilepath)
                    this.wadLoader.onAssetLoaded(0, [lwsFilepath], content)
                    const lwoFiles: string[] = this.extractLwoFiles(getPath(lwsFilepath), content)
                    lwoFiles.forEach((lwoFile) => this.addAsset(this.wadLoader.loadLWOFile, lwoFile))
                } catch (e) {
                    // XXX do we have to care? files listed in pilot.ae can be found in vehicles/hoverboard/...
                }
                resolve()
            })
        }))
    }

    extractLwoFiles(path: string, content: string): string[] {
        const lines: string[] = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim())

        if (lines[0] !== 'LWSC') {
            throw new Error('Invalid start of file! Expected \'LWSC\' in first line')
        }

        return lines.filter((line) => line.toLowerCase().startsWith('LoadObject '.toLowerCase()))
            .map((objLine) => path + getFilename(objLine.substring('LoadObject '.length)).toLowerCase())
    }

    addAlphaImageFolder(folderPath: string) {
        this.addAssetFolder(this.wadLoader.loadAlphaImageAsset, folderPath)
    }

    addTextureFolder(folderPath: string) {
        this.addAssetFolder(this.wadLoader.loadWadTexture, folderPath)
    }

    addAssetFolder(callback: (name: string, callback: (assetNames: string[], obj: any) => any) => void, folderPath: string) {
        this.wadLoader.wad0File.filterEntryNames(`${folderPath}.+\\.bmp`).forEach((assetPath) => {
            this.addAsset(callback, assetPath)
        })
    }

    addMenuWithAssets(menuCfg: MenuCfg, menuImageAlpha: boolean = true) {
        menuCfg.menus.forEach((menuCfg) => {
            const method = menuImageAlpha ? this.wadLoader.loadAlphaImageAsset : this.wadLoader.loadWadImageAsset
            this.addAsset(method, menuCfg.menuImage)
            this.addAsset(this.wadLoader.loadFontImageAsset, menuCfg.menuFont)
            this.addAsset(this.wadLoader.loadFontImageAsset, menuCfg.loFont)
            this.addAsset(this.wadLoader.loadFontImageAsset, menuCfg.hiFont)
        })
    }

    addAsset(method: (name: string, callback: (assetNames: string[], assetData: any) => void) => void, assetPath: string, optional = false, sfxKeys: string[] = []) {
        if (!assetPath || this.hasOwnProperty(assetPath) || assetPath === 'NULL') {
            return // do not load assets twice
        }
        this.set(assetPath, {
            method: method.bind(this.wadLoader),
            assetPath: assetPath,
            optional: optional,
            sfxKeys: sfxKeys,
        })
    }
}
