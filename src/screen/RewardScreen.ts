import { RewardCfg } from '../cfg/RewardCfg'
import { SpriteImage } from '../core/Sprite'
import { clearTimeoutSafe } from '../core/Util'
import { MOUSE_BUTTON } from '../event/EventTypeEnum'
import { GameResult, GameResultState } from '../game/model/GameResult'
import { LoadSaveLayer } from '../menu/LoadSaveLayer'
import { MainMenuBaseItem } from '../menu/MainMenuBaseItem'
import { RewardScreenButton } from '../menu/RewardScreenButton'
import { ResourceManager } from '../resource/ResourceManager'
import { SaveGameManager } from '../resource/SaveGameManager'
import { ScaledLayer } from './layer/ScreenLayer'
import { ScreenMaster } from './ScreenMaster'
import { EventKey } from '../event/EventKeyEnum'
import { AdvanceAfterRewardsEvent, ShowGameResultEvent } from '../event/LocalEvents'
import { OverwriteLayer } from '../menu/OverwriteLayer'
import { FlicAnimOverlay } from '../menu/FlicAnimOverlay'
import { imgDataToCanvas } from '../core/ImageHelper'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'

export class RewardScreen {
    readonly cfg: RewardCfg = null
    readonly backgroundLayer: ScaledLayer
    readonly resultsLayer: ScaledLayer
    readonly descriptionTextLayer: ScaledLayer
    readonly btnLayer: ScaledLayer
    readonly saveGameLayer: LoadSaveLayer
    readonly overwriteLayer: OverwriteLayer
    readonly images: { img: SpriteImage, x: number, y: number }[] = []
    readonly boxes: { img: SpriteImage, x: number, y: number }[] = []
    readonly flics: FlicAnimOverlay[] = []
    readonly fontNames: Map<string, string> = new Map()
    readonly btnSave: RewardScreenButton
    readonly btnAdvance: RewardScreenButton
    resultIndex: number = 0
    resultLastIndex: number = 0
    texts: SpriteImage[] = []
    uncoverTimeout: NodeJS.Timeout = null
    levelFullNameImg: SpriteImage
    resultText: string
    resultValues: SpriteImage[] = []
    screenshot: HTMLCanvasElement = null

