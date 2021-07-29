import { ButtonCfg } from '../../cfg/ButtonCfg'
import { DialogCfg } from '../../cfg/DialogCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { BitmapFont } from '../../core/BitmapFont'
import { Rect } from '../../core/Rect'
import { GuiResourceCache } from '../GuiResourceCache'

export class BriefingPanelCfg extends PanelCfg {
    // XXX find config values for this class

    titleFont: BitmapFont
    title: string
    titleWindow: Rect
    textFont: BitmapFont
    textWindow: Rect
    nextButtonCfg: ButtonCfg
    backButtonCfg: ButtonCfg

    constructor() {
        super([])
        this.titleFont = GuiResourceCache.getBitmapFont('Interface/Fonts/MbriefFont2.bmp')
        this.title = GuiResourceCache.cfg('Main', 'MissionBriefingText')
        const dialogCfg = new DialogCfg(GuiResourceCache.cfg('Dialog'))
        this.titleWindow = dialogCfg.titleWindow
        this.textFont = GuiResourceCache.getBitmapFont('Interface/Fonts/MbriefFont.bmp')
        this.textWindow = dialogCfg.textWindow
        this.textWindow.y -= 10
        this.nextButtonCfg = {
            buttonType: 'Next briefing paragraph',
            relX: 394,
            relY: 214,
            normalFile: GuiResourceCache.cfg('Main', 'NextButton640x480'),
        }
        this.backButtonCfg = {
            buttonType: 'Previous briefing paragraph',
            relX: 54,
            relY: 214,
            normalFile: GuiResourceCache.cfg('Main', 'BackArrow'),
        }
    }
}
