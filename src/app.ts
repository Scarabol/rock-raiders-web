import { GameFilesLoader } from './resource/GameFilesLoader'
import { SaveGameManager } from './resource/SaveGameManager'
import { DEFAULT_FONT_NAME, DEV_MODE, TOOLTIP_FONT_NAME } from './params'
import { ScreenMaster } from './screen/ScreenMaster'
import { GithubBox } from '../site/github/github-box'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { AssetLoader } from './resource/AssetLoader'
import { CfgFileParser } from './resource/fileparser/CfgFileParser'
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
import { SoundManager } from './audio/SoundManager'

export async function start() {
    SaveGameManager.loadPreferences()
    SaveGameManager.loadSaveGames()
    SaveGameManager.loadSaveGameScreenshots()
    if (DEV_MODE) SaveGameManager.loadGame(0)
    const screenMaster = new ScreenMaster()
    const githubBox = new GithubBox('game-container')
    const clearCacheButton = new ClearCacheButton('game-container')
    const gameFilesLoader = new GameFilesLoader(screenMaster)
    const cabFile = await gameFilesLoader.loadGameFiles()
    const wad0File = await cabFile.getFileBuffer('Program Data Files/LegoRR0.wad')
    const wad1File = await cabFile.getFileBuffer('0007-German Files/LegoRR1.wad') // TODO support other languages
    const assetLoader = new AssetLoader(cabFile, wad0File, wad1File)
    screenMaster.loadingLayer.setLoadingMessage('Loading configuration...')
    const cfgFiles = assetLoader.wad1File.filterEntryNames('\\.cfg')
    if (cfgFiles.length < 1) throw new Error('Invalid second WAD file given! No config file present at root level.')
    if (cfgFiles.length > 1) console.warn(`Found multiple config files ${cfgFiles} will proceed with first one ${cfgFiles[0]} only`)
    ResourceManager.configuration = await CfgFileParser.parse(assetLoader.wad1File.getEntryData(cfgFiles[0]))
    await assetLoader.assetRegistry.registerAllAssets(ResourceManager.configuration) // dynamically register all assets from config
    screenMaster.loadingLayer.setLoadingMessage('Loading initial assets...')
    await Promise.all([
        new Promise<void>((resolve) => {
            const name = ResourceManager.configuration.main.loadScreen // loading screen image
            assetLoader.loadWadImageAsset(name, (assetNames: string[], assetObj) => {
                assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                resolve()
            })
        }),
        new Promise<void>((resolve) => {
            const name = ResourceManager.configuration.main.progressBar // loading bar container image
            assetLoader.loadWadImageAsset(name, (assetNames: string[], assetObj) => {
                assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                resolve()
            })
        }),
        new Promise<void>((resolve) => {
            const name = ResourceManager.configuration.pointers.get(Cursor.STANDARD) as string
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
    ResourceManager.startBitmapFontRenderPool()
    ResourceManager.loadDefaultCursor().then(() => EventBus.publishEvent(new ChangeCursor(Cursor.STANDARD)))
    console.log('Initial loading done.')
    const promises: Promise<void>[] = []
    assetLoader.assetRegistry.forEach((asset) => {
        promises.push(new Promise<void>((resolve) => {
            setTimeout(() => {
                try {
                    asset.method(asset.assetPath, (assetNames, assetObj) => {
                        assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                        asset.sfxKeys?.forEach((sfxKey) => SoundManager.sfxBuffersByKey.getOrUpdate(sfxKey, () => []).push(assetObj))
                        screenMaster.loadingLayer.increaseLoadingState()
                        resolve()
                    })
                } catch (e) {
                    if (!asset.optional) console.error(e)
                    screenMaster.loadingLayer.increaseLoadingState()
                    resolve()
                }
            })
        }))
    })
    Promise.all(promises).then(() => {
        AssetLoader.bitmapWorkerPool.terminatePool()
        Promise.all([
            ResourceManager.loadAllCursor(),
            ResourceManager.addFont('Interface/FrontEnd/Menu_Font_Hi.bmp'),
            ResourceManager.addFont('Interface/FrontEnd/Menu_Font_Lo.bmp'),
            ResourceManager.addFont('Interface/Fonts/FSFont.bmp'),
            ResourceManager.addFont('Interface/Fonts/RSWritten.bmp'),
            ResourceManager.addFont(TOOLTIP_FONT_NAME),
        ]).then(async () => {
            console.timeEnd('Total asset loading time')
            console.log(`Loading of about ${(assetLoader.assetRegistry.size)} assets complete!`)
            // complete setup
            screenMaster.addLayer(new TooltipLayer(), 1000).show()
            const mainMenuScreen = new MainMenuScreen(screenMaster)
            new GameScreen(screenMaster)
            const rewardScreen = new RewardScreen(screenMaster)

            // setup complete
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
                ObjectListLoader.startVehicle = params.get('vehicle')
                const loadGame = params.get('loadGame')
                if (loadGame !== null) SaveGameManager.loadGame(Number(loadGame))
                if (entry === 'level') mainMenuScreen.showLevelSelection()
                else if (entry === 'reward') rewardScreen.showGameResult(GameResult.random())
                else if (entry === 'random') mainMenuScreen.selectLevel(`Level${Math.randomInclusive(1, 25).toPadded()}`)
                else if (entry) mainMenuScreen.selectLevel(entry)
            } else {
                mainMenuScreen.showMainMenu()
            }
        })
    })
}
