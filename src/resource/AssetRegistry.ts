import { GameConfig } from '../cfg/GameConfig'
import { MenuCfg } from '../cfg/MenuCfg'
import { getPath, iGet, yieldToMainThread } from '../core/Util'
import { RonFileParser } from './fileparser/RonFileParser'
import { AssetLoader } from './AssetLoader'
import { TOOLTIP_FONT_NAME } from '../params'
import { ResourceManager } from './ResourceManager'
import { AnimEntityParser } from './AnimEntityParser'
import { LWSCParser } from './fileparser/LWSCParser'
import { NerpMsgParser } from './fileparser/NerpMsgParser'

interface GameAsset {
    method: (name: string) => Promise<any>
    assetPath: string
    optional: boolean
    sfxKeys: string[]
}

export class AssetRegistry extends Map<string, GameAsset> {
    readonly inProgress: Promise<void>[] = []

    constructor(readonly assetLoader: AssetLoader) {
        super()
    }

    async registerAllAssets(gameConfig: GameConfig) {
        // add fonts and cursors
        this.addAssetFolder(this.assetLoader.loadAlphaImageAsset, 'Interface/Pointers/')
        this.assetLoader.vfs.filterEntryNames(`Interface/Pointers/.+\\.flh`).forEach((assetPath) => {
            this.addAsset(this.assetLoader.loadFlhAssetDefault, assetPath)
        })
        this.addAsset(this.assetLoader.loadFontImageAsset, TOOLTIP_FONT_NAME)
        // add menu assets
        this.addMenuWithAssets(gameConfig.menu.mainMenuFull, false)
        this.addMenuWithAssets(gameConfig.menu.pausedMenu)
        this.addMenuWithAssets(gameConfig.menu.optionsMenu)
        this.addAsset(this.assetLoader.loadAlphaImageAsset, 'Interface/BriefingPanel/BriefingPanel.bmp')
        this.addAsset(this.assetLoader.loadObjectiveTexts, 'Languages/ObjectiveText.txt')
        this.addAsset(this.assetLoader.loadAlphaImageAsset, gameConfig.dialog.image)
        this.addAsset(this.assetLoader.loadAlphaImageAsset, gameConfig.dialog.contrastOverlay)
        Array.from(gameConfig.reward.flics.values()).forEach((f) => this.addAsset(this.assetLoader.loadFlhAssetDefault, f.flhFilepath))
        this.addLWSFile('Interface/FrontEnd/Rock_Wipe/RockWipe.lws')
        this.assetLoader.vfs.filterEntryNames(`Interface/FrontEnd/Rock_Wipe/.+\\.uv`).forEach((assetPath) => {
            this.addAsset(this.assetLoader.loadUVFile, assetPath)
        })
        this.addTextureFolder('Interface/FrontEnd/Rock_Wipe/')
        // add in-game assets
        this.addAlphaImageFolder('Interface/TopPanel/') // top panel
        this.addAlphaImageFolder('Interface/RightPanel/') // crystal sidebar
        this.addAlphaImageFolder('Interface/RadarPanel/')
        this.addAlphaImageFolder('Interface/MessagePanel/')
        this.addAsset(this.assetLoader.loadWadImageAsset, 'Interface/Airmeter/msgpanel_air_juice.bmp')
        this.addAsset(this.assetLoader.loadAlphaImageAsset, 'Interface/Airmeter/msgpanel_noair.bmp')
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
        this.addAlphaImageFolder('Interface/Fonts/HealthFont/')
        this.addAssetFolder(this.assetLoader.loadAlphaTranslucentImageAsset, 'Interface/FrontEnd/Vol_')
        this.addAssetFolder(this.assetLoader.loadWadImageAsset, 'Interface/FrontEnd/lp_')
        this.addAssetFolder(this.assetLoader.loadAlphaImageAsset, 'Interface/ToolTipIcons/')
        this.addAsset(this.assetLoader.loadAlphaImageAsset, 'Interface/FrontEnd/LowerPanel.bmp')
        this.addAsset(this.assetLoader.loadAlphaImageAsset, gameConfig.main.tutorialIcon)
        // level files
        this.addAsset(this.assetLoader.loadNerpAsset, 'Levels/nerpnrn.h')
        gameConfig.levels.forEach((level) => {
            level.menuBMP.forEach((bmpName) => {
                this.addAsset(this.assetLoader.loadAlphaImageAsset, bmpName)
            })
            this.addAsset(this.assetLoader.loadMapAsset, level.surfaceMap)
            this.addAsset(this.assetLoader.loadMapAsset, level.predugMap)
            this.addAsset(this.assetLoader.loadMapAsset, level.terrainMap)
            this.addAsset(this.assetLoader.loadMapAsset, level.blockPointersMap, true)
            this.addAsset(this.assetLoader.loadMapAsset, level.cryOreMap)
            this.addAsset(this.assetLoader.loadMapAsset, level.pathMap, true)
            if (level.fallinMap) this.addAsset(this.assetLoader.loadMapAsset, level.fallinMap)
            if (level.erodeMap) this.addAsset(this.assetLoader.loadMapAsset, level.erodeMap)
            if (level.emergeMap) this.addAsset(this.assetLoader.loadMapAsset, level.emergeMap, true)
            this.addAsset(this.assetLoader.loadObjectListAsset, level.oListFile)
            this.addAsset(this.assetLoader.loadNerpAsset, level.nerpFile)
            const content = this.assetLoader.vfs.getFile(level.nerpMessageFile).toText(true)
            const nerpMessages = NerpMsgParser.parseNerpMessages(content)
            ResourceManager.resourceByName.set(level.nerpMessageFile.toLowerCase(), nerpMessages)
            nerpMessages.forEach((msg) => {
                if (msg.snd) this.addAsset(this.assetLoader.loadWavAsset, msg.snd, true, [msg.snd])
            })
        })
        // load all shared textures
        this.addTextureFolder('World/Shared/')
        this.addTextureFolder('Vehicles/SharedUG/')
        // load all entity upgrades
        Object.values(gameConfig.upgradeTypes).forEach((uType) => {
            this.addMeshObjects(uType)
        })
        // load all building types
        Object.values(GameConfig.instance.buildingTypes).forEach((bType) => this.addMeshObjects(bType))
        this.addTextureFolder('Buildings/E-Fence')
        this.addAnimatedEntity('mini-figures/pilot/pilot.ae')
        Object.values(gameConfig.advisor).forEach((adv) => {
            this.addLWSFile(adv.animFileName)
            this.addTextureFolder(getPath(adv.animFileName))
        })
        // load monsters
        Object.values(GameConfig.instance.rockMonsterTypes).forEach((mType) => this.addMeshObjects(mType))
        this.assetLoader.vfs.filterEntryNames(`Creatures/LavaMonster/.+\\.uv`).forEach((assetPath) => {
            this.addAsset(this.assetLoader.loadUVFile, assetPath)
        })
        await yieldToMainThread()
        // load vehicles
        Object.values(GameConfig.instance.vehicleTypes).forEach((v) => {
            Array.ensure(v).forEach((vType) => {
                this.addMeshObjects(vType)
            })
        })
        // load bubbles
        Object.values(gameConfig.bubbles).forEach((b) => {
            this.addAsset(this.assetLoader.loadAlphaImageAsset, b)
        })
        // load misc objects
        this.addTextureFolder('MiscAnims/Crystal/')
        this.addAsset(this.assetLoader.loadLWOFile, 'World/Shared/Crystal.lwo') // high-poly version
        this.addAsset(this.assetLoader.loadWadTexture, 'MiscAnims/Ore/Ore.bmp')
        this.addAsset(this.assetLoader.loadWadTexture, 'MiscAnims/Effects/rockfall.bmp')
        this.addAsset(this.assetLoader.loadWadTexture, 'MiscAnims/Effects/rd_laserbolt.bmp')
        this.addAsset(this.assetLoader.loadWadTexture, 'MiscAnims/Effects/rd_laserbolt_x.bmp')
        this.addAsset(this.assetLoader.loadWadTexture, 'MiscAnims/Effects/rd_newstargreen.bmp')
        const miscObjects = iGet(gameConfig, 'MiscObjects')
        Object.values<string>(miscObjects).forEach((mType) => {
            this.addMeshObjects(mType)
        })
        Object.values(gameConfig.rockFallStyles).forEach((entry) => {
            ;[entry.threeSides, entry.outsideCorner, entry.tunnel].forEach((shape) => {
                const textureFolder = shape.split('/').slice(0, -1).join('/')
                this.addTextureFolder(textureFolder)
                this.addLWSFile(shape)
            })
        })
        this.addAsset(this.assetLoader.loadAlphaImageAsset, 'Interface/Dependencies/+.bmp')
        this.addAsset(this.assetLoader.loadAlphaImageAsset, 'Interface/Dependencies/=.bmp')
        this.addAsset(this.assetLoader.loadAVI, gameConfig.main.creditsBackAVI, true)
        this.addAsset(this.assetLoader.loadCreditsFile, gameConfig.main.creditsTextFile)
        this.addAsset(this.assetLoader.loadFontImageAsset, 'Interface/Fonts/RSFont.bmp')
        // surface textures
        this.addTextureFolder('World/WorldTextures/IceSplit/Ice')
        this.addTextureFolder('World/WorldTextures/LavaSplit/Lava')
        this.addTextureFolder('World/WorldTextures/RockSplit/Rock')
        Object.values(gameConfig.textures.textureSetByName).forEach((s) => s.roofTexture && this.addAsset(this.assetLoader.loadWadTexture, s.roofTexture))
        // TODO Load pro meshes for high wall details
        // Array.from(gameConfig.textures.textureSetByName.values()).forEach((set) => {
        //     this.assetLoader.wad0File.filterEntryNames(`${set.meshBasename}.*.lwo`).forEach((meshName) => {
        //         this.addAsset(this.assetLoader.loadLWOFile, meshName)
        //     })
        // })
        // reward screen
        this.addAsset(this.assetLoader.loadWadImageAsset, gameConfig.reward.wallpaper)
        this.addAsset(this.assetLoader.loadFontImageAsset, gameConfig.reward.backFont)
        Object.values(gameConfig.reward.fonts).forEach(imgPath => this.addAsset(this.assetLoader.loadFontImageAsset, imgPath))
        gameConfig.reward.images.forEach(img => this.addAsset(this.assetLoader.loadAlphaImageAsset, img.filePath))
        gameConfig.reward.boxImages.forEach(img => this.addAsset(this.assetLoader.loadWadImageAsset, img.filePath));
        [gameConfig.reward.saveButton, gameConfig.reward.advanceButton].forEach((cfg) => {
            this.addAsset(this.assetLoader.loadWadImageAsset, cfg.imgNormalFilepath)
            this.addAsset(this.assetLoader.loadWadImageAsset, cfg.imgHoverFilepath)
            this.addAsset(this.assetLoader.loadWadImageAsset, cfg.imgPressedFilepath)
            this.addAsset(this.assetLoader.loadWadImageAsset, cfg.imgDisabledFilepath)
        })
        // sounds
        gameConfig.samples.pathToSfxKeys.forEach((sndKeys, sndPath) => {
            this.addAsset(this.assetLoader.loadWavAsset, sndPath, true, sndKeys)
        })
        await Promise.all(this.inProgress)
    }

