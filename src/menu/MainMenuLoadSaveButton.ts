import { SpriteContext, SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'

export class MainMenuLoadSaveButton extends MainMenuBaseItem {
    loading: boolean = null
    labelLoadImgLo: SpriteImage = null
    labelLoadImgHi: SpriteImage = null
    labelSaveImgLo: SpriteImage = null
    labelSaveImgHi: SpriteImage = null
    labelImgLo: SpriteImage = null
    labelImgHi: SpriteImage = null
    actionNameLoad: string = ''
    actionNameSave: string = ''
    saveGameImg: SpriteImage = null
    saveGameImgWidthLo: number = 0
    saveGameImgHeightLo: number = 0
    saveGameImgWidthHi: number = 0
    saveGameImgHeightHi: number = 0

    constructor(layer: MainMenuLayer, index: number, x: number, y: number) {
        super()
        const menuCfg = ResourceManager.configuration.menu
        const loadLabel = menuCfg.loadGame
        const btnNum = index + 1
        this.labelLoadImgLo = layer.loFont.createTextImage(loadLabel + ' ' + btnNum)
        this.labelLoadImgHi = layer.hiFont.createTextImage(loadLabel + ' ' + btnNum)
        const saveLabel = menuCfg.saveGame
        this.labelSaveImgLo = layer.loFont.createTextImage(saveLabel + ' ' + btnNum)
        this.labelSaveImgHi = layer.hiFont.createTextImage(saveLabel + ' ' + btnNum)
        this.width = Math.max(this.labelLoadImgLo.width, this.labelLoadImgHi.width) + menuCfg.saveImage.BigWidth
        this.height = Math.max(this.labelLoadImgLo.height, this.labelLoadImgHi.height)
        this.x = x
        this.y = y
        this.targetIndex = index
        this.actionNameLoad = 'load_game_' + index
        this.actionNameSave = 'save_game_' + index
        this.saveGameImgWidthLo = menuCfg.saveImage.Width
        this.saveGameImgHeightLo = menuCfg.saveImage.Height
        this.saveGameImgWidthHi = menuCfg.saveImage.BigWidth
        this.saveGameImgHeightHi = menuCfg.saveImage.BigHeight
        this.setMode(true)
    }

    setMode(loading: boolean) {
        if (this.loading === loading) return
        this.loading = loading
        if (this.loading) {
            this.labelImgLo = this.labelLoadImgLo
            this.labelImgHi = this.labelLoadImgHi
            this.actionName = this.actionNameLoad
        } else {
            this.labelImgLo = this.labelSaveImgLo
            this.labelImgHi = this.labelSaveImgHi
            this.actionName = this.actionNameSave
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
        const img = this.state.hover && !this.state.pressed ? this.labelImgHi : this.labelImgLo
        context.drawImage(img, this.x + 80, this.y)
    }
}
