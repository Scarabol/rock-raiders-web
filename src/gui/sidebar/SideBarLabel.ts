import { ButtonCfg } from '../../cfg/ButtonCfg'
import { SpriteContext } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { GameConfig } from '../../cfg/GameConfig'

export class SideBarLabel extends BaseElement {
    tooltip: string
    label: string

    constructor(btnCfg: ButtonCfg) {
        super()
        this.relX = btnCfg.relX
        this.relY = btnCfg.relY
        this.width = btnCfg.width
        this.height = btnCfg.height
        this.tooltip = GameConfig.instance.getTooltipText(btnCfg.tooltipKey)
        this.label = '0'
        this.updatePosition()
    }

    reset() {
        super.reset()
        this.label = '0'
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        context.textAlign = 'center'
        context.font = 'bold 10px sans-serif'
        context.fillStyle = '#fff'
        context.fillText(this.label, this.x + this.width / 2, this.y + this.height - 2)
        super.onRedraw(context)
    }
}