    addMeshObjects(basePath: string) {
        const aeFilepath = `${basePath}/${basePath.split('/').last()}.ae`
        if (this.assetLoader.vfs.hasEntry(aeFilepath)) this.addAnimatedEntity(aeFilepath)
        const aeSharedFilepath = `world/shared/${basePath.split('/').last()}.ae`
        if (this.assetLoader.vfs.hasEntry(aeSharedFilepath)) this.addAnimatedEntity(aeSharedFilepath)
        const lwsFilepath = `${basePath}.lws`
        if (this.assetLoader.vfs.hasEntry(lwsFilepath)) this.addLWSFile(lwsFilepath)
        const lwsSharedFilepath = `world/shared/${basePath.split('/').last()}.lws`
        if (this.assetLoader.vfs.hasEntry(lwsSharedFilepath)) this.addLWSFile(lwsSharedFilepath)
        const lwoFilepath = `${basePath}.lwo`
        if (this.assetLoader.vfs.hasEntry(lwoFilepath)) this.addLWOFile(lwoFilepath)
        const lwoSharedFilepath = `world/shared/${basePath.split('/').last()}.lwo`
        if (this.assetLoader.vfs.hasEntry(lwoSharedFilepath)) this.addLWOFile(lwoSharedFilepath)
    }

