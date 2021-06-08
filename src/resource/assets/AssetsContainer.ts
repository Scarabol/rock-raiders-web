import { LevelEntryCfg, LevelsCfg } from '../../cfg/LevelsCfg'
import { MenuCfg } from '../../cfg/MenuCfg'
import { RewardCfg } from '../../cfg/RewardCfg'
import { iGet } from '../../core/Util'
import { AssetType } from './AssetWorker'

export enum LoadingStage {

    FILE,
    CFG,
    INIT,
    PRIMARY,
    SECONDARY,

}

export class AssetEntry {

    assetType: AssetType
    cacheIdentifier: string
    filepath: string
    optional: boolean
    assetNames: string[]
    loadedFromCache: boolean = false

    constructor(type: AssetType, cacheIdentifier: string, opt?: { filepath?: string, optional?: boolean, assetNames?: string[] }) {
        this.assetType = type
        this.cacheIdentifier = cacheIdentifier
        this.filepath = opt?.filepath || this.cacheIdentifier
        this.optional = opt?.optional || false
        this.assetNames = opt?.assetNames || [this.filepath]
    }

}

export class AssetsContainer extends Map<LoadingStage, AssetEntry[]> {

    wad0EntryIndexByName: Map<string, number> = null
    wad1EntryIndexByName: Map<string, number> = null

    constructor(wad0AssetEntry: AssetEntry, wad1AssetEntry: AssetEntry) {
        super()
        this.set(LoadingStage.FILE, [wad0AssetEntry, wad1AssetEntry])
        this.set(LoadingStage.CFG, [new AssetEntry(AssetType.CONFIG_MAIN, 'Lego.cfg')])
    }

    addAssetsFromConfiguration(mainConf: any, wad0EntryIndexByName: Map<string, number>, wad1EntryIndexByName: Map<string, number>) {
        this.wad0EntryIndexByName = wad0EntryIndexByName
        this.wad1EntryIndexByName = wad1EntryIndexByName
        this.set(LoadingStage.INIT, [
            new AssetEntry(AssetType.IMAGE, iGet(mainConf, 'Main', 'LoadScreen')), // loading screen image
            new AssetEntry(AssetType.IMAGE, iGet(mainConf, 'Main', 'ProgressBar')), // loading bar container image
            new AssetEntry(AssetType.CURSOR, iGet(mainConf, 'Pointers', 'Pointer_Standard')),
            new AssetEntry(AssetType.BITMAP_FONT_IMAGE, 'Interface/Fonts/Font5_Hi.bmp'),
        ])
        this.set(LoadingStage.PRIMARY, [])
        // add fonts and cursors
        this.addAssetFolder(AssetType.BITMAP_FONT_IMAGE, 'Interface/Fonts/')
        this.addAssetFolder(AssetType.ALPHA_IMAGE, 'Interface/Pointers/')
        this.filterEntryNames('Interface/Pointers/' + '.+\\.flh').forEach((assetPath) => {
            this.addAsset(AssetType.FLH_ANIMATION, assetPath)
        })
        // add menu assets
        this.addMenuWithAssets(mainConf, 'MainMenuFull', false)
        this.addMenuWithAssets(mainConf, 'PausedMenu')
        this.addMenuWithAssets(mainConf, 'OptionsMenu')
        this.addAsset(AssetType.ALPHA_IMAGE, 'Interface/BriefingPanel/BriefingPanel.bmp')
        this.addAsset(AssetType.OBJECTIVE_TEXT, 'Languages/ObjectiveText.txt')
        // add in-game assets
        this.addAlphaImageFolder('Interface/TopPanel/') // top panel
        this.addAlphaImageFolder('Interface/RightPanel/') // crystal side bar
        this.addAlphaImageFolder('Interface/RadarPanel/')
        this.addAlphaImageFolder('Interface/MessagePanel/')
        this.addAsset(AssetType.IMAGE, 'Interface/Airmeter/msgpanel_air_juice.bmp')
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
        this.addAssetFolder(AssetType.ALPHA_IMAGE, 'Interface/FrontEnd/Vol_')
        this.addAssetFolder(AssetType.IMAGE, 'Interface/FrontEnd/lp_')
        this.addAsset(AssetType.ALPHA_IMAGE, 'Interface/FrontEnd/LowerPanel.bmp')
        // level files
        this.addAsset(AssetType.NERP_SCRIPT, 'Levels/nerpnrn.h')
        const levelsCfg = new LevelsCfg(iGet(mainConf, 'Levels'))
        levelsCfg.levelCfgByName.forEach((level: LevelEntryCfg) => {
            level.menuBMP.forEach((bmpName) => {
                this.addAsset(AssetType.ALPHA_IMAGE, bmpName)
            })
            this.addAsset(AssetType.MAP_ASSET, level.surfaceMap)
            this.addAsset(AssetType.MAP_ASSET, level.predugMap)
            this.addAsset(AssetType.MAP_ASSET, level.terrainMap)
            this.addAsset(AssetType.MAP_ASSET, level.blockPointersMap, {optional: true})
            this.addAsset(AssetType.MAP_ASSET, level.cryOreMap)
            this.addAsset(AssetType.MAP_ASSET, level.pathMap, {optional: true})
            if (level.fallinMap) this.addAsset(AssetType.MAP_ASSET, level.fallinMap)
            if (level.erodeMap) this.addAsset(AssetType.MAP_ASSET, level.erodeMap)
            this.addAsset(AssetType.OBJECT_LIST, level.oListFile)
            this.addAsset(AssetType.NERP_SCRIPT, level.nerpFile)
            this.addAsset(AssetType.NERP_MSG, level.nerpMessageFile)
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
        this.addAsset(AssetType.LWO, 'World/Shared/Crystal.lwo') // high-poly version
        this.addAsset(AssetType.TEXTURE, 'MiscAnims/Ore/Ore.bmp')
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
        this.addAsset(AssetType.IMAGE, rewardCfg.wallpaper)
        this.addAsset(AssetType.BITMAP_FONT_IMAGE, rewardCfg.backFont)
        Object.values(rewardCfg.fonts).forEach(imgPath => this.addAsset(AssetType.BITMAP_FONT_IMAGE, imgPath))
        rewardCfg.images.forEach(img => this.addAsset(AssetType.ALPHA_IMAGE, img.filePath))
        rewardCfg.boxImages.forEach(img => this.addAsset(AssetType.IMAGE, img.filePath))
        rewardCfg.saveButton.splice(0, 4).forEach(img => this.addAsset(AssetType.IMAGE, img))
        rewardCfg.advanceButton.splice(0, 4).forEach(img => this.addAsset(AssetType.IMAGE, img))
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
            this.addAsset(AssetType.WAV, sndPath, {assetNames: sndKeys})
        })
        this.set(LoadingStage.SECONDARY, [
            // FIXME add other stages and files
            // loadAllCursor
        ])
    }

