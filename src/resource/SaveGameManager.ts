import { NUM_OF_LEVELS_TO_COMPLETE_GAME, SAVE_GAME_SCREENSHOT_HEIGHT, SAVE_GAME_SCREENSHOT_WIDTH } from '../params'

export class SaveGameManager {

    private static currentLevels: SaveGameLevel[] = []
    private static screenshots: HTMLCanvasElement[] = []

    private static saveGames: SaveGame[] = [] // this gets serialized

    static {
        console.log('Loading save games...')
        this.saveGames = JSON.parse(localStorage.getItem('savegames') || '[]')
        Promise.all(this.saveGames.map((s, index) => {
            if (!s.screenshot) return null
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = SAVE_GAME_SCREENSHOT_WIDTH
                canvas.height = SAVE_GAME_SCREENSHOT_HEIGHT
                canvas.getContext('2d').drawImage(img, 0, 0)
                this.screenshots[index] = canvas
            }
            img.src = s.screenshot
        })).then(() => {
            console.log('All save games loaded', this.saveGames)
        })
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

    static getSaveGameScreenshot(index: number): HTMLCanvasElement {
        return this.screenshots[index] || null
    }

    static saveGame(index: number, levelName: string, score: number, screenshot: HTMLCanvasElement) {
        const previousAttempt = this.currentLevels.find((l) => l.levelName.equalsIgnoreCase(levelName))
        if (previousAttempt) {
            if (previousAttempt.levelScore < score) {
                previousAttempt.levelScore = score
            }
        } else {
            this.currentLevels.add(new SaveGameLevel(levelName, score))
        }
        this.screenshots[index] = screenshot
        const saveGame = this.saveGames[index] || new SaveGame()
        saveGame.screenshot = this.encodeScreenshot(screenshot)
        saveGame.levels = this.currentLevels
        this.saveGames[index] = saveGame
        localStorage.setItem('savegames', JSON.stringify(this.saveGames))
        console.log('game progress saved', this.saveGames)
    }

    private static encodeScreenshot(screenshot: HTMLCanvasElement): string {
        const canvas = document.createElement('canvas')
        canvas.width = SAVE_GAME_SCREENSHOT_WIDTH
        canvas.height = SAVE_GAME_SCREENSHOT_HEIGHT
        canvas.getContext('2d').drawImage(screenshot, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL()
    }

    static loadGame(index: number) {
        const saveGame = this.saveGames[index]
        if (!saveGame) return
        this.currentLevels = saveGame.levels
        console.log('game progress loaded', this.currentLevels)
    }

    static getLevelScoreString(levelName: string) {
        const levelScore = this.currentLevels.find((l) => l.levelName.equalsIgnoreCase(levelName))?.levelScore
        if (levelScore) {
            return ` (${Math.round(levelScore * 100)})`
        } else {
            return ''
        }
    }
}

export class SaveGame { // this gets serialized
    levels: SaveGameLevel[] = []
    screenshot: string = ''
}

export class SaveGameLevel { // this gets serialized
    levelName: string = ''
    levelScore: number = 0

    constructor(levelName: string, levelScore: number) {
        this.levelName = levelName
        this.levelScore = levelScore
    }
}
