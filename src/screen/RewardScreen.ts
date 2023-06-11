import { RewardCfg } from '../cfg/RewardCfg'
import { BitmapFont } from '../core/BitmapFont'
import { SpriteImage } from '../core/Sprite'
import { clearTimeoutSafe } from '../core/Util'
import { MOUSE_BUTTON, POINTER_EVENT } from '../event/EventTypeEnum'
import { GameResult, GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { LoadSaveLayer } from '../menu/LoadSaveLayer'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'
import { RewardScreenButton } from '../menu/RewardScreenButton'
import { ResourceManager } from '../resource/ResourceManager'
import { SaveGameManager } from '../resource/SaveGameManager'
import { ScaledLayer } from './layer/ScreenLayer'
import { ScreenMaster } from './ScreenMaster'

export class RewardScreen {
    onAdvance: () => void
    cfg: RewardCfg = null
    titleFont: BitmapFont
    backgroundLayer: ScaledLayer
    resultsLayer: ScaledLayer
    descriptionTextLayer: ScaledLayer
    btnLayer: ScaledLayer
    saveGameLayer: LoadSaveLayer
    resultIndex: number = 0
    resultLastIndex: number = 0
    images: { img: SpriteImage, x: number, y: number }[] = []
    boxes: { img: SpriteImage, x: number, y: number }[] = []
    fonts = {}
    texts: SpriteImage[] = []
    uncoverTimeout: NodeJS.Timeout = null
    btnSave: RewardScreenButton
    btnAdvance: RewardScreenButton
    levelFullNameImg: SpriteImage
    resultText: string
    resultValues: SpriteImage[] = []
    screenshot: HTMLCanvasElement = null

    constructor(screenMaster: ScreenMaster) {
        this.cfg = ResourceManager.configuration.reward
        this.titleFont = ResourceManager.getBitmapFont(this.cfg.titleFont)
        const backgroundImg = ResourceManager.getImage(this.cfg.wallpaper)
        this.backgroundLayer = screenMaster.addLayer(new ScaledLayer(), 0)
        this.backgroundLayer.animationFrame.onRedraw = (context) => context.drawImage(backgroundImg, 0, 0)
        this.cfg.images.forEach((img) => {
            this.images.push({img: ResourceManager.getImage(img.filePath), x: img.x, y: img.y})
        })
        this.cfg.boxImages.forEach((img) => {
            this.boxes.push({img: ResourceManager.getImage(img.filePath), x: img.x, y: img.y})
        })
        Object.keys(this.cfg.fonts).forEach((fontKey, index) => {
            const font = ResourceManager.getBitmapFont(this.cfg.fonts[fontKey])
            this.fonts[fontKey.toLowerCase()] = font
            const txt = this.cfg.text[index]
            const labelFont = index < 9 ? font : ResourceManager.getBitmapFont(this.cfg.backFont)
            this.texts.push(labelFont.createTextImage(txt.text))
        })
        this.resultsLayer = screenMaster.addLayer(new ScaledLayer(), 10)
        this.resultsLayer.handlePointerEvent = ((event) => {
            if (event.eventEnum === POINTER_EVENT.UP) {
                this.uncoverTimeout = clearTimeoutSafe(this.uncoverTimeout)
                this.resultIndex = this.resultLastIndex
                this.btnSave.visible = true
                this.btnAdvance.visible = true
                this.resultsLayer.animationFrame.redraw()
                this.descriptionTextLayer.animationFrame.redraw()
                this.btnLayer.animationFrame.redraw()
                return true
            }
            return false
        })
        this.descriptionTextLayer = screenMaster.addLayer(new ScaledLayer(), 20)
        this.btnLayer = screenMaster.addLayer(new ScaledLayer(), 50)
        this.btnSave = new RewardScreenButton(this.cfg.saveButton, 'ToolTip_Reward_Save')
        this.btnSave.onPressed = () => this.saveGameLayer.show()
        this.btnAdvance = new RewardScreenButton(this.cfg.advanceButton, 'ToolTip_Reward_Advance')
        this.btnAdvance.onPressed = () => {
            this.backgroundLayer.hide()
            this.resultsLayer.hide()
            this.descriptionTextLayer.hide()
            this.btnLayer.hide()
            this.saveGameLayer.hide()
            this.onAdvance()
        }
        this.btnLayer.handlePointerEvent = ((event) => {
            if (event.eventEnum === POINTER_EVENT.MOVE || event.eventEnum === POINTER_EVENT.LEAVE) {
                this.btnSave.setHovered(this.btnSave.isHovered(event.canvasX, event.canvasY))
                this.btnAdvance.setHovered(this.btnAdvance.isHovered(event.canvasX, event.canvasY))
            } else if (event.eventEnum === POINTER_EVENT.DOWN) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    this.btnSave.onMouseDown()
                    this.btnAdvance.onMouseDown()
                }
            } else if (event.eventEnum === POINTER_EVENT.UP) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    this.btnSave.onMouseUp()
                    this.btnAdvance.onMouseUp()
                }
            }
            if (this.btnSave.needsRedraw || this.btnAdvance.needsRedraw) this.btnLayer.animationFrame.redraw()
            return false
        })
        this.btnLayer.animationFrame.onRedraw = (context) => {
            context.clearRect(this.btnSave.x, this.btnSave.y, this.btnSave.width, this.btnSave.height)
            this.btnSave.draw(context)
            context.clearRect(this.btnAdvance.x, this.btnAdvance.y, this.btnAdvance.width, this.btnAdvance.height)
            this.btnAdvance.draw(context)
        }
        this.levelFullNameImg = this.titleFont.createTextImage('No level selected')
        this.saveGameLayer = screenMaster.addLayer(new LoadSaveLayer(ResourceManager.configuration.menu.mainMenuFull.menus[3], false), 60)
        this.saveGameLayer.onItemAction = (item: MainMenuBaseItem) => {
            if (item.actionName.equalsIgnoreCase('next')) {
                this.saveGameLayer.hide()
            } else if (item.actionName.toLowerCase().startsWith('save_game_')) {
                if (SaveGameManager.hasSaveGame(item.targetIndex)) {
                    console.warn('Overwrite window not yet implemented') // TODO show overwrite warning window
                    SaveGameManager.saveGame(item.targetIndex, this.screenshot)
                } else {
                    SaveGameManager.saveGame(item.targetIndex, this.screenshot)
                }
                this.saveGameLayer.hide()
            } else {
                console.warn(`not implemented: ${item.actionName} - ${item.targetIndex}`)
            }
        }
    }

    showGameResult(result: GameResult) {
        console.log('Your game result', result)
        this.levelFullNameImg = this.titleFont.createTextImage(result.levelFullName)
        this.btnSave.disabled = result.state !== GameResultState.COMPLETE
        this.resultText = this.cfg.quitText
        this.resultLastIndex = this.images.length - 2
        if (result.state === GameResultState.COMPLETE) {
            this.resultText = this.cfg.completeText
            this.resultLastIndex = this.images.length - 1
            SaveGameManager.setLevelScore(result.levelName, result.score)
        } else if (result.state === GameResultState.FAILED) {
            this.resultText = this.cfg.failedText
        }
        this.resultValues = []
        this.resultValues.push(this.fonts['crystals'].createTextImage(this.percentString(GameState.numCrystal, GameState.neededCrystals)))
        this.resultValues.push(this.fonts['ore'].createTextImage(this.percentString(GameState.numOre, GameState.totalOres)))
        this.resultValues.push(this.fonts['diggable'].createTextImage(this.percentString(GameState.remainingDiggables, GameState.totalDiggables, true)))
        this.resultValues.push(this.fonts['constructions'].createTextImage(result.numBuildings.toString()))
        this.resultValues.push(this.fonts['caverns'].createTextImage(this.percentString(GameState.discoveredCaverns, GameState.totalCaverns)))
        this.resultValues.push(this.fonts['figures'].createTextImage(this.percentString(result.numRaiders, result.numMaxRaiders)))
        this.resultValues.push(this.fonts['rockmonsters'].createTextImage(this.percentString(result.defencePercent, 100)))
        this.resultValues.push(this.fonts['oxygen'].createTextImage(this.percentString(result.airLevelPercent, 100)))
        this.resultValues.push(this.fonts['timer'].createTextImage(this.timeString(result.gameTimeSeconds)))
        this.resultValues.push(this.fonts['score'].createTextImage(`${result.score}%`))
        this.screenshot = result.screenshot
        this.show()
    }

    show() {
        this.resultIndex = 0
        this.btnSave.visible = false
        this.btnAdvance.visible = false
        this.uncoverResult()
        const gameResultTextImg = this.titleFont.createTextImage(this.resultText)
        this.resultsLayer.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.resultsLayer.fixedWidth, this.resultsLayer.fixedHeight)
            for (let c = 0; c <= this.resultIndex; c++) {
                const img = this.images[c]
                if (img) context.drawImage(img.img, img.x, img.y)
            }
            for (let c = 0; c <= this.resultIndex; c++) {
                const box = this.boxes[c]
                if (box) context.drawImage(box.img, box.x, box.y)
            }
            for (let c = 0; c <= this.resultIndex; c++) {
                const txt = this.cfg.text[c]
                const text = this.resultValues[c]
                if (text) context.drawImage(text, txt.x - text.width / 2, txt.y)
            }
            context.drawImage(this.levelFullNameImg, this.resultsLayer.fixedWidth / 2 - this.levelFullNameImg.width / 2, this.cfg.vertSpacing - this.levelFullNameImg.height / 2)
            context.drawImage(gameResultTextImg, this.resultsLayer.fixedWidth / 2 - gameResultTextImg.width / 2, this.cfg.vertSpacing + this.levelFullNameImg.height / 2)
        }
        this.descriptionTextLayer.animationFrame.onRedraw = (context) => {
            const descriptionTextImg = this.texts[this.resultIndex]
            if (!descriptionTextImg) return
            context.clearRect(0, 0, this.descriptionTextLayer.fixedWidth, this.descriptionTextLayer.fixedHeight)
            const tx = this.resultIndex !== this.images.length - 1 ? this.cfg.textPos[0] : 305
            const ty = this.resultIndex !== this.images.length - 1 ? this.cfg.textPos[1] : 195
            context.drawImage(descriptionTextImg, tx - descriptionTextImg.width / 2, ty)
        }
        this.backgroundLayer.show()
        this.resultsLayer.show()
        this.descriptionTextLayer.show()
        this.btnLayer.show()
    }

    percentString(actual: number, max: number, lessIsMore: boolean = false) {
        if (max === 0) max = 1
        let value = Math.round(Math.max(Math.min(actual / max, 1), 0) * 100)
        if (lessIsMore) value = 100 - value
        return `${value.toString()}%`
    }

    timeString(seconds: number) {
        const ss = (seconds % 60).toPadded()
        const minutes = Math.floor(seconds / 60)
        const mm = ((minutes % 60).toPadded())
        const hh = (Math.floor(minutes / 60).toPadded())
        return `${hh}:${mm}:${ss}`
    }

    uncoverResult() {
        this.uncoverTimeout = clearTimeoutSafe(this.uncoverTimeout)
        this.uncoverTimeout = setTimeout(() => {
            if (this.resultIndex < this.resultLastIndex) {
                this.resultIndex++
                this.uncoverResult()
            } else {
                this.btnSave.visible = true
                this.btnAdvance.visible = true
            }
            this.resultsLayer.animationFrame.redraw()
            this.descriptionTextLayer.animationFrame.redraw()
            this.btnLayer.animationFrame.redraw()
        }, this.cfg.timer * 1000)
    }
}
