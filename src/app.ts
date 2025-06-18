import { GameFilesLoader } from './resource/GameFilesLoader'
import { DEFAULT_FONT_NAME, TOOLTIP_FONT_NAME, VERBOSE } from './params'
import { ScreenMaster } from './screen/ScreenMaster'
import { AssetLoader } from './resource/AssetLoader'
import { ResourceManager } from './resource/ResourceManager'
import { GameConfig } from './cfg/GameConfig'
import { BitmapFontWorkerPool } from './worker/BitmapFontWorkerPool'
import { GameModule } from './GameModule'
import { CursorManager } from './screen/CursorManager'
import { DependencySpriteWorkerPool } from './worker/DependencySpriteWorkerPool'
import { BitmapFont, BitmapFontData } from './core/BitmapFont'
import { BitmapWorkerPool } from './worker/BitmapWorkerPool'
import { ConsoleIntegration } from './ConsoleIntegration'
import { SaveGameManager } from './resource/SaveGameManager'
import { CfgFileParser } from './resource/fileparser/CfgFileParser'
import { createCanvas, createContext, imgDataToCanvas } from './core/ImageHelper'
import { SpriteImage } from './core/Sprite'
import { cacheGetData, cachePutData } from './resource/AssetCacheHelper'
import { AnimatedCursorData } from './screen/AnimatedCursor'
import { BitmapWithPalette } from './resource/fileparser/BitmapWithPalette'
import { InterfaceImageEntryCfg } from './cfg/InterfaceImageCfg'

declare global {
    interface Window {
        rr: ConsoleIntegration;
    }
}

