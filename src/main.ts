import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../site/main.css'
import { WadWorkerMessage } from './resource/wadworker/WadWorkerMessage'
import { WorkerMessageType } from './worker/WorkerMessageType'
import { ResourceManager } from './resource/ResourceManager'
import { SoundManager } from './audio/SoundManager'
import { WadLoader } from './resource/wadworker/WadLoader'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { yieldToMainThread } from './core/Util'
import { GameScreen } from './screen/GameScreen'
import { RewardScreen } from './screen/RewardScreen'
import { GameState } from './game/model/GameState'
import { DEV_MODE, TOOLTIP_FONT_NAME } from './params'
import { ObjectListLoader } from './game/ObjectListLoader'
import { SaveGameManager } from './resource/SaveGameManager'
import { TypedWorkerFallback } from './worker/TypedWorker'
import { InitLoadingMessage } from './resource/wadworker/InitLoadingMessage'
import { WorkerResponse } from './worker/WorkerResponse'
import { WadWorker } from './resource/wadworker/WadWorker'
import { ScreenMaster } from './screen/ScreenMaster'
import { TooltipLayer } from './screen/layer/TooltipLayer'
import { WadFileSelectionModal } from '../site/wadModal/WadFileSelectionModal'
import { GithubBox } from '../site/github/github-box'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { GameResult } from './game/model/GameResult'
import { EventBus } from './event/EventBus'
import { ChangeCursor } from './event/GuiCommand'
import { Cursor } from './resource/Cursor'

function onWadLoaderMessage(msg: WadWorkerMessage) {
    switch (msg.type) {
        case WorkerMessageType.DOWNLOAD_PROGRESS:
            wadFileSelectModal.setProgress(msg.wadFileIndex, msg.loadedBytes, msg.totalBytes)
            break
        case WorkerMessageType.ASSET:
            msg.assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), msg.assetObj))
            msg.sfxKeys?.forEach((sfxKey) => SoundManager.sfxBuffersByKey.getOrUpdate(sfxKey, () => []).push(msg.assetObj))
            screenMaster.loadingLayer.increaseLoadingState()
            break
        case WorkerMessageType.MSG:
            wadFileSelectModal.hide()
            screenMaster.loadingLayer.setLoadingMessage(msg.text)
            break
        case WorkerMessageType.CFG:
            ResourceManager.configuration = msg.cfg
            ResourceManager.startBitmapFontRenderPool()
            screenMaster.loadingLayer.enableGraphicMode(msg.totalResources)
            ResourceManager.loadDefaultCursor().then(() => EventBus.publishEvent(new ChangeCursor(Cursor.STANDARD)))
            break
        case WorkerMessageType.CACHE_MISS:
            wadFileSelectModal.show()
            break
        case WorkerMessageType.DONE:
            WadLoader.bitmapWorkerPool.terminatePool()
            Promise.all([
                ResourceManager.loadAllCursor(),
                ResourceManager.addFont('Interface/FrontEnd/Menu_Font_Hi.bmp'),
                ResourceManager.addFont('Interface/FrontEnd/Menu_Font_Lo.bmp'),
                ResourceManager.addFont('Interface/Fonts/FSFont.bmp'),
                ResourceManager.addFont('Interface/Fonts/RSWritten.bmp'),
                ResourceManager.addFont(TOOLTIP_FONT_NAME),
            ]).then(async () => {
                console.timeEnd('Total asset loading time')
                console.log(`Loading of about ${msg.totalResources} assets complete!`)
                // complete setup
                screenMaster.addLayer(new TooltipLayer(), 1000).show()
                const mainMenuScreen = new MainMenuScreen(screenMaster)
                await yieldToMainThread()
                new GameScreen(screenMaster)
                await yieldToMainThread()
                const rewardScreen = new RewardScreen(screenMaster)
                await yieldToMainThread()

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
            break
    }
}

const wadWorker = new TypedWorkerFallback<InitLoadingMessage, WorkerResponse>((r) => onWadLoaderMessage(r))
new WadWorker(wadWorker as TypedWorkerFallback<InitLoadingMessage, WorkerResponse>)
SaveGameManager.loadPreferences()
SaveGameManager.loadSaveGames()
SaveGameManager.loadSaveGameScreenshots()
if (DEV_MODE) SaveGameManager.loadGame(0)
const screenMaster = new ScreenMaster()
const wadFileSelectModal = new WadFileSelectionModal('game-container', (wad0Url: string, wad1Url: string) => {
    wadWorker.sendMessage(new InitLoadingMessage(wad0Url, wad1Url))
})
const githubBox = new GithubBox('game-container')
const clearCacheButton = new ClearCacheButton('game-container')

// start the game by loading resources
wadWorker.sendMessage(null)
