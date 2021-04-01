import { BaseScreen } from './BaseScreen'
import { ResourceManager } from '../resource/ResourceManager'
import { ScaledLayer } from './ScreenLayer'
import { RewardCfg } from '../menu/RewardCfg'
import { GameResultState, GameState } from '../game/model/GameState'
import { BitmapFont } from '../core/BitmapFont'
import { RewardScreenButton } from '../menu/RewardScreenButton'
import { MOUSE_BUTTON, POINTER_EVENT } from '../event/EventManager'

export class RewardScreen extends BaseScreen {

    onAdvance: () => void
    cfg: RewardCfg = null
    titleFont: BitmapFont
    resultsLayer: ScaledLayer
    descriptionTextLayer: ScaledLayer
    btnLayer: ScaledLayer
    resultIndex: number = 0
    resultLastIndex: number = 0
    images: { img: HTMLCanvasElement, x: number, y: number }[] = []
    boxes: { img: HTMLCanvasElement, x: number, y: number }[] = []
    fonts = {}
    texts: HTMLCanvasElement[] = []
    uncoverTimeout = null
    btnSave: RewardScreenButton
    btnAdvance: RewardScreenButton

    constructor() {
        super()
        this.cfg = ResourceManager.getResource('Reward')
        this.titleFont = ResourceManager.getBitmapFont(this.cfg.titleFont)
        const backgroundImg = ResourceManager.getImage(this.cfg.wallpaper)
        const backgroundLayer = this.addLayer(new ScaledLayer())
        backgroundLayer.onRedraw = (context) => context.drawImage(backgroundImg, 0, 0)
        this.cfg.images.forEach((img) => {
            this.images.push({img: ResourceManager.getImage(img.filePath), x: img.x, y: img.y})
        })
        this.cfg.boxImages.forEach((img) => {
            this.boxes.push({img: ResourceManager.getImage(img.filePath), x: img.x, y: img.y})
        })
        Object.keys(this.cfg.fonts).forEach((fontKey, index) => {
            const font = ResourceManager.getBitmapFont(this.cfg.fonts[fontKey])
            this.fonts[fontKey.toLowerCase()] = font
            const txt = this.cfg.texts[index]
            const labelFont = index < 9 ? font : ResourceManager.getBitmapFont(this.cfg.backFont)
            this.texts.push(labelFont.createTextImage(txt.text))
        })
        this.resultsLayer = this.addLayer(new ScaledLayer())
        this.resultsLayer.handlePointerEvent = ((eventType) => {
            if (eventType === POINTER_EVENT.UP) {
                if (this.uncoverTimeout) clearTimeout(this.uncoverTimeout)
                this.uncoverTimeout = null
                this.resultIndex = this.resultLastIndex
                this.btnSave.visible = true
                this.btnAdvance.visible = true
                this.redraw()
                return true
            }
            return false
        })
        this.descriptionTextLayer = this.addLayer(new ScaledLayer(), 20)
        this.btnLayer = this.addLayer(new ScaledLayer(), 50)
        this.btnSave = new RewardScreenButton(this.cfg.saveButton)
        this.btnSave.disabled = true
        this.btnAdvance = new RewardScreenButton(this.cfg.advanceButton)
        this.btnLayer.handlePointerEvent = ((eventType, event) => {
            if (eventType === POINTER_EVENT.MOVE) {
                const [sx, sy] = this.btnLayer.toScaledCoords(event.clientX, event.clientY)
                this.btnSave.checkHover(sx, sy)
                this.btnAdvance.checkHover(sx, sy)
            } else if (eventType === POINTER_EVENT.DOWN) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    this.btnSave.checkSetPressed()
                    this.btnAdvance.checkSetPressed()
                }
            } else if (eventType === POINTER_EVENT.UP) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    if (this.btnSave.pressed) {
                        this.btnSave.setReleased()
                        // TODO switch to save screen
                    } else if (this.btnAdvance.pressed) {
                        this.btnAdvance.setReleased()
                        this.hide()
                        this.onAdvance()
                    }
                }
            }
            if (this.btnSave.needsRedraw || this.btnAdvance.needsRedraw) this.redraw()
            return false
        })
        this.btnLayer.onRedraw = (context) => {
            this.btnSave.draw(context)
            this.btnAdvance.draw(context)
        }
    }

    show() {
        this.resultIndex = 0
        this.btnSave.visible = false
        this.btnAdvance.visible = false
        this.uncoverResult()
        const levelFullNameImg = this.titleFont.createTextImage(GameState.levelFullName)
        let resultText = this.cfg.quitText
        this.resultLastIndex = this.images.length - 2
        if (GameState.resultState === GameResultState.COMPLETE) {
            resultText = this.cfg.completeText
            this.resultLastIndex = this.images.length - 1
        } else if (GameState.resultState === GameResultState.FAILED) {
            resultText = this.cfg.failedText
        }
        const resultValues = []
        resultValues.push(this.fonts['crystals'].createTextImage(this.percentString(GameState.numCrystal, GameState.neededCrystals)))
        resultValues.push(this.fonts['ore'].createTextImage(this.percentString(GameState.numOre, GameState.totalOres)))
        resultValues.push(this.fonts['diggable'].createTextImage(this.percentString(GameState.remainingDiggables, GameState.totalDiggables, true)))
        resultValues.push(this.fonts['constructions'].createTextImage(GameState.buildings.length.toString()))
        resultValues.push(this.fonts['caverns'].createTextImage(this.percentString(GameState.remainingCaverns, GameState.totalCaverns, true)))
        resultValues.push(this.fonts['figures'].createTextImage(this.percentString(GameState.raiders.length, GameState.getMaxRaiders())))
        resultValues.push(this.fonts['rockmonsters'].createTextImage(this.percentString(0))) // TODO show defence report
        resultValues.push(this.fonts['oxygen'].createTextImage(this.percentString(GameState.airlevel)))
        resultValues.push(this.fonts['timer'].createTextImage(this.timeString(GameState.levelStopTime - GameState.levelStartTime)))
        resultValues.push(this.fonts['score'].createTextImage(this.percentString(0.99))) // TODO calculate level score
        const gameResultTextImg = this.titleFont.createTextImage(resultText)
        this.resultsLayer.onRedraw = (context) => {
            for (let c = 0; c <= this.resultIndex; c++) {
                const img = this.images[c]
                if (img) context.drawImage(img.img, img.x, img.y)
            }
            for (let c = 0; c <= this.resultIndex; c++) {
                const box = this.boxes[c]
                if (box) context.drawImage(box.img, box.x, box.y)
            }
            for (let c = 0; c <= this.resultIndex; c++) {
                const txt = this.cfg.texts[c]
                const text = resultValues[c]
                if (text) context.drawImage(text, txt.x - text.width / 2, txt.y)
            }
            context.drawImage(levelFullNameImg, this.resultsLayer.fixedWidth / 2 - levelFullNameImg.width / 2, this.cfg.vertSpacing - levelFullNameImg.height / 2)
            context.drawImage(gameResultTextImg, this.resultsLayer.fixedWidth / 2 - gameResultTextImg.width / 2, this.cfg.vertSpacing + levelFullNameImg.height / 2)
        }
        this.descriptionTextLayer.onRedraw = (context) => {
            const descriptionTextImg = this.texts[this.resultIndex]
            context.clearRect(0, this.cfg.textPos[1], this.descriptionTextLayer.fixedWidth, this.descriptionTextLayer.fixedHeight - this.cfg.textPos[1])
            const tx = this.resultIndex !== this.images.length - 1 ? this.cfg.textPos[0] : 305
            const ty = this.resultIndex !== this.images.length - 1 ? this.cfg.textPos[1] : 195
            context.drawImage(descriptionTextImg, tx - descriptionTextImg.width / 2, ty)
        }
        super.show()
    }

    percentString(actual, max = 1, lessIsMore: boolean = false) {
        if (max === 0) max = 1
        let value = Math.round(Math.max(Math.min(actual / max, 1), 0) * 100)
        if (lessIsMore) value = 100 - value
        return value.toString() + '%'
    }

    padLeft(value: string, padding = '0', length = 2) {
        while (value.length < length) value = padding + value
        return value
    }

    timeString(timediffMs: number) {
        const seconds = Math.round(timediffMs / 1000)
        const ss = this.padLeft((seconds % 60).toString())
        const minutes = Math.floor(seconds / 60)
        const mm = this.padLeft(((minutes % 60).toString()))
        const hh = this.padLeft((Math.floor(minutes / 60).toString()))
        return hh + ':' + mm + ':' + ss
    }

    uncoverResult() {
        this.uncoverTimeout = setTimeout(() => {
            this.uncoverTimeout = null
            this.resultIndex++
            if (this.resultIndex < this.resultLastIndex) {
                this.uncoverResult()
            } else {
                this.btnSave.visible = true
                this.btnAdvance.visible = true
            }
            this.redraw()
        }, this.cfg.timer * 1000)
    }

}
