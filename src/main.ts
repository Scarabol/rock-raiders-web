import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { GithubBox } from '../site/github/github-box'
import '../site/main.css'
import { WadFileSelectionModal } from '../site/wadModal/WadFileSelectionModal'
import { SoundManager } from './audio/SoundManager'
import { GameState } from './game/model/GameState'
import { ObjectListLoader } from './game/ObjectListLoader'
import { DEV_MODE } from './params'
import { ResourceManager } from './resource/ResourceManager'
import { SaveGameManager } from './resource/SaveGameManager'
import { InitLoadingMessage } from './resource/wadworker/InitLoadingMessage'
import { WadSystem } from './resource/wadworker/WadSystem'
import { WadWorkerMessage } from './resource/wadworker/WadWorkerMessage'
import { WorkerMessageType } from './resource/wadworker/WorkerMessageType'
import { GameScreen } from './screen/GameScreen'
import { CursorLayer } from './screen/layer/CursorLayer'
import { LoadingLayer } from './screen/layer/LoadingLayer'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { RewardScreen } from './screen/RewardScreen'
import { ScreenMaster } from './screen/ScreenMaster'
import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from './worker/TypedWorker'

if (DEV_MODE) console.warn('DEV MODE ACTIVE')
console.log(`Rock Raider Web v${APP_VERSION}`)

// setup and link all components
console.time('Total asset loading time')

function onWadLoaderMessage(msg: WadWorkerMessage) {
    switch (msg.type) {
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
            ResourceManager.loadDefaultCursor().then(() => {
                loadingLayer.enableGraphicMode(msg.totalResources)
                cursorLayer.show()
            })
            break
        case WorkerMessageType.CACHE_MISS:
            wadFileSelectModal.show()
            break
        case WorkerMessageType.DONE:
            ResourceManager.loadAllCursor().then(() => {
                console.timeEnd('Total asset loading time')
                console.log(`Loading of about ${msg.totalResources} assets complete!`)
                // complete setup
                const mainMenuScreen = new MainMenuScreen(screenMaster)
                const gameScreen = new GameScreen(screenMaster)
                const rewardScreen = new RewardScreen(screenMaster)
                cursorLayer.sceneMgr = gameScreen.sceneMgr
                cursorLayer.entityMgr = gameScreen.entityMgr

                mainMenuScreen.onLevelSelected = (levelName) => {
                    try {
                        const levelConf = ResourceManager.getLevelEntryCfg(levelName)
                        gameScreen.startLevel(levelName, levelConf)
                    } catch (e) {
                        console.error(`Could not load level: ${levelName}`, e)
                        gameScreen.hide()
                        mainMenuScreen.showLevelSelection()
                    }
                }
                gameScreen.onLevelEnd = (result) => {
                    screenMaster.createScreenshot().then((canvas) => {
                        result.screenshot = canvas
                        gameScreen.hide()
                        rewardScreen.showGameResult(result)
                    })
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
                    GameState.numOre = Number(params.get('numOre')) || 0
                    GameState.numCrystal = Number(params.get('numCrystal')) || 0
                    ObjectListLoader.numRaider = Number(params.get('numRaider')) || 0
                    const loadGame = params.get('loadGame')
                    if (loadGame !== null) SaveGameManager.loadGame(Number(loadGame))
                    if (entry === 'level') mainMenuScreen.showLevelSelection()
                    else if (entry === 'reward') rewardScreen.show()
                    else if (entry === 'random') mainMenuScreen.selectLevel(`Level${Math.randomInclusive(1, 25).toPadded()}`)
                    else if (entry) mainMenuScreen.selectLevel(entry)
                } else {
                    mainMenuScreen.showMainMenu()
                }
            })
            break
    }
}

let wadWorker: TypedWorker<InitLoadingMessage>
try {
    wadWorker = new TypedWorkerFrontend(new Worker(new URL('./resource/wadworker/WadWorker', import.meta.url), {type: 'module'}), (msg) => onWadLoaderMessage(msg))
} catch (e) {
    console.warn('Could not setup threaded worker!\nUsing fallback to main thread, expect reduced performance.', e)
    wadWorker = new TypedWorkerFallback<InitLoadingMessage>((r) => onWadLoaderMessage(r))
    new WadSystem(wadWorker as TypedWorkerFallback<InitLoadingMessage>)
}
SaveGameManager.loadAllSaveGames()
const screenMaster = new ScreenMaster()
const loadingLayer = screenMaster.addLayer(new LoadingLayer(), 0)
const cursorLayer = screenMaster.addLayer(new CursorLayer(), 1000)
const wadFileSelectModal = new WadFileSelectionModal('game-container', (wad0Url: string, wad1Url: string) => {
    wadWorker.sendMessage(new InitLoadingMessage(wad0Url, wad1Url))
})
const githubBox = new GithubBox('game-container')
const clearCacheButton = new ClearCacheButton('game-container')

// start the game by loading resources
loadingLayer.show()
wadWorker.sendMessage(null)
