import { DEFAULT_AUTO_GAME_SPEED, DEFAULT_GAME_BRIGHTNESS, DEFAULT_GAME_SPEED_MULTIPLIER, DEFAULT_MUSIC_TOGGLE, DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_TOGGLE, DEFAULT_SFX_VOLUME, DEFAULT_SHOW_HELP_WINDOW, DEFAULT_WALL_DETAILS, NUM_OF_LEVELS_TO_COMPLETE_GAME, SAVE_GAME_SCREENSHOT_HEIGHT, SAVE_GAME_SCREENSHOT_WIDTH, VERBOSE } from '../params'
import { EventBus } from '../event/EventBus'
import { ChangePreferences } from '../event/GuiCommand'

export class SaveGamePreferences { // this gets serialized
    gameSpeed: number = DEFAULT_GAME_SPEED_MULTIPLIER
    volumeSfx: number = DEFAULT_SFX_VOLUME
    volumeMusic: number = DEFAULT_MUSIC_VOLUME
    gameBrightness: number = DEFAULT_GAME_BRIGHTNESS
    showHelpWindow: boolean = DEFAULT_SHOW_HELP_WINDOW
    wallDetails: boolean = DEFAULT_WALL_DETAILS
    toggleMusic: boolean = DEFAULT_MUSIC_TOGGLE
    toggleSfx: boolean = DEFAULT_SFX_TOGGLE
    autoGameSpeed: boolean = DEFAULT_AUTO_GAME_SPEED
}

export class SaveGameManager {

    static currentPreferences: SaveGamePreferences = new SaveGamePreferences()
    static screenshots: Promise<HTMLCanvasElement>[] = []
    private static currentLevels: SaveGameLevel[] = []
    private static saveGames: SaveGame[] = [] // this gets serialized

    static loadPreferences() {
        try {
            if (VERBOSE) console.log('Loading preferences...')
            const preferences = localStorage.getItem('preferences')
            if (preferences) {
                this.currentPreferences = {...this.currentPreferences, ...JSON.parse(preferences)}
                EventBus.publishEvent(new ChangePreferences())
                console.log(`Preferences loaded`, this.currentPreferences)
            }
        } catch (e) {
            console.error('Could not load preferences', e)
        }
    }

    static loadSaveGames() {
        try {
            if (VERBOSE) console.log('Loading save games...')
            this.saveGames = JSON.parse(localStorage.getItem('savegames') || '[]')
            console.log('All save games loaded', this.saveGames)
        } catch (e) {
            console.error('Could not load save games', e)
        }
    }

    static loadSaveGameScreenshots() {
        if (VERBOSE) console.log('Loading save game screenshots...')
        this.screenshots = this.saveGames.map((s, index) => new Promise<HTMLCanvasElement>((resolve) => {
            try {
                const screenshot = localStorage.getItem(`screenshot${index}`)
                if (!screenshot) {
                    resolve(null)
                    return
                }
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = SAVE_GAME_SCREENSHOT_WIDTH
                    canvas.height = SAVE_GAME_SCREENSHOT_HEIGHT
                    canvas.getContext('2d').drawImage(img, 0, 0)
                    resolve(canvas)
                }
                img.src = screenshot
            } catch (e) {
                console.error('Could not load save game screenshot', e)
                resolve(null)
            }
        }))
    }

    static hasSaveGame(index: number): boolean {
        return !!this.saveGames[index]
    }

    static getOverallGameProgress(index: number): number {
        const saveGame = this.saveGames[index]
        if (!saveGame) return 0
        const levelNameList = saveGame.levels
            .map((l) => l.levelName.toLowerCase())
            .filter((n) => n.startsWith('level'))
        return new Set(levelNameList).size * 100 / NUM_OF_LEVELS_TO_COMPLETE_GAME
    }

    static saveGame(index: number, screenshot: HTMLCanvasElement) {
        this.saveGames[index] = this.saveGames[index] || new SaveGame()
        this.saveGames[index].levels = this.currentLevels.map((l) => SaveGameLevel.copy(l)) // deep copy required, otherwise changes are reflected
        localStorage.setItem('savegames', JSON.stringify(this.saveGames))
        this.screenshots[index] = Promise.resolve(screenshot)
        localStorage.setItem(`screenshot${index}`, this.createSaveGameThumbnail(screenshot))
        console.log('game progress saved', this.saveGames)
    }

    private static createSaveGameThumbnail(screenshot: HTMLCanvasElement): string {
        if (!screenshot) return ''
        const canvas = document.createElement('canvas')
        canvas.width = SAVE_GAME_SCREENSHOT_WIDTH
        canvas.height = SAVE_GAME_SCREENSHOT_HEIGHT
        canvas.getContext('2d').drawImage(screenshot, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL()
    }

    static loadGame(index: number): boolean {
        this.currentLevels = this.saveGames[index]?.levels ?? []
        console.log('game progress loaded', this.currentLevels)
        return true
    }

    static setLevelScore(levelName: string, score: number) {
        const previousAttempt = this.currentLevels.find((l) => l.levelName.equalsIgnoreCase(levelName))
        if (previousAttempt) {
            if (previousAttempt.levelScore < score) {
                previousAttempt.levelScore = score
            }
        } else {
            this.currentLevels.add(new SaveGameLevel(levelName, score))
        }
    }

    static getLevelScoreString(levelName: string) {
        const levelScore = this.currentLevels.find((l) => l.levelName.equalsIgnoreCase(levelName))?.levelScore
        if (levelScore) {
            return ` (${levelScore})`
        } else {
            return ''
        }
    }

    static savePreferences() {
        localStorage.setItem('preferences', JSON.stringify(this.currentPreferences))
        console.log('Preferences saved', this.currentPreferences)
    }

    static getSfxVolume(): number {
        return SaveGameManager.currentPreferences.toggleSfx ? SaveGameManager.currentPreferences.volumeSfx : 0
    }
}

export class SaveGame { // this gets serialized
    levels: SaveGameLevel[] = []
}

export class SaveGameLevel { // this gets serialized
    levelName: string = ''
    levelScore: number = 0

    constructor(levelName: string, levelScore: number) {
        this.levelName = levelName
        this.levelScore = levelScore
    }

    static copy(other: SaveGameLevel): SaveGameLevel {
        return new SaveGameLevel(other.levelName, other.levelScore)
    }
}