    addMeshObjects(basePath: string) {
        const aeFilepath = basePath + '/' + basePath.split('/').last() + '.ae'
        if (this.wad0EntryIndexByName.has(aeFilepath.toLowerCase())) this.addAnimatedEntity(aeFilepath)
        const aeSharedFilepath = 'world/shared/' + basePath.split('/').last() + '.ae'
        if (this.wad0EntryIndexByName.has(aeSharedFilepath.toLowerCase())) this.addAnimatedEntity(aeSharedFilepath)
        const lwsFilepath = basePath + '.lws'
        if (this.wad0EntryIndexByName.has(lwsFilepath.toLowerCase())) this.addLWSFile(lwsFilepath)
        const lwsSharedFilepath = 'world/shared/' + basePath.split('/').last() + '.lws'
        if (this.wad0EntryIndexByName.has(lwsSharedFilepath.toLowerCase())) this.addLWSFile(lwsSharedFilepath)
        const lwoFilepath = basePath + '.lwo'
        if (this.wad0EntryIndexByName.has(lwoFilepath.toLowerCase())) this.addAsset(AssetType.LWO, lwoFilepath)
        const lwoSharedFilepath = 'world/shared/' + basePath.split('/').last() + '.lwo'
        if (this.wad0EntryIndexByName.has(lwoSharedFilepath.toLowerCase())) this.addAsset(AssetType.LWO, lwoSharedFilepath)
    }

    addAnimatedEntity(aeFile: string) {
        this.addAsset(AssetType.AE_FILE, aeFile);
    }

    addLWSFile(lwsFilepath: string) {
        this.addAsset(AssetType.LWS, lwsFilepath)
    }

    addAlphaImageFolder(folderPath: string) {
        this.addAssetFolder(AssetType.ALPHA_IMAGE, folderPath)
    }

    addTextureFolder(folderPath: string) {
        this.addAssetFolder(AssetType.TEXTURE, folderPath)
    }

    addAssetFolder(assetType: AssetType, folderPath) {
        this.filterEntryNames(folderPath + '.+\\.bmp').forEach((assetPath) => {
            this.addAsset(assetType, assetPath)
        })
    }

    filterEntryNames(regexStr) {
        const regex = new RegExp(regexStr.toLowerCase())
        const result = []
        this.wad0EntryIndexByName.forEach((index, entry) => {
            if (entry.match(regex)) result.push(entry)
        })
        return result
    }

    addMenuWithAssets(mainConf, name: string, menuImageAlpha: boolean = true) {
        const menuCfg = new MenuCfg(iGet(mainConf, 'Menu', name))
        menuCfg.menus.forEach((menuCfg) => {
            const assetType = menuImageAlpha ? AssetType.ALPHA_IMAGE : AssetType.IMAGE
            const menuImage = Array.isArray(menuCfg.menuImage) ? menuCfg.menuImage[0] : menuCfg.menuImage
            this.addAsset(assetType, menuImage)
            this.addAsset(AssetType.BITMAP_FONT_IMAGE, menuCfg.menuFont)
            this.addAsset(AssetType.BITMAP_FONT_IMAGE, menuCfg.loFont)
            this.addAsset(AssetType.BITMAP_FONT_IMAGE, menuCfg.hiFont)
        })
    }

    addAsset(assetType: AssetType, assetPath: string, opt?: { filepath?: string, optional?: boolean, assetNames?: string[], stage?: LoadingStage }) {
        if (!assetPath) return
        const lAssetPath = assetPath.toLowerCase()
        if (!this.wad0EntryIndexByName.has(lAssetPath) && !this.wad1EntryIndexByName.has(lAssetPath)) {
            if (opt?.optional) return
            // TODO handle all assets as optional?
            // console.error(new Error('Non-optional asset type not found asset files: ' + assetPath))
        }
        this.getOrUpdate(opt?.stage ?? LoadingStage.PRIMARY, () => [])
            .push(new AssetEntry(assetType, assetPath, opt))
    }

    get numOfAssets(): number {
        let sum = 0
        this.forEach((v) => sum += v.length)
        return sum
    }

}
