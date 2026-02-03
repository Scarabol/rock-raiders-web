import { GameConfig } from '../cfg/GameConfig'
import { MenuCfg } from '../cfg/MenuCfg'
import { getPath, yieldToMainThread } from '../core/Util'
import { RonFileParser } from './fileparser/RonFileParser'
import { AlphaImageAssetLoader, AlphaTranslucentImageAssetLoader, AssetLoader, AVIAssetLoader, CreditsAssetLoader, FlhAssetLoader, FontAssetLoader, ImageAssetLoader, LWOAssetLoader, MapAssetLoader, NerpScriptAssetLoader, ObjectiveTextsAssetLoader, ObjectListAssetLoader, ProMeshLoader, SoundAssetLoader, TextureAssetLoader, UVAssetLoader } from './AssetLoader'
import { TOOLTIP_FONT_NAME } from '../params'
import { ResourceManager } from './ResourceManager'
import { AnimEntityParser } from './AnimEntityParser'
import { LWSCParser } from './fileparser/LWSCParser'
import { NerpMsgParser } from './fileparser/NerpMsgParser'
import { VirtualFileSystem } from './fileparser/VirtualFileSystem'

export class AssetRegistry {
    readonly assetLoaders: Map<string, AssetLoader<unknown>> = new Map()
    readonly inProgress: Promise<void>[] = []
    tooltipFontLoader: FontAssetLoader = new FontAssetLoader(TOOLTIP_FONT_NAME, 11)

    constructor(readonly vfs: VirtualFileSystem) {
    }

