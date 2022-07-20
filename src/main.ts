import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { GithubBox } from '../site/github/github-box'
import '../site/main.css'
import { WadFileSelectionModal } from '../site/wadModal/WadFileSelectionModal'
import { GameState } from './game/model/GameState'
import { ObjectListLoader } from './game/ObjectListLoader'
import { DEV_MODE } from './params'
import { ResourceManager } from './resource/ResourceManager'
import { SaveGameManager } from './resource/SaveGameManager'
import { GameScreen } from './screen/GameScreen'
import { CursorLayer } from './screen/layer/CursorLayer'
import { LoadingLayer } from './screen/layer/LoadingLayer'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { RewardScreen } from './screen/RewardScreen'
import { ScreenMaster } from './screen/ScreenMaster'

if (DEV_MODE) console.warn('DEV MODE ACTIVE')
console.log(`Rock Raider Web v${APP_VERSION}`)

// setup and link all components
console.time('Total asset loading time')

ResourceManager.initWorker()
SaveGameManager.loadAllSaveGames()
const screenMaster = new ScreenMaster()
const loadingLayer = screenMaster.addLayer(new LoadingLayer(), 0)
const cursorLayer = screenMaster.addLayer(new CursorLayer(), 1000)
const wadFileSelectModal = new WadFileSelectionModal('game-container')
const githubBox = new GithubBox('game-container')
const clearCacheButton = new ClearCacheButton('game-container')

wadFileSelectModal.onStart = (wad0Url, wad1Url) => {
    ResourceManager.startLoadingFromUrl(wad0Url, wad1Url)
}
ResourceManager.onLoadingMessage = (msg: string) => {
    wadFileSelectModal.hide()
    loadingLayer.setLoadingMessage(msg)
}
ResourceManager.onCacheMissed = () => {
    wadFileSelectModal.show()
}
ResourceManager.onInitialLoad = (totalResources: number) => {
    loadingLayer.enableGraphicMode(totalResources)
    cursorLayer.show()
}
ResourceManager.onAssetLoaded = () => {
    loadingLayer.increaseLoadingState()
}
ResourceManager.onLoadDone = () => {
    console.timeEnd('Total asset loading time')
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
        ObjectListLoader.numTestRaider = Number(params.get('numTestRaider')) || 0
        const loadGame = params.get('loadGame')
        if (loadGame !== null) SaveGameManager.loadGame(Number(loadGame))
        if (entry === 'level') mainMenuScreen.showLevelSelection()
        else if (entry === 'reward') rewardScreen.show()
        else if (entry === 'random') mainMenuScreen.selectLevel(`Level${Math.randomInclusive(1, 25).toPadded()}`)
        else if (entry) mainMenuScreen.selectLevel(entry)
    } else {
        mainMenuScreen.showMainMenu()
    }
}

// start the game engine with loading resources

loadingLayer.show()
ResourceManager.startLoadingFromCache()