    constructor(readonly screenMaster: ScreenMaster) {
        this.cfg = GameConfig.instance.reward
        const backgroundImg = ResourceManager.getImage(this.cfg.wallpaper)
        this.backgroundLayer = screenMaster.addLayer(new ScaledLayer('RewardBackgroundLayer'), 600)
        this.backgroundLayer.animationFrame.onRedraw = (context) => context.drawImage(backgroundImg, 0, 0)
        this.cfg.images.forEach((img) => {
            this.images.push({img: ResourceManager.getImage(img.filePath), x: img.x, y: img.y})
        })
        this.cfg.boxImages.forEach((img) => {
            this.boxes.push({img: ResourceManager.getImage(img.filePath), x: img.x, y: img.y})
        })
        Promise.all(Object.keys(this.cfg.fonts).map((fontKey, index) => {
            this.fontNames.set(fontKey.toLowerCase(), this.cfg.fonts[fontKey])
            const labelFontName = index < 9 ? this.cfg.fonts[fontKey] : this.cfg.backFont
            return BitmapFontWorkerPool.instance.createTextImage(labelFontName, this.cfg.text[index].text)
        })).then((textImages) => this.texts = textImages)
        this.resultsLayer = screenMaster.addLayer(new ScaledLayer('RewardResultsLayer'), 610)
        this.resultsLayer.addEventListener('pointerup', (): boolean => {
            this.uncoverTimeout = clearTimeoutSafe(this.uncoverTimeout)
            this.resultIndex = this.resultLastIndex
            this.btnSave.visible = true
            this.btnAdvance.visible = true
            this.resultsLayer.animationFrame.notifyRedraw()
            this.descriptionTextLayer.animationFrame.notifyRedraw()
            this.btnLayer.animationFrame.notifyRedraw()
            return true
        })
        const keyToIndex = ['crystals', 'ore', 'diggable', 'constructions', 'caverns', 'figures', 'rockmonsters', 'oxygen', 'timer', 'score']
        this.cfg.flics.forEach((flic, key) => {
            const flicIndex = keyToIndex.indexOf(key)
            const flhImgData = ResourceManager.getResource(flic.flhFilepath) ?? []
            if (flhImgData.length > 0) {
                const flicImages = flhImgData.map((f: ImageData) => imgDataToCanvas(f))
                this.flics[flicIndex] = new FlicAnimOverlay(this.resultsLayer.animationFrame, flicImages, flic.rect.x, flic.rect.y, '') // XXX Consider width/height of rect to scale/clip?
            }
        })
        this.descriptionTextLayer = screenMaster.addLayer(new ScaledLayer('RewardDescriptionLayer'), 620)
        this.btnLayer = screenMaster.addLayer(new ScaledLayer('RewardButtonLayer'), 650)
        this.btnSave = new RewardScreenButton(this.cfg.saveButton, 'ToolTip_Reward_Save')
        this.btnSave.onPressed = () => this.saveGameLayer.show()
        this.btnAdvance = new RewardScreenButton(this.cfg.advanceButton, 'ToolTip_Reward_Advance')
        this.btnAdvance.onPressed = () => this.onAdvancePressed()
        this.btnLayer.addEventListener('pointermove', (event: PointerEvent): boolean => {
            const [canvasX, canvasY] = this.btnLayer.transformCoords(event.clientX, event.clientY)
            this.btnSave.setHovered(this.btnSave.isHovered(canvasX, canvasY))
            this.btnAdvance.setHovered(this.btnAdvance.isHovered(canvasX, canvasY))
            if (this.btnSave.needsRedraw || this.btnAdvance.needsRedraw) this.btnLayer.animationFrame.notifyRedraw()
            return false
        })
        this.btnLayer.addEventListener('pointerleave', (): boolean => {
            this.btnSave.setHovered(false)
            this.btnAdvance.setHovered(false)
            if (this.btnSave.needsRedraw || this.btnAdvance.needsRedraw) this.btnLayer.animationFrame.notifyRedraw()
            return false
        })
        this.btnLayer.addEventListener('pointerdown', (event: PointerEvent): boolean => {
            if (event.button === MOUSE_BUTTON.MAIN) {
                const [canvasX, canvasY] = this.btnLayer.transformCoords(event.clientX, event.clientY)
                this.btnSave.setHovered(this.btnSave.isHovered(canvasX, canvasY))
                this.btnAdvance.setHovered(this.btnAdvance.isHovered(canvasX, canvasY))
                this.btnSave.onMouseDown()
                this.btnAdvance.onMouseDown()
                if (this.btnSave.needsRedraw || this.btnAdvance.needsRedraw) {
                    this.btnLayer.animationFrame.notifyRedraw()
                    return true
                }
            }
            return false
        })
        this.btnLayer.addEventListener('pointerup', (event: PointerEvent): boolean => {
            if (event.button === MOUSE_BUTTON.MAIN) {
                this.btnSave.onMouseUp()
                this.btnAdvance.onMouseUp()
                if (this.btnSave.needsRedraw || this.btnAdvance.needsRedraw) {
                    this.btnLayer.animationFrame.notifyRedraw()
                    return true
                }
            }
            return false
        })
        this.btnLayer.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.btnLayer.canvas.width, this.btnLayer.canvas.height)
            this.btnSave.draw(context)
            this.btnAdvance.draw(context)
        }
        BitmapFontWorkerPool.instance.createTextImage(this.cfg.titleFont, 'No level selected')
            .then((textImage) => this.levelFullNameImg = textImage)
        this.saveGameLayer = screenMaster.addLayer(new LoadSaveLayer(GameConfig.instance.menu.mainMenuFull.menus[3], false), 660)
        this.overwriteLayer = screenMaster.addLayer(new OverwriteLayer(), 670)
        this.saveGameLayer.onItemAction = (item: MainMenuBaseItem) => {
            if (item.actionName.equalsIgnoreCase('next')) {
                this.saveGameLayer.hide()
            } else if (item.actionName.toLowerCase().startsWith('save_game_')) {
                if (SaveGameManager.hasSaveGame(item.targetIndex)) {
                    this.overwriteLayer.overwritePanel.setIndex(item.targetIndex)
                    this.overwriteLayer.yesBtn.onPressed = () => {
                        SaveGameManager.saveGame(item.targetIndex, this.screenshot)
                        this.overwriteLayer.hide()
                        this.saveGameLayer.hide()
                    }
                    this.overwriteLayer.show()
                } else {
                    SaveGameManager.saveGame(item.targetIndex, this.screenshot)
                    this.saveGameLayer.hide()
                }
            } else {
                console.warn(`not implemented: ${item.actionName} - ${item.targetIndex}`)
            }
        }
        EventBroker.subscribe(EventKey.SHOW_GAME_RESULT, (event: ShowGameResultEvent) => {
            if (event.result.rewardConfig) {
                this.showGameResult(event.result)
            } else {
                this.onAdvancePressed()
            }
        })
    }

    dispose() {
        this.screenMaster.removeLayer(this.backgroundLayer)
        this.screenMaster.removeLayer(this.resultsLayer)
        this.screenMaster.removeLayer(this.descriptionTextLayer)
        this.screenMaster.removeLayer(this.btnLayer)
        this.screenMaster.removeLayer(this.saveGameLayer)
        this.screenMaster.removeLayer(this.overwriteLayer)
    }

    onAdvancePressed() {
        this.backgroundLayer.hide()
        this.resultsLayer.hide()
        this.descriptionTextLayer.hide()
        this.btnLayer.hide()
        this.saveGameLayer.hide()
        this.flics.forEach((f) => f.stop())
        EventBroker.publish(new AdvanceAfterRewardsEvent())
    }

    showGameResult(result: GameResult) {
        console.log('Your game result', result)
        BitmapFontWorkerPool.instance.createTextImage(this.cfg.titleFont, result.levelFullName)
            .then((textImage) => this.levelFullNameImg = textImage)
        this.btnSave.disabled = result.state !== GameResultState.COMPLETE
        this.resultText = this.cfg.quitText
        this.resultLastIndex = this.images.length - 2
        if (result.state === GameResultState.COMPLETE) {
            this.resultText = this.cfg.completeText
            this.resultLastIndex = this.images.length - 1
        } else if (result.state === GameResultState.FAILED) {
            this.resultText = this.cfg.failedText
        }
        this.screenshot = result.screenshot
        this.resultValues.length = 0
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('crystals'), this.percentString(result.numCrystal, result.rewardConfig?.quota?.crystals || 0)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('ore'), this.percentString(result.numOre, result.numTotalOres)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('diggable'), this.percentString(result.remainingDiggables, result.totalDiggables, true)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('constructions'), result.numBuildings.toString()),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('caverns'), this.percentString(result.discoveredCaverns, result.rewardConfig?.quota?.caverns || 0)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('figures'), this.percentString(result.numRaiders, result.numMaxAirRaiders)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('rockmonsters'), this.percentString(result.defencePercent, 100)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('oxygen'), this.percentString(result.airLevelPercent, 100)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('timer'), this.timeString(result.gameTimeSeconds)),
            BitmapFontWorkerPool.instance.createTextImage(this.fontNames.get('score'), `${result.score}%`),
        ]).then((textImages) => {
            this.resultValues = textImages
            this.show()
        })
    }

    show() {
        this.resultIndex = 0
        this.btnSave.visible = false
        this.btnAdvance.visible = false
        this.uncoverResult()
        BitmapFontWorkerPool.instance.createTextImage(this.cfg.titleFont, this.resultText)
            .then((gameResultTextImg) => {
                this.resultsLayer.animationFrame.onRedraw = (context) => {
                    context.clearRect(0, 0, this.resultsLayer.fixedWidth, this.resultsLayer.fixedHeight)
                    for (let c = 0; c <= this.resultIndex; c++) {
                        const img = this.images[c]
                        if (img) context.drawImage(img.img, img.x, img.y)
                    }
                    const flic = this.flics[this.resultIndex + 1]
                    flic?.draw(context)
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
            })
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
            const flic = this.resultIndex < this.resultLastIndex ? this.flics[this.resultIndex + 1] : null // XXX does not work for flics on first entry
            const flicBeforeNext = flic?.play() ?? Promise.resolve()
            flicBeforeNext.then(() => {
                if (this.resultIndex < this.resultLastIndex) {
                    this.resultIndex++
                    this.uncoverResult()
                } else {
                    this.btnSave.visible = true
                    this.btnAdvance.visible = true
                }
                this.resultsLayer.animationFrame.notifyRedraw()
                this.descriptionTextLayer.animationFrame.notifyRedraw()
                this.btnLayer.animationFrame.notifyRedraw()
            })
        }, this.cfg.timerMs)
    }
}
