import { GameFilesLoader } from './resource/GameFilesLoader'
import { DEFAULT_FONT_NAME, TOOLTIP_FONT_NAME, VERBOSE } from './params'
import { ScreenMaster } from './screen/ScreenMaster'
import { GithubBox } from '../site/github/github-box'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { AssetLoader } from './resource/AssetLoader'
import { Cursor } from './resource/Cursor'
import { ResourceManager } from './resource/ResourceManager'
import { GameConfig } from './cfg/GameConfig'
import { BitmapFontWorkerPool } from './worker/BitmapFontWorkerPool'
import { GameModule } from './GameModule'
import { CursorManager } from './screen/CursorManager'
import { DependencySpriteWorkerPool } from './worker/DependencySpriteWorkerPool'
import { BitmapFontData } from './core/BitmapFont'

export async function start() {
    console.time('Total asset loading time')
    const githubBox = new GithubBox()
    const clearCacheButton = new ClearCacheButton()
    const screenMaster = new ScreenMaster()
    const vfs = await new GameFilesLoader(screenMaster.loadingLayer).loadGameFiles()
    const assetLoader = new AssetLoader(vfs)
    screenMaster.loadingLayer.setLoadingMessage('Loading initial assets...')
    await Promise.all([
        new Promise<void>(async (resolve) => {
            const name = GameConfig.instance.main.loadScreen // loading screen image
            const data = await assetLoader.loadWadImageAsset(name)
            ResourceManager.resourceByName.set(name.toLowerCase(), data)
            resolve()
        }),
        new Promise<void>(async (resolve) => {
            const name = GameConfig.instance.main.progressBar // loading bar container image
            const data = await assetLoader.loadWadImageAsset(name)
            ResourceManager.resourceByName.set(name.toLowerCase(), data)
            resolve()
        }),
        new Promise<void>(async (resolve) => {
            const name = GameConfig.instance.pointers.get(Cursor.STANDARD)
            const data = await assetLoader.loadAlphaImageAsset(name)
            ResourceManager.resourceByName.set(name.toLowerCase(), data)
            resolve()
        }),
        new Promise<void>(async (resolve) => {
            const data = await assetLoader.loadFontImageAsset(DEFAULT_FONT_NAME)
            ResourceManager.resourceByName.set(DEFAULT_FONT_NAME.toLowerCase(), data)
            resolve()
        }),
    ])
    const imgBackground = ResourceManager.getImage(GameConfig.instance.main.loadScreen)
    const imgProgress = ResourceManager.getImage(GameConfig.instance.main.progressBar)
    const fontData = ResourceManager.getResource(DEFAULT_FONT_NAME)
    BitmapFontWorkerPool.instance.setupPool(DEFAULT_FONT_NAME, fontData)
    const imgLabel = await BitmapFontWorkerPool.instance.createTextImage(DEFAULT_FONT_NAME, GameConfig.instance.main.loadingText)
    screenMaster.loadingLayer.enableGraphicMode(imgBackground, imgProgress, imgLabel)
    const cursorImageName = GameConfig.instance.pointers.get(Cursor.STANDARD)
    ResourceManager.loadCursor(cursorImageName, Cursor.STANDARD).then(() => CursorManager.changeCursor(Cursor.STANDARD))
    if (VERBOSE) console.log('Initial loading done.')
    await assetLoader.assetRegistry.registerAllAssets(GameConfig.instance) // dynamically register all assets from config
    await assetLoader.loadRegisteredAssets((progress) => screenMaster.loadingLayer.setLoadingProgress(progress))
    await Promise.all([
        ResourceManager.loadAllCursor(),
        ...['Interface/FrontEnd/Menu_Font_Hi.bmp',
            'Interface/FrontEnd/Menu_Font_Lo.bmp',
            'Interface/Fonts/FSFont.bmp',
            'Interface/Fonts/RSFont.bmp',
            'Interface/Fonts/RSWritten.bmp',
            TOOLTIP_FONT_NAME,
            'Interface/Fonts/MbriefFont2.bmp',
            'Interface/Fonts/MbriefFont.bmp',
        ].map((fontName) => {
            BitmapFontWorkerPool.instance.addFont(fontName, ResourceManager.getResource(fontName))
        })
    ])
    AssetLoader.bitmapWorkerPool.terminatePool()
    console.timeEnd('Total asset loading time')
    console.log(`Loading of about ${(assetLoader.assetRegistry.size)} assets complete!`)
    screenMaster.loadingLayer.hide()
    githubBox.hide()
    clearCacheButton.hide()

    const teleportManConfig = GameConfig.instance.interfaceImages.get('Interface_MenuItem_TeleportMan'.toLowerCase())
    const depInterfaceBuildImageData: Map<string, ImageData[]> = new Map()
    GameConfig.instance.interfaceBuildImages.forEach((cfg, key) => {
        depInterfaceBuildImageData.set(key, [ResourceManager.getImageData(cfg.normalFile), ResourceManager.getImageData(cfg.disabledFile)])
    })
    DependencySpriteWorkerPool.instance.setupPool({
        teleportManNormal: ResourceManager.getImageData(teleportManConfig.normalFile),
        teleportManDisabled: ResourceManager.getImageData(teleportManConfig.disabledFile),
        tooltipFontData: ResourceManager.getResource(TOOLTIP_FONT_NAME) as BitmapFontData,
        plusSign: ResourceManager.getImageData('Interface/Dependencies/+.bmp'),
        equalSign: ResourceManager.getImageData('Interface/Dependencies/=.bmp'),
        depInterfaceBuildImageData: depInterfaceBuildImageData,
    })

    let game = new GameModule(screenMaster)
    if (import.meta.hot) {
        import.meta.hot.accept('./GameModule', (mNs) => {
            try {
                game.dispose()
                game = new mNs.GameModule(screenMaster)
            } catch (e) {
                console.error(e)
            }
        })
    }
}