    addAnimatedEntity(aeFile: string) {
        const content = this.assetLoader.vfs.getFile(aeFile).toText()
        const cfgRoot = RonFileParser.parse(aeFile, content)
        const path = getPath(aeFile)
        // load all textures for this type
        this.addTextureFolder(path)
        const animData = new AnimEntityParser(cfgRoot, path).parse()
        ResourceManager.resourceByName.set(aeFile.toLowerCase(), animData)
        const wheelMeshName = animData.wheelMesh
        if (wheelMeshName && !'NULL_OBJECT'.equalsIgnoreCase(wheelMeshName)) {
            this.addLWOFile(`${wheelMeshName}.lwo`)
        }
        [animData.highPolyBodies, animData.mediumPolyBodies, animData.lowPolyBodies].forEach((polyType) => {
            for (const filename of Object.values(polyType)) {
                this.addLWOFile(path + filename)
            }
        })
        // TODO add 'FPPoly' (contains usually two cameras)
        animData.animations.forEach((a) => {
            this.addLWSFile(a.file)
        })
    }

    addLWSFile(lwsFilepath: string) {
        if (!lwsFilepath.toLowerCase().endsWith('.lws')) lwsFilepath += '.lws'
        const lwsPath = getPath(lwsFilepath).toLowerCase()
        this.inProgress.push(new Promise((resolve) => {
            try {
                const content = this.assetLoader.vfs.getFile(lwsFilepath).toText()
                const lwscData = new LWSCParser(lwsFilepath, content).parse()
                ResourceManager.resourceByName.set(lwsFilepath.toLowerCase(), lwscData)
                lwscData.objects.forEach((obj) => {
                    if (!obj.fileName) return
                    const lwoFilepath = lwsPath + obj.fileName
                    this.addLWOFile(lwoFilepath)
                    this.addLWOFile(lwoFilepath.replace('vlp', 'lp'), true)
                    this.addLWOFile(lwoFilepath.replace('vlp', 'mp'), true)
                    this.addLWOFile(lwoFilepath.replace('vlp', 'hp'), true)
                })
            } catch (e) {
                // XXX do we have to care? files listed in pilot.ae can be found in vehicles/hoverboard/ or not at all...
            }
            resolve()
        }))
    }

