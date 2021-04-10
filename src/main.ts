import { ResourceManager } from './resource/ResourceManager'
import { LoadingScreen } from './screen/LoadingScreen'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { GameScreen } from './screen/GameScreen'
import { RewardScreen } from './screen/RewardScreen'
import { GameState } from './game/model/GameState'
import { WadFileSelectionModal } from '../site/modal/WadFileSelectionModal'

// define constants

export const JOB_SCHEDULE_INTERVAL = 1000 // milliseconds
export const JOB_ACTION_RANGE = 5
export const CHECK_SPANW_RAIDER_TIMER = 1000 // milliseconds
export const RAIDER_SPEED = 2.0
export const MAX_RAIDER_BASE = 12
export const ADDITIONAL_RAIDER_PER_SUPPORT = 10

export const PANEL_ANIMATION_MULTIPLIER = 3
export const HEIGHT_MULTIPLER = 0.1

// native constants (do not change)

export const SPRITE_RESOLUTION_WIDTH = 640
export const SPRITE_RESOLUTION_HEIGHT = 480
export const TILESIZE = 40
export const NATIVE_FRAMERATE = 30

// setup and link all components

const loadingScreen = new LoadingScreen()
const wadfileSelectModal = new WadFileSelectionModal('game-container')

wadfileSelectModal.onStart = (wad0Url, wad1Url) => {
    ResourceManager.startLoadingFromUrl(wad0Url, wad1Url)
}
ResourceManager.onMessage = (msg: string) => {
    loadingScreen.setLoadingMessage(msg)
}
ResourceManager.onCacheMissed = () => {
    wadfileSelectModal.show()
}
ResourceManager.onInitialLoad = (totalResources: number) => {
    wadfileSelectModal.hide()
    loadingScreen.enableGraphicMode(totalResources)
}
ResourceManager.onAssetLoaded = (assetIndex: number) => {
    loadingScreen.setLoadingState(assetIndex)
}
ResourceManager.onLoadDone = () => {
    // complete setup
    const mainMenuScreen = new MainMenuScreen()
    const gameScreen = new GameScreen()
    const rewardScreen = new RewardScreen()

    mainMenuScreen.onLevelSelected = (levelName) => {
        try {
            gameScreen.startLevel(levelName)
        } catch (e) {
            console.error('Could not load level: ' + levelName, e)
            gameScreen.hide()
            mainMenuScreen.showLevelSelection()
        }
    }
    gameScreen.onLevelEnd = () => {
        gameScreen.hide()
        rewardScreen.show()
    }
    rewardScreen.onAdvance = () => {
        GameState.reset()
        mainMenuScreen.showLevelSelection()
    }

    // setup complete
    loadingScreen.hide()
    mainMenuScreen.showMainMenu()
    // mainMenuScreen.showLevelSelection()
    // mainMenuScreen.selectLevel('') // UI Testmode
    // mainMenuScreen.selectLevel('Level02')
    // mainMenuScreen.selectLevel('Level06')
    // mainMenuScreen.selectLevel('Level09')
    // mainMenuScreen.selectLevel('Level25')
    // rewardScreen.show();
}

// start the game engine with loading resources

loadingScreen.show()
ResourceManager.startLoadingFromCache()
