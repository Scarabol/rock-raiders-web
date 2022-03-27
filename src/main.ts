import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { GithubBox } from '../site/github/github-box'
import { WadFileSelectionModal } from '../site/modal/WadFileSelectionModal'
import { GameState } from './game/model/GameState'
import { ObjectListLoader } from './game/ObjectListLoader'
import { DEV_MODE } from './params'
import { ResourceManager } from './resource/ResourceManager'
import { GameScreen } from './screen/GameScreen'
import { LoadingLayer } from './screen/layer/LoadingLayer'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { RewardScreen } from './screen/RewardScreen'
import { ScreenMaster } from './screen/ScreenMaster'
import { CursorLayer } from './screen/layer/CursorLayer'

if (DEV_MODE) console.warn('DEV MODE ACTIVE')
else console.log(`Rock Raider Web v${require('../package.json').version}`)
console.time('Total asset loading time')

// setup and link all components

const screenMaster = new ScreenMaster()
const loadingLayer = screenMaster.addLayer(new LoadingLayer())
const cursorLayer = screenMaster.addLayer(new CursorLayer(), 1000)
const wadFileSelectModal = new WadFileSelectionModal('game-container')
const githubBox = new GithubBox('game-container')
const clearCacheButton = new ClearCacheButton('game-container')

wadFileSelectModal.onStart = (wad0Url, wad1Url) => {
    ResourceManager.startLoadingFromUrl(wad0Url, wad1Url)
}
ResourceManager.onLoadingMessage = (msg: string) => {
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