    async registerAllAssets(gameConfig: GameConfig): Promise<AssetLoader<unknown>[]> {
        // add fonts and cursors
        for (const assetPath of this.getImagesInFolder('Interface/Pointers/')) {
            this.addLoader(new AlphaImageAssetLoader(assetPath))
        }
        for (const assetPath of this.vfs.filterEntryNames(`Interface/Pointers/.+\\.flh`)) {
            this.addLoader(new FlhAssetLoader(assetPath, true, false))
        }
        this.addLoader(this.tooltipFontLoader)
        // add menu assets
        this.addMenuWithAssets(gameConfig.menu.mainMenuFull, false, 43)
        this.addMenuWithAssets(gameConfig.menu.pausedMenu, true, 17)
        this.addMenuWithAssets(gameConfig.menu.optionsMenu, true, 17)
        this.addLoader(new AlphaImageAssetLoader('Interface/BriefingPanel/BriefingPanel.bmp'))
        this.addLoader(new ObjectiveTextsAssetLoader('Languages/ObjectiveText.txt'))
        this.addLoader(new AlphaImageAssetLoader(gameConfig.dialog.image))
        this.addLoader(new AlphaImageAssetLoader(gameConfig.dialog.contrastOverlay))
        this.addLWSFile('Interface/FrontEnd/Rock_Wipe/RockWipe.lws')
        for (const assetPath of this.vfs.filterEntryNames(`Interface/FrontEnd/Rock_Wipe/.+\\.uv`)) {
            this.addLoader(new UVAssetLoader(assetPath))
        }
        this.addTextureFolder('Interface/FrontEnd/Rock_Wipe/')
        // add in-game assets
        this.addAlphaImageFolder('Interface/TopPanel/') // top panel
        this.addAlphaImageFolder('Interface/RightPanel/') // crystal sidebar
        this.addAlphaImageFolder('Interface/RadarPanel/')
        this.addAlphaImageFolder('Interface/MessagePanel/')
        this.addLoader(new ImageAssetLoader('Interface/Airmeter/msgpanel_air_juice.bmp'))
        this.addLoader(new AlphaImageAssetLoader('Interface/Airmeter/msgpanel_noair.bmp'))
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
        for (const assetPath of this.getImagesInFolder('Interface/FrontEnd/Vol_')) {
            this.addLoader(new AlphaTranslucentImageAssetLoader(assetPath))
        }
        for (const assetPath of this.getImagesInFolder('Interface/FrontEnd/lp_')) {
            this.addLoader(new ImageAssetLoader(assetPath))
        }
        for (const assetPath of this.getImagesInFolder('Interface/ToolTipIcons/')) {
            this.addLoader(new AlphaImageAssetLoader(assetPath))
        }
        this.addLoader(new AlphaImageAssetLoader('Interface/FrontEnd/LowerPanel.bmp'))
        this.addLoader(new AlphaImageAssetLoader(gameConfig.main.tutorialIcon))
        // level files
        this.addLoader(new NerpScriptAssetLoader('Levels/nerpnrn.h'))
        for (const level of gameConfig.levels) {
            // TODO Replace group separate level config loader with combined level config loader
            for (const bmpName of level.menuBMP) {
                this.addLoader(new AlphaImageAssetLoader(bmpName))
            }
            this.addLoader(new MapAssetLoader(level.surfaceMap))
            this.addLoader(new MapAssetLoader(level.predugMap))
            this.addLoader(new MapAssetLoader(level.terrainMap))
            this.addLoader(new MapAssetLoader(level.blockPointersMap, true))
            this.addLoader(new MapAssetLoader(level.cryOreMap, true))
            this.addLoader(new MapAssetLoader(level.pathMap, true))
            if (level.fallinMap) this.addLoader(new MapAssetLoader(level.fallinMap))
            if (level.erodeMap) this.addLoader(new MapAssetLoader(level.erodeMap))
            if (level.emergeMap) this.addLoader(new MapAssetLoader(level.emergeMap, true))
            this.addLoader(new ObjectListAssetLoader(level.oListFile))
            this.addLoader(new NerpScriptAssetLoader(level.nerpFile))
            const content = this.vfs.getFile(level.nerpMessageFile).toText()
            const nerpMessages = NerpMsgParser.parseNerpMessages(content)
            ResourceManager.resourceByName.set(level.nerpMessageFile.toLowerCase(), nerpMessages) // TODO Add nerp messages directly to level config
            for (const msg of nerpMessages) {
                if (msg.snd) this.addLoader(new SoundAssetLoader(msg.snd, [msg.snd]))
            }
        }
        // load all shared textures
        this.addTextureFolder('World/Shared/')
        this.addTextureFolder('Vehicles/SharedUG/')
        // load all entity upgrades
        for (const uType of Object.values(gameConfig.upgradeTypes)) {
            this.addMeshObjects(uType)
        }
        // load all building types
        for (const bType of Object.values(GameConfig.instance.buildingTypes)) this.addMeshObjects(bType)
        this.addTextureFolder('Buildings/E-Fence')
        this.addAnimatedEntity('mini-figures/pilot/pilot.ae')
        for (const adv of Object.values(gameConfig.advisor)) {
            this.addLWSFile(adv.animFileName)
            this.addTextureFolder(getPath(adv.animFileName))
        }
        // load monsters
        for (const mType of Object.values(GameConfig.instance.rockMonsterTypes)) this.addMeshObjects(mType)
        for (const assetPath of this.vfs.filterEntryNames(`Creatures/LavaMonster/.+\\.uv`)) {
            this.addLoader(new UVAssetLoader(assetPath))
        }
        await yieldToMainThread()
        // load vehicles
        for (const v of Object.values(GameConfig.instance.vehicleTypes)) {
            for (const vType of v) this.addMeshObjects(vType)
        }
        // load bubbles
        for (const b of Object.values(gameConfig.bubbles)) {
            this.addLoader(new AlphaImageAssetLoader(b))
        }
        // load misc objects
        this.addTextureFolder('MiscAnims/Crystal/')
        this.addTextureFolder('MiscAnims/Smoke/')
        this.addLoader(new LWOAssetLoader('World/Shared/Crystal.lwo')) // high-poly version
        this.addLoader(new TextureAssetLoader('MiscAnims/Ore/Ore.bmp'))
        this.addLoader(new TextureAssetLoader('MiscAnims/Effects/rockfall.bmp'))
        this.addLoader(new TextureAssetLoader('MiscAnims/Effects/rd_laserbolt.bmp'))
        this.addLoader(new TextureAssetLoader('MiscAnims/Effects/rd_laserbolt_x.bmp'))
        this.addLoader(new TextureAssetLoader('MiscAnims/Effects/rd_newstargreen.bmp'))
        for (const mType of Object.values(gameConfig.miscObjects)) {
            this.addMeshObjects(mType)
        }
        for (const entry of Object.values(gameConfig.rockFallStyles)) {
            for (const shape of [entry.threeSides, entry.outsideCorner, entry.tunnel]) {
                const textureFolder = shape.split('/').slice(0, -1).join('/')
                this.addTextureFolder(textureFolder)
                this.addLWSFile(shape)
            }
        }
        this.addLoader(new AlphaImageAssetLoader('Interface/Dependencies/+.bmp'))
        this.addLoader(new AlphaImageAssetLoader('Interface/Dependencies/=.bmp'))
        this.addLoader(new AVIAssetLoader(gameConfig.main.creditsBackAVI, true))
        this.addLoader(new CreditsAssetLoader(gameConfig.main.creditsTextFile))
        this.addLoader(new FontAssetLoader('Interface/Fonts/RSFont.bmp', 17))
        // surface textures
        this.addTextureFolder('World/WorldTextures/IceSplit/Ice')
        this.addTextureFolder('World/WorldTextures/LavaSplit/Lava')
        this.addTextureFolder('World/WorldTextures/RockSplit/Rock')
        for (const s of Object.values(gameConfig.textures.textureSetByName)) if (s.roofTexture) this.addLoader(new TextureAssetLoader(s.roofTexture))
        // pro meshes for high wall details
        const themes = ['rock', 'lava', 'ice']
        const nums = ['01', '02', '03', '04', '05', '10', '20', '21', '22', '23', '24', '25', '31', '31', '32', '33', '34', '35', '40', '51', '52', '53', '54', '55']
        for (const theme of themes) for (const num of nums) this.addLoader(new ProMeshLoader(theme, num))
        // reward screen
        this.addLoader(new ImageAssetLoader(gameConfig.reward.wallpaper))
        this.addLoader(new FontAssetLoader(gameConfig.reward.backFont, 17))
        for (const [key, imgPath] of Object.entries(gameConfig.reward.fonts)) this.addLoader(new FontAssetLoader(imgPath, key.toLowerCase() !== 'score' ? 43 : 26))
        for (const img of gameConfig.reward.images) this.addLoader(new AlphaImageAssetLoader(img.filePath))
        for (const img of gameConfig.reward.boxImages) this.addLoader(new ImageAssetLoader(img.filePath))
        for (const cfg of [gameConfig.reward.saveButton, gameConfig.reward.advanceButton]) {
            this.addLoader(new ImageAssetLoader(cfg.imgNormalFilepath))
            this.addLoader(new ImageAssetLoader(cfg.imgHoverFilepath))
            this.addLoader(new ImageAssetLoader(cfg.imgPressedFilepath))
            this.addLoader(new ImageAssetLoader(cfg.imgDisabledFilepath))
        }
        for (const f of Object.values(gameConfig.reward.flics)) {
            this.addLoader(new FlhAssetLoader(f.flhFilepath, true, false))
        }
        // sounds
        for (const [sndPath, sndKeys] of Object.entries(gameConfig.samples.pathToSfxKeys)) {
            this.addLoader(new SoundAssetLoader(sndPath, sndKeys))
        }
        await Promise.all(this.inProgress)
        return Array.from(this.assetLoaders.values())
    }

