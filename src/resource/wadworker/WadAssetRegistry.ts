import { LevelsCfg } from '../../cfg/LevelsCfg'
import { MenuCfg } from '../../cfg/MenuCfg'
import { RewardCfg } from '../../cfg/RewardCfg'
import { getFilename, getPath, iGet } from '../../core/Util'
import { RonFileParser } from './parser/RonFileParser'
import { WadLoader } from './WadLoader'

interface WadAsset {
    method: ((name: string, callback: (assetName: string[], assetData: any) => void) => void)
    assetPath: string
    optional: boolean
    sfxKeys: string[]
}

export class WadAssetRegistry extends Map<string, WadAsset> {

    wadLoader: WadLoader

    constructor(wadLoader: WadLoader) {
        super()
        this.wadLoader = wadLoader
    }

    registerAllAssets(mainConf: any) {
        // add fonts and cursors
        this.addAssetFolder(this.wadLoader.loadFontImageAsset, 'Interface/Fonts/')
        this.addAssetFolder(this.wadLoader.loadAlphaImageAsset, 'Interface/Pointers/')
        this.wadLoader.wad0File.filterEntryNames('Interface/Pointers/' + '.+\\.flh').forEach((assetPath) => {
            this.addAsset(this.wadLoader.loadFlhAsset, assetPath)
        })
        // add menu assets
        this.addMenuWithAssets(mainConf, 'MainMenuFull', false)
        this.addMenuWithAssets(mainConf, 'PausedMenu')
        this.addMenuWithAssets(mainConf, 'OptionsMenu')
        this.addAsset(this.wadLoader.loadAlphaImageAsset, 'Interface/BriefingPanel/BriefingPanel.bmp')
        this.addAsset(this.wadLoader.loadObjectiveTexts, 'Languages/ObjectiveText.txt')
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
        this.addAsset(this.wadLoader.loadAlphaImageAsset, 'Interface/FrontEnd/LowerPanel.bmp')
        // level files
        this.addAsset(this.wadLoader.loadNerpAsset, 'Levels/nerpnrn.h')
        const levelsCfg = new LevelsCfg(iGet(mainConf, 'Levels'))
        levelsCfg.levelCfgByName.forEach((level) => {
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
            this.addAsset(this.wadLoader.loadObjectListAsset, level.oListFile)
            this.addAsset(this.wadLoader.loadNerpAsset, level.nerpFile)
            this.addAsset(this.wadLoader.loadNerpMsg, level.nerpMessageFile)
        })
        // load all shared textures
        this.addTextureFolder('World/Shared/')
        this.addTextureFolder('Vehicles/SharedUG/')
        // load all entity upgrades
        const upgradeTypes = iGet(mainConf, 'UpgradeTypes')
        Object.values(upgradeTypes).forEach((uType: string) => {
            this.addMeshObjects(uType)
        })
        // load all building types
        const buildingTypes = iGet(mainConf, 'BuildingTypes')
        Object.values(buildingTypes).forEach((bType: string) => {
            this.addMeshObjects(bType)
        })
        this.addAnimatedEntity('mini-figures/pilot/pilot.ae')
        // load monsters
        const rockMonsterTypes = iGet(mainConf, 'RockMonsterTypes')
        Object.values(rockMonsterTypes).forEach((mType: string) => {
            this.addMeshObjects(mType)
        })
        // load vehicles
        const vehicleTypes = mainConf['VehicleTypes']
        Object.values(vehicleTypes).forEach((v) => {
            (Array.isArray(v) ? v : [v]).forEach((vType: string) => {
                this.addMeshObjects(vType)
            })
        })
        // load misc objects
        this.addTextureFolder('MiscAnims/Crystal/')
        this.addAsset(this.wadLoader.loadLWOFile, 'World/Shared/Crystal.lwo') // high-poly version
        this.addAsset(this.wadLoader.loadWadTexture, 'MiscAnims/Ore/Ore.bmp')
        this.addTextureFolder('MiscAnims/RockFall/')
        this.addLWSFile('MiscAnims/RockFall/Rock3Sides.lws')
        const miscObjects = mainConf['MiscObjects']
        Object.values(miscObjects).forEach((mType: string) => {
            this.addMeshObjects(mType)
        })
        // spaces
        this.addTextureFolder('World/WorldTextures/IceSplit/Ice')
        this.addTextureFolder('World/WorldTextures/LavaSplit/Lava')
        this.addTextureFolder('World/WorldTextures/RockSplit/Rock')
        // reward screen
        const rewardCfg = new RewardCfg(iGet(mainConf, 'Reward'))
        this.wadLoader.onAssetLoaded(0, ['Reward'], rewardCfg)
        this.addAsset(this.wadLoader.loadWadImageAsset, rewardCfg.wallpaper)
        this.addAsset(this.wadLoader.loadFontImageAsset, rewardCfg.backFont)
        Object.values(rewardCfg.fonts).forEach(imgPath => this.addAsset(this.wadLoader.loadFontImageAsset, imgPath))
        rewardCfg.images.forEach(img => this.addAsset(this.wadLoader.loadAlphaImageAsset, img.filePath))
        rewardCfg.boxImages.forEach(img => this.addAsset(this.wadLoader.loadWadImageAsset, img.filePath))
        rewardCfg.saveButton.splice(0, 4).forEach(img => this.addAsset(this.wadLoader.loadWadImageAsset, img))
        rewardCfg.advanceButton.splice(0, 4).forEach(img => this.addAsset(this.wadLoader.loadWadImageAsset, img))
        // sounds
        const sndPathToKeys = new Map<string, string[]>()
        const samplesConf = mainConf['Samples']
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
                    // console.warn('Sound ' + sndPath + ' must be loaded from program files folder. Not yet implemented!')
                    return // TODO implement sounds from program files folder
                }
                sndPathToKeys.getOrUpdate(sndPath + '.wav', () => []).push(sndKey)
            })
        })
        sndPathToKeys.forEach((sndKeys, sndPath) => {
            this.addAsset(this.wadLoader.loadWavAsset, sndPath, false, sndKeys)
        })
    }

    addMeshObjects(basePath: string) {
        const aeFilepath = basePath + '/' + basePath.split('/').last() + '.ae'
        if (this.wadLoader.wad0File.hasEntry(aeFilepath)) this.addAnimatedEntity(aeFilepath)
        const aeSharedFilepath = 'world/shared/' + basePath.split('/').last() + '.ae'
        if (this.wadLoader.wad0File.hasEntry(aeSharedFilepath)) this.addAnimatedEntity(aeSharedFilepath)
        const lwsFilepath = basePath + '.lws'
        if (this.wadLoader.wad0File.hasEntry(lwsFilepath)) this.addLWSFile(lwsFilepath)
        const lwsSharedFilepath = 'world/shared/' + basePath.split('/').last() + '.lws'
        if (this.wadLoader.wad0File.hasEntry(lwsSharedFilepath)) this.addLWSFile(lwsSharedFilepath)
        const lwoFilepath = basePath + '.lwo'
        if (this.wadLoader.wad0File.hasEntry(lwoFilepath)) this.addAsset(this.wadLoader.loadLWOFile, lwoFilepath)
        const lwoSharedFilepath = 'world/shared/' + basePath.split('/').last() + '.lwo'
        if (this.wadLoader.wad0File.hasEntry(lwoSharedFilepath)) this.addAsset(this.wadLoader.loadLWOFile, lwoSharedFilepath)
    }

    addAnimatedEntity(aeFile: string) {
        const content = this.wadLoader.wad0File.getEntryText(aeFile)
        const cfgRoot = iGet(RonFileParser.parse(content), 'Lego*')
        this.wadLoader.onAssetLoaded(0, [aeFile], cfgRoot)
        const path = getPath(aeFile)
        // load all textures for this type
        this.addTextureFolder(path)
        const wheelMeshName = iGet(cfgRoot, 'WheelMesh')
        if (wheelMeshName && !'NULL_OBJECT'.equalsIgnoreCase(wheelMeshName)) {
            this.addAsset(this.wadLoader.loadLWOFile, path + wheelMeshName + '.lwo')
        }
        ['HighPoly', 'MediumPoly', 'LowPoly'].forEach((polyType) => { // TODO add 'FPPoly' (contains two cameras)
            const cfgPoly = iGet(cfgRoot, polyType)
            if (cfgPoly) {
                Object.keys(cfgPoly).forEach((key) => {
                    this.addAsset(this.wadLoader.loadLWOFile, path + cfgPoly[key] + '.lwo')
                })
            }
        })
        Object.keys(cfgRoot).forEach((cfgKey) => {
            try {
                const value = cfgRoot[cfgKey]
                const isLws = iGet(value, 'LWSFILE') === true
                if (isLws) {
                    const file = iGet(value, 'FILE')
                    this.addLWSFile(path + file + '.lws')
                }
            } catch (e) {
                // XXX do we have to care? files listed in pilot.ae can be found in vehicles/hoverboard/...
            }
        })
    }

    addLWSFile(lwsFilepath: string) {
        const content = this.wadLoader.wad0File.getEntryText(lwsFilepath)
        this.wadLoader.onAssetLoaded(0, [lwsFilepath], content)
        const lwoFiles: string[] = this.extractLwoFiles(getPath(lwsFilepath), content)
        lwoFiles.forEach((lwoFile) => this.addAsset(this.wadLoader.loadLWOFile, lwoFile))
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

    addAssetFolder(callback: (name: string, callback: (assetNames: string[], obj: any) => any) => void, folderPath) {
        this.wadLoader.wad0File.filterEntryNames(folderPath + '.+\\.bmp').forEach((assetPath) => {
            this.addAsset(callback, assetPath)
        })
    }

    addMenuWithAssets(mainConf, name: string, menuImageAlpha: boolean = true) {
        const menuCfg = new MenuCfg(iGet(mainConf, 'Menu', name))
        this.wadLoader.onAssetLoaded(0, [name], menuCfg)
        menuCfg.menus.forEach((menuCfg) => {
            const method = menuImageAlpha ? this.wadLoader.loadAlphaImageAsset : this.wadLoader.loadWadImageAsset
            const menuImage = Array.isArray(menuCfg.menuImage) ? menuCfg.menuImage[0] : menuCfg.menuImage
            this.addAsset(method, menuImage)
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
