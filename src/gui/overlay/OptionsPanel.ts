import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'
import { setupOptionsLayer } from './OptionsLayerUtil'

export class OptionsPanel extends MenuBasePanel {
    onContinueMission: () => any = () => console.log('continue mission')
    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')

    constructor(parent: BaseElement, cfg: MenuCfg, width: number, height: number) {
        super(parent, cfg)
        this.width = width
        this.height = height
        const menu1 = this.layersByKey.get('menu1')
        menu1.itemsTrigger[1].onClick = () => this.onContinueMission()
        setupOptionsLayer(menu1, () => this.onRepeatBriefing())
    }
}