    addMeshObjects(basePath: string) {
        const aeFilepath = `${basePath}/${basePath.split('/').last()}.ae`
        if (this.vfs.hasEntry(aeFilepath)) this.addAnimatedEntity(aeFilepath)
        const aeSharedFilepath = `world/shared/${basePath.split('/').last()}.ae`
        if (this.vfs.hasEntry(aeSharedFilepath)) this.addAnimatedEntity(aeSharedFilepath)
        const lwsFilepath = `${basePath}.lws`
        if (this.vfs.hasEntry(lwsFilepath)) this.addLWSFile(lwsFilepath)
        const lwsSharedFilepath = `world/shared/${basePath.split('/').last()}.lws`
        if (this.vfs.hasEntry(lwsSharedFilepath)) this.addLWSFile(lwsSharedFilepath)
        const lwoFilepath = `${basePath}.lwo`
        if (this.vfs.hasEntry(lwoFilepath)) this.addLWOFile(lwoFilepath)
        const lwoSharedFilepath = `world/shared/${basePath.split('/').last()}.lwo`
        if (this.vfs.hasEntry(lwoSharedFilepath)) this.addLWOFile(lwoSharedFilepath)
    }

    addAnimatedEntity(aeFile: string) {
        const content = this.vfs.getFile(aeFile).toText()
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
        for (const polyType of [animData.highPolyBodies, animData.mediumPolyBodies, animData.lowPolyBodies]) {
            for (const filename of Object.values(polyType)) {
                this.addLWOFile(path + filename)
            }
        }
        // TODO add 'FPPoly' (contains usually two cameras)
        for (const a of animData.animations) {
            this.addLWSFile(a.file)
        }
    }

