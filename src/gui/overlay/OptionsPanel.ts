import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'

export class OptionsPanel extends MenuBasePanel {

    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')

    constructor(parent: BaseElement, width: number, height: number, cfg: MenuCfg) {
        super(parent, width, height, cfg)
        const panel = this
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => panel.onRepeatBriefing()
        this.layersByKey.get('menu1').itemsTrigger[1].onClick = () => panel.hide()
    }

}
