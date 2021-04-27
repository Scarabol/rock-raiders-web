import { MenuCfg } from '../../cfg/MenuCfg'
import { ScaledLayer } from '../../screen/layer/ScreenLayer'
import { MenuBasePanel } from './MenuBasePanel'

export class OptionsPanel extends MenuBasePanel {

    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')

    constructor(layer: ScaledLayer, cfg: MenuCfg) {
        super(layer, cfg)
        const panel = this
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => panel.onRepeatBriefing()
        this.layersByKey.get('menu1').itemsTrigger[1].onClick = () => panel.hide()
    }

}
