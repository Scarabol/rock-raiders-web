import { MenuCfg } from '../../cfg/MenuCfg'
import { ScaledLayer } from '../../screen/layer/ScreenLayer'
import { MenuBasePanel } from './MenuBasePanel'

export class PausePanel extends MenuBasePanel {

    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onAbortGame: () => any = () => console.log('abort mission')
    onRestartGame: () => any = () => console.log('restart mission')

    constructor(layer: ScaledLayer, cfg: MenuCfg) {
        super(layer, cfg)
        const pausePanel = this
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => pausePanel.hide() // Pause
        this.layersByKey.get('menu2').itemsTrigger[0].onClick = () => pausePanel.onRepeatBriefing() // Options
        this.layersByKey.get('menu3').itemsTrigger[0].onClick = () => pausePanel.onAbortGame() // Quit
        this.layersByKey.get('menu4').itemsTrigger[0].onClick = () => pausePanel.onRestartGame() // Restart
    }

}