export async function start() {
    if (window) window.rr = new ConsoleIntegration()
    SaveGameManager.loadPreferences()
    const screenMaster = new ScreenMaster()
    const vfs = await new GameFilesLoader(screenMaster.loadingLayer).loadGameFiles()
    screenMaster.loadingLayer.show()
    screenMaster.loadingLayer.setLoadingMessage('Loading configuration...')
    const cfgFiles = vfs.filterEntryNames('\\.cfg')
    if (cfgFiles.length < 1) throw new Error('Invalid second WAD file given! No config file present at root level.')
    if (cfgFiles.length > 1) console.warn(`Found multiple config files (${cfgFiles}) will proceed with first one "${cfgFiles[0]}" only`)
    const result = CfgFileParser.parse(vfs.getFile(cfgFiles[0]).toArray())
    console.log('Game configuration parsed', result)
    GameConfig.instance.setFromRecord(result)
    if (SaveGameManager.preferences.playVideos) await screenMaster.videoLayer.playVideo(`data/${GameConfig.instance.main.rrAvi}`)
    screenMaster.loadingLayer.setLoadingMessage('Loading initial assets...')
    const cursorImageName = GameConfig.instance.pointers.standard.fileName
    await cacheGetData(cursorImageName).then((animatedCursorData) => {
        if (!animatedCursorData) {
            const fileData = vfs.getFile(cursorImageName).toDataView()
            const imgData = BitmapWithPalette.decode(fileData).applyAlpha()
            const cursorImage = createCanvas(imgData.width, imgData.height)
            const context = cursorImage.getContext('2d')
            if (!context) {
                console.warn('Could not get context to draw cursor on canvas')
            } else {
                context.putImageData(imgData, 0, 0)
            }
            animatedCursorData = new AnimatedCursorData([cursorImage])
            cachePutData(cursorImageName, animatedCursorData).then()
        }
        CursorManager.addCursor('standard', animatedCursorData.dataUrls)
        CursorManager.changeCursor('standard')
    })
    Promise.all([
        new Promise<SpriteImage>(async (resolve) => {
            const loadingScreenImageName = GameConfig.instance.main.loadScreen
            const fileData = vfs.getFile(loadingScreenImageName).toDataView()
            const imgData = BitmapWithPalette.decode(fileData)
            // TODO Caching the patched image should be faster
            const context = createContext(imgData.width, imgData.height)
            context.putImageData(imgData, 0, 0)
            context.fillStyle = '#f00'
            context.fillRect(38, 9, 131, 131)
            resolve(context.canvas)
        }),
        new Promise<SpriteImage>(async (resolve) => {
            const loadingBarImageName = GameConfig.instance.main.progressBar
            const fileData = vfs.getFile(loadingBarImageName).toDataView()
            const imgData = BitmapWithPalette.decode(fileData)
            resolve(imgDataToCanvas(imgData))
        }),
        new Promise<SpriteImage>(async (resolve) => {
            const fileData = vfs.getFile(DEFAULT_FONT_NAME).toDataView()
            const imgData = BitmapWithPalette.decode(fileData)
            const fontData = new BitmapFontData(imgData)
            BitmapFontWorkerPool.instance.setupPool(DEFAULT_FONT_NAME, fontData)
            // waiting for actual pool here, is about 10 times longer
            const loadingText = GameConfig.instance.main.loadingText
            const imgLabel = new BitmapFont(fontData).createTextImage(loadingText)
            if (!imgLabel) throw new Error('Could not create loading text image')
            resolve(imgLabel)
        }),
    ]).then(([imgBackground, imgProgress, imgLabel]) => {
        screenMaster.loadingLayer.enableGraphicMode(imgBackground, imgProgress, imgLabel)
        if (VERBOSE) console.log('Initial loading done.')
    })
    const bitmapWorkerPool = new BitmapWorkerPool().startPool(16, undefined)
    const assetLoader = new AssetLoader(vfs, bitmapWorkerPool)
    await assetLoader.assetRegistry.registerAllAssets(GameConfig.instance) // dynamically register all assets from config
    await assetLoader.loadRegisteredAssets((progress) => screenMaster.loadingLayer.setLoadingProgress(progress))
    bitmapWorkerPool.terminatePool()
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
    console.timeEnd('Total asset loading time')
    console.log(`Loading of about ${(assetLoader.assetRegistry.size)} assets complete!`)
    vfs.dispose()
    screenMaster.loadingLayer.hide()
    Array.from(document.getElementsByClassName('hide-after-loading-assets')).forEach((e) => {
        (e as HTMLElement).style.visibility = 'hidden'
    })

    const teleportManConfig = GameConfig.instance.interfaceImages.teleportMan
    const teleportManNormal = ResourceManager.getImageData(teleportManConfig.normalFile)
    const teleportManDisabled = ResourceManager.getImageData(teleportManConfig.disabledFile)
    const teleportManImageData: Map<string, [ImageData, ImageData]> = new Map()
    teleportManImageData.set('Interface_MenuItem_TeleportMan'.toLowerCase(), [teleportManNormal, teleportManDisabled])
    const depInterfaceBuildImageData: Map<string, [ImageData, ImageData]> = new Map()
    Object.entries(GameConfig.instance.interfaceBuildImages).forEach(([key, cfg]: [string, InterfaceImageEntryCfg]) => {
        depInterfaceBuildImageData.set(key, [ResourceManager.getImageData(cfg.normalFile), ResourceManager.getImageData(cfg.disabledFile)])
    })
    DependencySpriteWorkerPool.instance.setupPool({
        teleportManImageData: teleportManImageData,
        tooltipFontData: ResourceManager.getResource(TOOLTIP_FONT_NAME) as BitmapFontData,
        plusSign: ResourceManager.getImageData('Interface/Dependencies/+.bmp'),
        equalSign: ResourceManager.getImageData('Interface/Dependencies/=.bmp'),
        depInterfaceBuildImageData: depInterfaceBuildImageData,
    })

    let game = new GameModule(screenMaster)
    if (import.meta.hot) {
        import.meta.hot.accept('./GameModule', (mNs) => {
            if (!mNs) return
            try {
                game.dispose()
                game = new mNs.GameModule(screenMaster)
            } catch (e) {
                console.error(e)
            }
        })
    }
}
