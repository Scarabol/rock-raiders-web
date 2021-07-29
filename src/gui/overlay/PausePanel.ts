import { MenuCfg } from '../../cfg/MenuCfg'
import { BaseElement } from '../base/BaseElement'
import { MenuBasePanel } from './MenuBasePanel'

export class PausePanel extends MenuBasePanel {
    onContinueGame: () => any = () => console.log('continue mission')
    onRepeatBriefing: () => any = () => console.log('repeat mission briefing')
    onAbortGame: () => any = () => console.log('abort mission')
    onRestartGame: () => any = () => console.log('restart mission')

    constructor(parent: BaseElement, cfg: MenuCfg) {
        super(parent, cfg)
        this.layersByKey.get('menu1').itemsTrigger[0].onClick = () => this.onContinueGame() // Pause
        this.layersByKey.get('menu2').itemsTrigger[0].onClick = () => this.onRepeatBriefing() // Options
        this.layersByKey.get('menu3').itemsTrigger[0].onClick = () => this.onAbortGame() // Quit
        this.layersByKey.get('menu4').itemsTrigger[0].onClick = () => this.onRestartGame() // Restart
    }
}
