import { ButtonCfg } from '../../cfg/ButtonCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { Rect } from '../../core/Rect'
import { ResourceManager } from '../../resource/ResourceManager'

export class BriefingPanelCfg extends PanelCfg {
    // XXX find config values for this class

    titleFontName: string
    title: string
    titleWindow: Rect
    textFontName: string
    textWindow: Rect
    nextButtonCfg: ButtonCfg
    backButtonCfg: ButtonCfg

    constructor() {
        super()
        this.titleFontName = 'Interface/Fonts/MbriefFont2.bmp'
        this.title = ResourceManager.configuration.main.missionBriefingText
        const dialogCfg = ResourceManager.configuration.dialog
        this.titleWindow = dialogCfg.titleWindow
        this.textFontName = 'Interface/Fonts/MbriefFont.bmp'
        this.textWindow = {...dialogCfg.textWindow}
        this.textWindow.y -= 10 // XXX Why offset needed? Better use help window?
        this.nextButtonCfg = {
            buttonType: 'Next briefing paragraph',
            relX: 394,
            relY: 214,
            normalFile: ResourceManager.configuration.main.nextButton640x480,
        }
        this.backButtonCfg = {
            buttonType: 'Previous briefing paragraph',
            relX: 54,
            relY: 214,
            normalFile: ResourceManager.configuration.main.backArrow,
        }
    }
}
