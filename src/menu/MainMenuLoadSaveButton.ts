import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { UiElementCallback } from './UiElementState'
import { FlicAnimOverlay } from './FlicAnimOverlay'
import { imgDataToCanvas } from '../core/ImageHelper'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { GameConfig } from '../cfg/GameConfig'
import { SoundManager } from '../audio/SoundManager'
import { SAMPLE } from '../audio/Sample'

export class MainMenuLoadSaveButton extends MainMenuBaseItem {
    labelImgLo: SpriteImage = null
    labelImgHi: SpriteImage = null
    saveGameImg: SpriteImage = null
    saveGameImgWidthLo: number = 0
    saveGameImgHeightLo: number = 0
    saveGameImgWidthHi: number = 0
    saveGameImgHeightHi: number = 0
    overlay: FlicAnimOverlay

    constructor(readonly layer: MainMenuLayer, index: number, x: number, y: number, loading: boolean) {
        super(x, y)
        const menuCfg = GameConfig.instance.menu
        const btnNum = index + 1
        const buttonLabel = loading ? `${menuCfg.loadGame} ${btnNum}` : `${menuCfg.saveGame} ${btnNum}` // yes, even for "load"game the label says savegame
        Promise.all([
            BitmapFontWorkerPool.instance.createTextImage(layer.cfg.loFont, buttonLabel),
            BitmapFontWorkerPool.instance.createTextImage(layer.cfg.hiFont, buttonLabel),
        ]).then((textImages) => {
            [this.labelImgLo, this.labelImgHi] = textImages
            this.width = Math.max(this.labelImgLo.width, this.labelImgHi.width) + menuCfg.saveImage.BigWidth
            this.height = Math.max(this.labelImgLo.height, this.labelImgHi.height)
        })
        this.targetIndex = index
        if (loading) {
            const overlayCfg = layer.cfg.overlays[index]
            const flhImgData = ResourceManager.getResource(overlayCfg.flhFilepath) ?? []
            if (flhImgData.length > 0) {
                const flicImages = flhImgData.map((f: ImageData) => imgDataToCanvas(f))
                this.overlay = new FlicAnimOverlay(this.layer.animationFrame, flicImages, overlayCfg.x, overlayCfg.y, overlayCfg.sfxName)
            }
        }
        this.actionName = loading ? `load_game_${index}` : `save_game_${index}`
        this.saveGameImgWidthLo = menuCfg.saveImage.Width
        this.saveGameImgHeightLo = menuCfg.saveImage.Height
        this.saveGameImgWidthHi = menuCfg.saveImage.BigWidth
        this.saveGameImgHeightHi = menuCfg.saveImage.BigHeight
    }

    set onPressed(callback: UiElementCallback) {
        super.onPressed = async () => {
            SoundManager.playSample(SAMPLE.SFX_ButtonPressed, false)
            await this.overlay?.play()
            callback()
        }
    }

    draw(context: SpriteContext) {
        super.draw(context)
        if (this.saveGameImg) {
            if (this.state.hover) {
                const x = this.x - (this.saveGameImgWidthHi - this.saveGameImgWidthLo) / 2
                const y = this.y - (this.saveGameImgHeightHi - this.saveGameImgHeightLo) / 2
                context.drawImage(this.saveGameImg, x, y, this.saveGameImgWidthHi, this.saveGameImgHeightHi)
            } else {
                context.drawImage(this.saveGameImg, this.x, this.y, this.saveGameImgWidthLo, this.saveGameImgHeightLo)
            }
        }
        const img = (this.state.hover && !this.state.pressed) ? this.labelImgHi : this.labelImgLo
        if (img) context.drawImage(img, this.x + 80, this.y)
        this.overlay?.draw(context)
    }
}
