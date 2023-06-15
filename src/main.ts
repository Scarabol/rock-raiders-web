import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../site/main.css'
import { WadWorkerMessage } from './resource/wadworker/WadWorkerMessage'
import { WorkerMessageType } from './resource/wadworker/WorkerMessageType'
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
import { TypedWorker, TypedWorkerFallback } from './worker/TypedWorker'
import { InitLoadingMessage } from './resource/wadworker/InitLoadingMessage'
import { WorkerResponse } from './worker/WorkerResponse'
import { WadWorker } from './resource/wadworker/WadWorker'
import { ScreenMaster } from './screen/ScreenMaster'
import { LoadingLayer } from './screen/layer/LoadingLayer'
import { CursorLayer } from './screen/layer/CursorLayer'
import { WadFileSelectionModal } from '../site/wadModal/WadFileSelectionModal'
import { GithubBox } from '../site/github/github-box'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { GameResult } from './game/model/GameResult'

function onWadLoaderMessage(msg: WadWorkerMessage) {
    switch (msg.type) {
        case WorkerMessageType.DOWNLOAD_PROGRESS:
            wadFileSelectModal.setProgress(msg.wadFileIndex, msg.loadedBytes, msg.totalBytes)
            break
        case WorkerMessageType.ASSET:
            msg.assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), msg.assetObj))
            msg.sfxKeys?.forEach((sfxKey) => SoundManager.sfxByKey.set(sfxKey, msg.assetObj))
            loadingLayer.increaseLoadingState()
            break
        case WorkerMessageType.MSG:
            wadFileSelectModal.hide()
            loadingLayer.setLoadingMessage(msg.text)
            break
        case WorkerMessageType.CFG:
            ResourceManager.configuration = msg.cfg
            ResourceManager.startBitmapFontRenderPool()
            ResourceManager.loadDefaultCursor().then(() => {
                loadingLayer.enableGraphicMode(msg.totalResources)
                screenMaster.addLayer(new CursorLayer(), 1000).show()
            })
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
                const mainMenuScreen = new MainMenuScreen(screenMaster)
                await yieldToMainThread()
                const gameScreen = new GameScreen(screenMaster)
                await yieldToMainThread()
                const rewardScreen = new RewardScreen(screenMaster)
                await yieldToMainThread()

                mainMenuScreen.onLevelSelected = (levelName) => {
                    try {
                        gameScreen.startLevel(levelName)
                    } catch (e) {
                        console.error(`Could not load level: ${levelName}`, e)
                        gameScreen.hide()
                        mainMenuScreen.showLevelSelection()
                    }
                }
                gameScreen.onLevelEnd = (result) => {
                    if (result) {
                        rewardScreen.showGameResult(result)
                    } else {
                        GameState.reset()
                        mainMenuScreen.showLevelSelection()
                    }
                }
                rewardScreen.onAdvance = () => {
                    GameState.reset()
                    mainMenuScreen.showLevelSelection()
                }

                // setup complete
                loadingLayer.hide()
                githubBox.hide()
                clearCacheButton.hide()
                const params = new URLSearchParams(window.location.search)
                const entry = params.get('entry')
                if (DEV_MODE && entry) {
                    GameState.numCrystal = Number(params.get('numCrystal')) || 0
                    GameState.numOre = Number(params.get('numOre')) || 0
                    GameState.numBrick = Number(params.get('numBrick')) || 0
                    ObjectListLoader.numRaider = Number(params.get('numRaider')) || 0
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

let wadWorker: TypedWorker<InitLoadingMessage, WorkerResponse>
// try {
//     wadWorker = new TypedWorkerFrontend(new Worker(new URL('./resource/wadworker/WadWorker', import.meta.url), {type: 'module'}), (msg: WorkerResponse) => onWadLoaderMessage(msg))
// } catch (e) {
//     console.warn('Could not set up threaded worker!\nUsing fallback to main thread, expect reduced performance.', e)
wadWorker = new TypedWorkerFallback<InitLoadingMessage, WorkerResponse>((r) => onWadLoaderMessage(r))
new WadWorker(wadWorker as TypedWorkerFallback<InitLoadingMessage, WorkerResponse>)
// }
SaveGameManager.loadPreferences()
SaveGameManager.loadSaveGames()
SaveGameManager.loadSaveGameScreenshots()
if (DEV_MODE) SaveGameManager.loadGame(0)
const screenMaster = new ScreenMaster()
const loadingLayer = screenMaster.addLayer(new LoadingLayer(), 0)
const wadFileSelectModal = new WadFileSelectionModal('game-container', (wad0Url: string, wad1Url: string) => {
    wadWorker.sendMessage(new InitLoadingMessage(wad0Url, wad1Url))
})
const githubBox = new GithubBox('game-container')
const clearCacheButton = new ClearCacheButton('game-container')

// start the game by loading resources
loadingLayer.show()
wadWorker.sendMessage(null)
