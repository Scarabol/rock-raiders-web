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
        if (!dialogCfg.titleWindow) throw new Error('No title window config given')
        this.titleWindow = {...dialogCfg.titleWindow}
        this.textFontName = 'Interface/Fonts/MbriefFont.bmp'
        if (!dialogCfg.textWindow) throw new Error('No text window config given')
        this.textWindow = {...dialogCfg.textWindow}
        this.textWindow.y -= 10 // XXX Why offset needed? Better use help window?
        this.nextButtonCfg = Object.assign(new ButtonCfg(), {
            buttonType: 'Next briefing paragraph',
            relX: 394,
            relY: 214,
            normalFile: GameConfig.instance.main.nextButton,
        })
        this.backButtonCfg = Object.assign(new ButtonCfg(), {
            buttonType: 'Previous briefing paragraph',
            relX: 54,
            relY: 214,
            normalFile: GameConfig.instance.main.backArrow,
        })
    }
}
