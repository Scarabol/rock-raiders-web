import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'

export class OptionsPanel extends MenuBasePanel {
    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onContinueMission: () => any = () => console.log('continue mission')

    constructor(parent: BaseElement, cfg: MenuCfg, width: number, height: number) {
        super(parent, cfg)
        this.width = width
        this.height = height
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => this.onRepeatBriefing()
        this.layersByKey.get('menu1').itemsTrigger[1].onClick = () => this.onContinueMission()
    }
}