    addLWOFile(lwoFilepath: string, optional: boolean = false) {
        this.addAsset(this.assetLoader.loadLWOFile, lwoFilepath, optional)
        this.addAsset(this.assetLoader.loadUVFile, lwoFilepath.replace('.lwo', '.uv'), true)
    }

    addAlphaImageFolder(folderPath: string) {
        this.addAssetFolder(this.assetLoader.loadAlphaImageAsset, folderPath)
    }

    addTextureFolder(folderPath: string) {
        this.addAssetFolder(this.assetLoader.loadWadTexture, folderPath)
    }

    addAssetFolder<T>(callback: (name: string) => Promise<T>, folderPath: string) {
        this.assetLoader.vfs.filterEntryNames(`${folderPath}.+\\.bmp`).forEach((assetPath) => {
            this.addAsset(callback, assetPath)
        })
    }

    addMenuWithAssets(menuCfg: MenuCfg, menuImageAlpha: boolean = true) {
        menuCfg.menus.forEach((menuCfg) => {
            const method = menuImageAlpha ? this.assetLoader.loadAlphaImageAsset : this.assetLoader.loadWadImageAsset
            this.addAsset(method, menuCfg.menuImage)
            this.addAsset(this.assetLoader.loadFontImageAsset, menuCfg.menuFont)
            this.addAsset(this.assetLoader.loadFontImageAsset, menuCfg.loFont)
            this.addAsset(this.assetLoader.loadFontImageAsset, menuCfg.hiFont)
            let flhCallback = this.assetLoader.loadFlhAssetDefault
            if (menuCfg.title.equalsIgnoreCase('Main')) flhCallback = this.assetLoader.loadFlhAssetInterframe
            menuCfg.overlays.forEach((overlay) => this.addAsset(flhCallback, overlay.flhFilepath, true))
        })
    }

    addAsset<T>(method: (name: string) => Promise<T>, assetPath: string, optional = false, sfxKeys: string[] = []) {
        assetPath = assetPath?.toLowerCase()
        if (!assetPath || this.has(assetPath) || assetPath.equalsIgnoreCase('NULL')) {
            return // do not load assets twice
        }
        this.set(assetPath, {
            method: method.bind(this.assetLoader),
            assetPath: assetPath,
            optional: optional,
            sfxKeys: sfxKeys,
        })
    }
}
