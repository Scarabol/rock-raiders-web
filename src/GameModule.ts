import { MainMenuScreen } from './screen/MainMenuScreen'
import { ScreenMaster } from './screen/ScreenMaster'
import { GameScreen } from './screen/GameScreen'
import { RewardScreen } from './screen/RewardScreen'
import { DEV_MODE } from './params'
import { ObjectListLoader } from './game/ObjectListLoader'
import { SaveGameManager } from './resource/SaveGameManager'
import { GameResult } from './game/model/GameResult'
import { EventBroker } from './event/EventBroker'
import { SoundManager } from './audio/SoundManager'
import { TooltipLayer } from './screen/layer/TooltipLayer'
import { EventKey } from './event/EventKeyEnum'
import { ChangeCursor } from './event/GuiCommand'
import { CursorManager } from './screen/CursorManager'

export class GameModule {
    readonly tooltipLayer: TooltipLayer
    readonly mainMenuScreen: MainMenuScreen
    readonly gameScreen: GameScreen
    readonly rewardScreen: RewardScreen

    constructor(readonly screenMaster: ScreenMaster) {
        EventBroker.init()
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_CURSOR, (event: ChangeCursor) => {
            CursorManager.changeCursor(event.cursor, event.timeout)
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            screenMaster.onWindowResize()
        })
        SoundManager.init()
        SaveGameManager.loadPreferences()
        SaveGameManager.loadSaveGames()
        SaveGameManager.loadSaveGameScreenshots()
        if (DEV_MODE) SaveGameManager.loadGame(0)
        this.tooltipLayer = screenMaster.addLayer(new TooltipLayer(), 1000)
        this.mainMenuScreen = new MainMenuScreen(screenMaster)
        this.gameScreen = new GameScreen(screenMaster)
        this.rewardScreen = new RewardScreen(screenMaster)
        const params = new URLSearchParams(window.location.search)
        SaveGameManager.currentPreferences.testLevels = params.has('testlevels') || DEV_MODE
        const entry = params.get('entry')
        if (DEV_MODE && entry) {
            ObjectListLoader.numRaider = Number(params.get('numRaider')) || 0
            ObjectListLoader.startVehicle = params.get('vehicle') || ''
            const loadGame = params.get('loadGame') || ''
            if (loadGame) SaveGameManager.loadGame(Number(loadGame))
            if (entry === 'level') this.mainMenuScreen.showLevelSelection()
            else if (entry === 'tutorial') this.mainMenuScreen.showMainMenu(2)
            else if (entry === 'reward') this.rewardScreen.showGameResult(GameResult.random())
            else if (entry === 'random') this.mainMenuScreen.selectLevelRandom()
            else if (entry === 'credits') this.mainMenuScreen.showCredits()
            else if (entry) this.mainMenuScreen.selectLevel(entry)
        } else {
            this.mainMenuScreen.showMainMenu()
        }
    }

    dispose() {
        console.warn('Disposing all screens and event brokers!')
        this.tooltipLayer.hide()
        this.screenMaster.removeLayer(this.tooltipLayer)
        this.mainMenuScreen.dispose()
        this.gameScreen.dispose()
        this.rewardScreen.dispose()
    }
}
