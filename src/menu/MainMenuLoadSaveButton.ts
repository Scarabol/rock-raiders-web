import { MainMenuBaseItem } from './MainMenuBaseItem'
import { MainMenuLayer } from './MainMenuLayer'
import { ResourceManager } from '../resource/ResourceManager'

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

    constructor(layer: MainMenuLayer, index: number, x: number, y: number) {
        super()
        const menuCfg = ResourceManager.configuration.menu
        const loadLabel = menuCfg.loadGame
        this.labelLoadImgLo = layer.loFont.createTextImage(loadLabel + ' ' + index)
        this.labelLoadImgHi = layer.hiFont.createTextImage(loadLabel + ' ' + index)
        const saveLabel = menuCfg.saveGame
        this.labelSaveImgLo = layer.loFont.createTextImage(saveLabel + ' ' + index)
        this.labelSaveImgHi = layer.hiFont.createTextImage(saveLabel + ' ' + index)
        this.width = Math.max(this.labelLoadImgLo.width, this.labelLoadImgHi.width) + menuCfg.saveImage.BigWidth
        this.height = Math.max(this.labelLoadImgLo.height, this.labelLoadImgHi.height)
        this.x = x
        this.y = y
        this.actionNameLoad = 'load_game_' + index
        this.actionNameSave = 'save_game_' + index
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
        const img = this.hover && !this.pressed ? this.labelImgHi : this.labelImgLo
        context.drawImage(img, this.x + 80, this.y)
    }
}
