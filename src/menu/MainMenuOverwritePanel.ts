import { MainMenuBaseItem } from './MainMenuBaseItem'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { GameConfig } from '../cfg/GameConfig'

export class MainMenuOverwritePanel extends MainMenuBaseItem {
    overwriteBack: SpriteImage
    titleImg: SpriteImage
    titleX: number
    titleY: number
    textImg: SpriteImage
    textX: number
    textY: number

    constructor(parentWidth: number, parentHeight: number) {
        super()
        const dialogCfg = GameConfig.instance.dialog
        this.overwriteBack = ResourceManager.getImage(dialogCfg.image)
        this.width = this.overwriteBack.width
        this.height = this.overwriteBack.height
        this.x = (parentWidth - this.width) / 2
        this.y = (parentHeight - this.height) / 2
        this.zIndex = 50
        BitmapFontWorkerPool.instance.createTextImage('Interface/Fonts/MbriefFont2.bmp', GameConfig.instance.menu.overwrite.title, dialogCfg.titleWindow.w).then((img) => {
            this.titleImg = img
            this.titleX = this.x + dialogCfg.titleWindow.x + (dialogCfg.titleWindow.w - this.titleImg.width) / 2
            this.titleY = this.y + dialogCfg.titleWindow.y
        })
    }

    setIndex(saveGameIndex: number) {
        const text = GameConfig.instance.menu.overwrite.text.replaceAll('%d', (saveGameIndex + 1).toString())
        BitmapFontWorkerPool.instance.createTextImage('Interface/Fonts/MbriefFont.bmp', text, GameConfig.instance.dialog.textWindow.w).then((img) => {
            this.textImg = img
            const dialogCfg = GameConfig.instance.dialog
            this.textX = this.x + dialogCfg.textWindow.x + (dialogCfg.textWindow.w - this.textImg.width) / 2
            this.textY = this.y + dialogCfg.textWindow.y
        })
    }

    draw(context: SpriteContext) {
        super.draw(context)
        context.drawImage(this.overwriteBack, this.x, this.y)
        if (this.titleImg) context.drawImage(this.titleImg, this.titleX, this.titleY)
        if (this.textImg) context.drawImage(this.textImg, this.textX, this.textY)
    }
}