    addLWSFile(lwsFilepath: string) {
        if (!lwsFilepath.toLowerCase().endsWith('.lws')) lwsFilepath += '.lws'
        const lwsPath = getPath(lwsFilepath).toLowerCase()
        this.inProgress.push(new Promise((resolve) => {
            try {
                const content = this.vfs.getFile(lwsFilepath).toText()
                const lwscData = new LWSCParser(lwsFilepath, content).parse()
                ResourceManager.resourceByName.set(lwsFilepath.toLowerCase(), lwscData)
                for (const obj of lwscData.objects) {
                    if (!obj.fileName) continue
                    const lwoFilepath = lwsPath + obj.fileName
                    this.addLWOFile(lwoFilepath)
                    this.addLWOFile(lwoFilepath.replace('vlp', 'lp'), true)
                    this.addLWOFile(lwoFilepath.replace('vlp', 'mp'), true)
                    this.addLWOFile(lwoFilepath.replace('vlp', 'hp'), true)
                }
            } catch (e) {
                // XXX do we have to care? files listed in pilot.ae can be found in vehicles/hoverboard/ or not at all...
            }
            resolve()
        }))
    }

    addLWOFile(lwoFilepath: string, optional: boolean = false) {
        this.addLoader(new LWOAssetLoader(lwoFilepath, optional))
        this.addLoader(new UVAssetLoader(lwoFilepath.replace('.lwo', '.uv'), true))
    }

    addAlphaImageFolder(folderPath: string) {
        for (const assetPath of this.getImagesInFolder(folderPath)) {
            this.addLoader(new AlphaImageAssetLoader(assetPath))
        }
    }

    addTextureFolder(folderPath: string) {
        for (const assetPath of this.getImagesInFolder(folderPath)) {
            this.addLoader(new TextureAssetLoader(assetPath))
        }
    }

    private getImagesInFolder(folderPath: string): string[] {
        return this.vfs.filterEntryNames(`${folderPath}.+\\.bmp`)
    }

    addMenuWithAssets(menuCfg: MenuCfg, menuImageAlpha: boolean, fontCharHeight: number) {
        for (const menuCfgItem of menuCfg.menus) {
            this.addLoader(menuImageAlpha ? new AlphaImageAssetLoader(menuCfgItem.menuImage) : new ImageAssetLoader(menuCfgItem.menuImage))
            this.addLoader(new FontAssetLoader(menuCfgItem.menuFont, fontCharHeight))
            this.addLoader(new FontAssetLoader(menuCfgItem.loFont, fontCharHeight))
            this.addLoader(new FontAssetLoader(menuCfgItem.hiFont, fontCharHeight))
            const useInterFrameMode = menuCfgItem.title.equalsIgnoreCase('Main')
            for (const overlay of menuCfgItem.overlays) {
                this.addLoader(new FlhAssetLoader(overlay.flhFilepath, true, useInterFrameMode))
            }
        }
    }

    addLoader<T extends AssetLoader<unknown>>(loader: T): void {
        if (!loader.lAssetName || this.assetLoaders.has(loader.lAssetName) || loader.lAssetName.equalsIgnoreCase('NULL')) return
        this.assetLoaders.set(loader.lAssetName, loader)
        loader.assetRegistry = this
    }

    getLoader<T extends AssetLoader<unknown>>(assetName: string): T {
        const loader = this.assetLoaders.get(assetName.toLowerCase())
        if (!loader) throw new Error(`No asset loader registered for "${assetName}"`)
        return loader as T // XXX Do some kind of type checking?
    }
}
