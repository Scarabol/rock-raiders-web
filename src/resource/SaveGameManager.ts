import { DEFAULT_AUTO_GAME_SPEED, DEFAULT_GAME_BRIGHTNESS, DEFAULT_GAME_SPEED_MULTIPLIER, DEFAULT_MUSIC_TOGGLE, DEFAULT_MUSIC_VOLUME, DEFAULT_SCREEN_RATIO_FIXED, DEFAULT_SFX_TOGGLE, DEFAULT_SFX_VOLUME, DEFAULT_SHOW_HELP_WINDOW, DEFAULT_WALL_DETAILS, DEV_MODE, NUM_OF_LEVELS_TO_COMPLETE_GAME, SAVE_GAME_SCREENSHOT_HEIGHT, SAVE_GAME_SCREENSHOT_WIDTH, VERBOSE } from '../params'

export class SaveGamePreferences { // this gets serialized
    // Vanilla game preferences
    gameSpeed: number = DEFAULT_GAME_SPEED_MULTIPLIER
    volumeSfx: number = DEFAULT_SFX_VOLUME
    volumeMusic: number = DEFAULT_MUSIC_VOLUME
    gameBrightness: number = DEFAULT_GAME_BRIGHTNESS
    showHelpWindow: boolean = DEFAULT_SHOW_HELP_WINDOW
    wallDetails: boolean = DEFAULT_WALL_DETAILS
    toggleMusic: boolean = DEFAULT_MUSIC_TOGGLE
    toggleSfx: boolean = DEFAULT_SFX_TOGGLE
    autoGameSpeed: boolean = DEFAULT_AUTO_GAME_SPEED
    // Additional game preferences
    screenRatio: string = '4:3' // set to 0 for responsive screen ratio
    testLevels: boolean = false
    cameraUnlimited: boolean = DEV_MODE
    skipBriefings: boolean = DEV_MODE
    muteDevSounds: boolean = DEV_MODE
    playVideos: boolean = !DEV_MODE
    edgeScrolling: boolean = !DEV_MODE
}

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? (T[P] extends Array<infer _> ? T[P] : DeepPartial<T[P]>) : T[P];
}

export class SaveGameManager {
    static preferences: SaveGamePreferences = new SaveGamePreferences()
    static screenshots: Promise<HTMLCanvasElement | undefined>[] = []
    static currentTeam: SaveGameRaider[] = []
    private static saveGames: SaveGame[] = [] // this gets serialized
    private static currentLevels: SaveGameLevel[] = []

    static loadPreferences() {
        try {
            if (VERBOSE) console.log('Loading preferences...')
            const preferences = localStorage.getItem('preferences')
            if (preferences) {
                this.preferences = {...this.preferences, ...JSON.parse(preferences)}
                if (window?.rr) window.rr.preferences = this.preferences
                console.log(`Preferences loaded`, this.preferences)
            }
        } catch (e) {
            console.error('Could not load preferences', e)
        }
    }

    static loadSaveGames() {
        try {
            if (VERBOSE) console.log('Loading save games...')
            const saveGames: DeepPartial<SaveGame>[] = JSON.parse(localStorage.getItem('savegames') || '[]')
            this.saveGames = saveGames.map((s): SaveGame => SaveGame.copy(s))
            console.log('All save games loaded', this.saveGames)
        } catch (e) {
            console.error('Could not load save games', e)
        }
    }

