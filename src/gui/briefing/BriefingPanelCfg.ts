import { ButtonCfg } from '../../cfg/ButtonCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { Rect } from '../../core/Rect'
import { GameConfig } from '../../cfg/GameConfig'

export class BriefingPanelCfg extends PanelCfg {
    // XXX find config values for this class

    titleFontName: string
    titleWindow: Rect
    textFontName: string
    textWindow: Rect
    nextButtonCfg: ButtonCfg
    backButtonCfg: ButtonCfg

    constructor() {
        super()
        this.titleFontName = 'Interface/Fonts/MbriefFont2.bmp'
        const dialogCfg = GameConfig.instance.dialog
        this.titleWindow = dialogCfg.titleWindow
        this.textFontName = 'Interface/Fonts/MbriefFont.bmp'
        this.textWindow = {...dialogCfg.textWindow}
        this.textWindow.y -= 10 // XXX Why offset needed? Better use help window?
        this.nextButtonCfg = {
            buttonType: 'Next briefing paragraph',
            relX: 394,
            relY: 214,
            normalFile: GameConfig.instance.main.nextButton640x480,
        }
        this.backButtonCfg = {
            buttonType: 'Previous briefing paragraph',
            relX: 54,
            relY: 214,
            normalFile: GameConfig.instance.main.backArrow,
        }
    }
}
