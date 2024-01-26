import { GameFilesLoader } from './resource/GameFilesLoader'
import { SaveGameManager } from './resource/SaveGameManager'
import { DEFAULT_FONT_NAME, DEV_MODE, TOOLTIP_FONT_NAME } from './params'
import { ScreenMaster } from './screen/ScreenMaster'
import { GithubBox } from '../site/github/github-box'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { AssetLoader } from './resource/AssetLoader'
import { Cursor } from './resource/Cursor'
import { ResourceManager } from './resource/ResourceManager'
import { EventBus } from './event/EventBus'
import { ChangeCursor } from './event/GuiCommand'
import { TooltipLayer } from './screen/layer/TooltipLayer'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { GameScreen } from './screen/GameScreen'
import { RewardScreen } from './screen/RewardScreen'
import { GameState } from './game/model/GameState'
import { ObjectListLoader } from './game/ObjectListLoader'
import { GameResult } from './game/model/GameResult'
import { GameConfig } from './cfg/GameConfig'
import { BitmapFontWorkerPool } from './worker/BitmapFontWorkerPool'

export async function start() {
    console.time('Total asset loading time')
    SaveGameManager.loadPreferences()
    SaveGameManager.loadSaveGames()
    SaveGameManager.loadSaveGameScreenshots()
    if (DEV_MODE) SaveGameManager.loadGame(0)
    const screenMaster = new ScreenMaster()
    const githubBox = new GithubBox('game-container')
    const clearCacheButton = new ClearCacheButton('game-container')
    const vfs = await new GameFilesLoader(screenMaster).loadGameFiles()
    const assetLoader = new AssetLoader(vfs)
    await assetLoader.assetRegistry.registerAllAssets(GameConfig.instance) // dynamically register all assets from config
    screenMaster.loadingLayer.setLoadingMessage('Loading initial assets...')
    await Promise.all([
        new Promise<void>((resolve) => {
            const name = GameConfig.instance.main.loadScreen // loading screen image
            assetLoader.loadWadImageAsset(name, (assetNames: string[], assetObj) => {
                assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                resolve()
            })
        }),
        new Promise<void>((resolve) => {
            const name = GameConfig.instance.main.progressBar // loading bar container image
            assetLoader.loadWadImageAsset(name, (assetNames: string[], assetObj) => {
                assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                resolve()
            })
        }),
        new Promise<void>((resolve) => {
            const name = GameConfig.instance.pointers.get(Cursor.STANDARD)
            assetLoader.loadAlphaImageAsset(name, (assetNames: string[], assetObj) => {
                assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                resolve()
            })
        }),
        new Promise<void>((resolve) => {
            assetLoader.loadFontImageAsset(DEFAULT_FONT_NAME, (assetNames: string[], assetObj) => {
                assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                resolve()
            })
        }),
    ])
    screenMaster.loadingLayer.enableGraphicMode(assetLoader.assetRegistry.size)
    const fontData = ResourceManager.getResource(DEFAULT_FONT_NAME)
    BitmapFontWorkerPool.instance.setupPool(DEFAULT_FONT_NAME, fontData)
    const cursorImageName = GameConfig.instance.pointers.get(Cursor.STANDARD)
    ResourceManager.loadCursor(cursorImageName, Cursor.STANDARD).then(() => EventBus.publishEvent(new ChangeCursor(Cursor.STANDARD)))
    console.log('Initial loading done.')
    await assetLoader.loadRegisteredAssets(() => screenMaster.loadingLayer.increaseLoadingState())
    AssetLoader.bitmapWorkerPool.terminatePool()
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
    screenMaster.addLayer(new TooltipLayer(), 1000).show()
    const mainMenuScreen = new MainMenuScreen(screenMaster)
    new GameScreen(screenMaster)
    const rewardScreen = new RewardScreen(screenMaster)

    screenMaster.loadingLayer.hide()
    githubBox.hide()
    clearCacheButton.hide()
    const params = new URLSearchParams(window.location.search)
    const entry = params.get('entry')

    if (DEV_MODE && entry) {
        GameState.numCrystal = Number(params.get('numCrystal')) || 0
        GameState.numOre = Number(params.get('numOre')) || 0
        GameState.numBrick = Number(params.get('numBrick')) || 0
        ObjectListLoader.numRaider = Number(params.get('numRaider')) || 0
        ObjectListLoader.startVehicle = params.get('vehicle') || ''
        const loadGame = params.get('loadGame')
        if (loadGame !== null) SaveGameManager.loadGame(Number(loadGame))
        if (entry === 'level') mainMenuScreen.showLevelSelection()
        else if (entry === 'reward') rewardScreen.showGameResult(GameResult.random())
        else if (entry === 'random') mainMenuScreen.selectLevel(`Level${Math.randomInclusive(1, 25).toPadded()}`)
        else if (entry === 'credits') mainMenuScreen.showCredits()
        else if (entry) mainMenuScreen.selectLevel(entry)
    } else {
        mainMenuScreen.showMainMenu()
    }
}
