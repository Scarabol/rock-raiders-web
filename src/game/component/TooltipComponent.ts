import { AbstractGameComponent, GameEntity } from '../ECS'
import { SpriteImage } from '../../core/Sprite'
import { ChangeTooltip, ForceRedrawTooltip } from '../../event/GuiCommand'
import { TOOLTIP_DELAY_SFX, TOOLTIP_DELAY_TEXT_SCENE } from '../../params'

export class TooltipComponent extends AbstractGameComponent {
    constructor(readonly entity: GameEntity, public tooltipText: string, public sfxKey: string, readonly getTextImg?: () => Promise<SpriteImage>) {
        super()
    }

    createEvent(): ChangeTooltip {
        const result = new ChangeTooltip(this.tooltipText, TOOLTIP_DELAY_TEXT_SCENE, this.sfxKey, TOOLTIP_DELAY_SFX, this.getTextImg)
        result.tooltipKey = this.tooltipText + this.entity // change key to make it unique per entity
        return result
    }

    createForceRedrawEvent(): ForceRedrawTooltip {
        const result = new ForceRedrawTooltip(this.tooltipText, this.getTextImg)
        result.tooltipKey = this.tooltipText + this.entity // change key to make it unique per entity
        return result
    }
}
