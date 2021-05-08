import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'

export class OptionsPanel extends MenuBasePanel {

    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')

    constructor(parent: BaseElement, cfg: MenuCfg) {
        super(parent, cfg)
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => this.onRepeatBriefing()
        this.layersByKey.get('menu1').itemsTrigger[1].onClick = () => this.hide()
    }

}