    static loadSaveGameScreenshots() {
        if (VERBOSE) console.log('Loading save game screenshots...')
        this.screenshots = this.saveGames.map((_, index) => new Promise<HTMLCanvasElement | undefined>((resolve) => {
            try {
                const screenshot = localStorage.getItem(`screenshot${index}`)
                if (!screenshot) {
                    resolve(undefined)
                    return
                }
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = SAVE_GAME_SCREENSHOT_WIDTH
                    canvas.height = SAVE_GAME_SCREENSHOT_HEIGHT
                    const context = canvas.getContext('2d')
                    if (!context) {
                        console.warn('Missing context to draw save game thumbnail on canvas')
                    } else {
                        context.drawImage(img, 0, 0)
                    }
                    resolve(canvas)
                }
                img.src = screenshot
            } catch (e) {
                console.error('Could not load save game screenshot', e)
                resolve(undefined)
            }
        }))
    }

    static hasSaveGame(index: number): boolean {
        return !!this.saveGames[index]
    }

    static getOverallGameProgress(index: number): number {
        const levels = this.saveGames[index]?.levels ?? []
        const levelNameList = levels.filter((l) => l.levelName?.toLowerCase().startsWith('level'))
        return new Set(levelNameList).size * 100 / NUM_OF_LEVELS_TO_COMPLETE_GAME
    }

    static startNewGame() {
        console.log('Resetting game progress and starting new game')
        this.currentLevels = []
    }

    static saveGame(index: number, screenshot: HTMLCanvasElement | undefined) {
        this.saveGames[index] = this.saveGames[index] || new SaveGame()
        this.saveGames[index].levels = this.currentLevels.map((l) => SaveGameLevel.copy(l)) // deep copy required, otherwise changes are reflected
        this.saveGames[index].team = this.currentTeam.map((t) => SaveGameRaider.copy(t)) // deep copy required, otherwise changes are reflected
        localStorage.setItem('savegames', JSON.stringify(this.saveGames))
        this.screenshots[index] = Promise.resolve(screenshot)
        localStorage.setItem(`screenshot${index}`, this.createSaveGameThumbnail(screenshot))
        if (VERBOSE) console.log('game progress saved', this.saveGames)
    }

    private static createSaveGameThumbnail(screenshot: HTMLCanvasElement | undefined): string {
        if (!screenshot) return ''
        const canvas = document.createElement('canvas')
        canvas.width = SAVE_GAME_SCREENSHOT_WIDTH
        canvas.height = SAVE_GAME_SCREENSHOT_HEIGHT
        const context = canvas.getContext('2d')
        if (!context) {
            console.warn('Missing context to draw save game thumbnail on canvas')
        } else {
            context.drawImage(screenshot, 0, 0, canvas.width, canvas.height)
        }
        return canvas.toDataURL()
    }

    static loadGame(index: number): boolean {
        this.currentLevels = this.saveGames[index]?.levels ?? []
        this.currentTeam = this.saveGames[index]?.team ?? []
        if (VERBOSE) console.log('game progress loaded', this.currentLevels)
        return true
    }

    static setLevelScore(levelName: string, score: number) {
        const previousAttempt = this.currentLevels.find((l) => l.levelName?.equalsIgnoreCase(levelName))
        if (previousAttempt) {
            const prevScore = previousAttempt.levelScore || 0
            if (prevScore < score) {
                previousAttempt.levelScore = score
            }
        } else {
            this.currentLevels.add(new SaveGameLevel(levelName, score))
        }
    }

    static getLevelScoreString(levelName: string): string {
        if (!levelName.toLowerCase().startsWith('level')) return ''
        const levelScore = this.currentLevels.find((l) => l.levelName?.equalsIgnoreCase(levelName))?.levelScore
        if (!levelScore) return ''
        return ` (${levelScore})`
    }

    static getLevelCompleted(levelName: string): boolean {
        return !!this.currentLevels.find((l) => l.levelName?.equalsIgnoreCase(levelName))
    }

    static savePreferences(): void {
        localStorage.setItem('preferences', JSON.stringify(this.preferences))
        console.log('Preferences saved', this.preferences)
    }

    static getSfxVolume(): number {
        return this.preferences.toggleSfx ? this.preferences.volumeSfx : 0
    }

    static getMusicVolume(): number {
        return this.preferences.toggleMusic ? this.preferences.volumeMusic : 0
    }

    static calcScreenRatio(): number {
        if (!this.preferences.screenRatio || this.preferences.screenRatio === 'responsive') return 0
        const matched = this.preferences.screenRatio?.match('^\d:\d$')
        if (matched?.length === 3) {
            const w = Number(matched[1])
            const h = Number(matched[2])
            if (!isNaN(w) && !isNaN(h)) {
                return w / h
            }
        }
        return DEFAULT_SCREEN_RATIO_FIXED
    }
}

class SaveGame { // this gets serialized
    levels: SaveGameLevel[] = []
    team: SaveGameRaider[] = []

    static copy(other: DeepPartial<SaveGame>): SaveGame {
        const result = new SaveGame()
        other.levels?.forEach((l) => {
            if (l?.levelName && l?.levelScore) result.levels.push(new SaveGameLevel(l.levelName, l.levelScore))
        })
        result.team = other.team?.map((t) => SaveGameRaider.copy(t)) || []
        return result
    }
}

class SaveGameLevel { // this gets serialized
    readonly levelName: string
    levelScore: number

    constructor(levelName: string, levelScore: number) {
        this.levelName = levelName
        this.levelScore = levelScore
    }

    static copy(other: SaveGameLevel): SaveGameLevel {
        return new SaveGameLevel(other.levelName, other.levelScore)
    }
}

export class SaveGameRaider { // this gets serialized
    name: string
    level: number
    trainings: string[]

    constructor(name: string, level: number, trainings: string[]) {
        this.name = name
        this.level = level
        this.trainings = [...trainings]
    }

    static copy(other: DeepPartial<SaveGameRaider>): SaveGameRaider {
        return new SaveGameRaider(other.name || '', other.level || 0, other.trainings || [])
    }
}
