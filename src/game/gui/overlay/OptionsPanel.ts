import { MenuCfg } from '../../../cfg/MenuCfg'
import { MenuBasePanel } from './MenuBasePanel'
import { ScaledLayer } from '../../../screen/ScreenLayer'

export class OptionsPanel extends MenuBasePanel {

    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')

    constructor(layer: ScaledLayer, cfg: MenuCfg) {
        super(layer, cfg)
        const panel = this
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => panel.onRepeatBriefing()
        this.layersByKey.get('menu1').itemsTrigger[1].onClick = () => panel.hide()
    }

}
