import { ClearCacheButton } from '../site/clearcache/ClearCacheButton'
import { GithubBox } from '../site/github/github-box'
import { WadFileSelectionModal } from '../site/modal/WadFileSelectionModal'
import { getRandomInclusive } from './core/Util'
import { GameState } from './game/model/GameState'
import { DEV_MODE } from './params'
import { ResourceManager } from './resource/ResourceManager'
import { GameScreen } from './screen/GameScreen'
import { LoadingScreen } from './screen/LoadingScreen'
import { MainMenuScreen } from './screen/MainMenuScreen'
import { RewardScreen } from './screen/RewardScreen'

if (DEV_MODE) console.warn('DEV MODE ACTIVE')

// setup and link all components

const loadingScreen = new LoadingScreen()
const wadFileSelectModal = new WadFileSelectionModal('game-container')
const githubBox = new GithubBox('game-container')
const clearCacheButton = new ClearCacheButton('game-container')

wadFileSelectModal.onStart = (wad0Url, wad1Url) => {
    ResourceManager.startLoadingFromUrl(wad0Url, wad1Url)
}
ResourceManager.onMessage = (msg: string) => {
    loadingScreen.setLoadingMessage(msg)
}
ResourceManager.onCacheMissed = () => {
    wadFileSelectModal.show()
}
ResourceManager.onInitialLoad = (totalResources: number) => {
    wadFileSelectModal.hide()
    loadingScreen.enableGraphicMode(totalResources)
}
ResourceManager.onAssetLoaded = () => {
    loadingScreen.increaseLoadingState()
}
ResourceManager.onLoadDone = () => {
    // complete setup
    const mainMenuScreen = new MainMenuScreen()
    const gameScreen = new GameScreen()
    const rewardScreen = new RewardScreen()

    mainMenuScreen.onLevelSelected = (levelName) => {
        try {
            const levelConf = ResourceManager.getLevelConfig().levelCfgByName.get(levelName)
            if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"' // TODO this could be nicer
            rewardScreen.setup(levelConf.fullName, levelConf.reward)
            gameScreen.startLevel(levelName, levelConf)
        } catch (e) {
            console.error('Could not load level: ' + levelName, e)
            gameScreen.hide()
            mainMenuScreen.showLevelSelection()
        }
    }
    gameScreen.onLevelEnd = (result) => {
        gameScreen.hide()
        rewardScreen.setGameResult(result)
        rewardScreen.show()
    }
    rewardScreen.onAdvance = () => {
        GameState.reset()
        mainMenuScreen.showLevelSelection()
    }

    // setup complete
    loadingScreen.hide()
    githubBox.hide()
    clearCacheButton.hide()
    const params = new URLSearchParams(window.location.search)
    const entry = params.get('entry')
    if (DEV_MODE && entry) {
        GameState.numOre = Number(params.get('numOre')) || 0
        GameState.numCrystal = Number(params.get('numCrystal')) || 0
        if (entry === 'level') mainMenuScreen.showLevelSelection()
        else if (entry === 'reward') rewardScreen.show()
        else if (entry === 'random') mainMenuScreen.selectLevel('Level' + (('00' + getRandomInclusive(1, 25)).substr(-2)))
        else if (entry) mainMenuScreen.selectLevel(entry)
    } else {
        mainMenuScreen.showMainMenu()
    }
}

// start the game engine with loading resources

loadingScreen.show()
ResourceManager.startLoadingFromCache()
