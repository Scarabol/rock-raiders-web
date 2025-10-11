import { Button } from '../base/Button'
import { ChangeTooltip, HideTooltip } from '../../event/GuiCommand'
import { DEV_MODE, TOOLTIP_DELAY_SFX } from '../../params'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { EntityType, getEntityTypeByName } from '../../game/model/EntityType'
import { EventKey } from '../../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersAmountChangedEvent } from '../../event/LocalEvents'
import { EntityDependency, EntityDependencyChecked, GameConfig } from '../../cfg/GameConfig'
import { DependencySpriteWorkerPool } from '../../worker/DependencySpriteWorkerPool'
import { clearTimeoutSafe } from '../../core/Util'
import { InterfaceImageEntryCfg } from '../../cfg/InterfaceImageCfg'

export class IconPanelButton extends Button {
    tooltipDisabled: string
    tooltipDisabledSfx: string
    hotkey: string
    isDisabled: () => boolean = () => true
    hasRaider: boolean = false
    discoveredBuildingsMaxLevel: Map<EntityType, number> = new Map()
    dependencyTooltipImage?: SpriteImage
    showDependencies: boolean = false
    hasUnfulfilledDependency: boolean = false
    showDependenciesTimeout?: NodeJS.Timeout

    constructor(interfaceImageCfg: InterfaceImageEntryCfg, parentWidth: number, menuIndex: number) {
        super(interfaceImageCfg)
        this.relX = parentWidth - 59
        this.relY = 9 + this.height * menuIndex
        this.hoverFrame = true
        this.tooltipDisabled = interfaceImageCfg.tooltipDisabled
        this.tooltipDisabledSfx = interfaceImageCfg.tooltipDisabledSfx
        this.hotkey = interfaceImageCfg.hotkey
        this.onClick = () => console.log(`menu item pressed: ${this.buttonType}`)
        this.addDependencyCheck(getEntityTypeByName(this.buttonType))
    }

    addDependencyCheck(entityType: EntityType) {
        if (!entityType) return
        const dependencies = GameConfig.instance.dependencies[entityType.toLowerCase()]
        if (!dependencies) return
        if (dependencies.some((d) => d.entityType === EntityType.PILOT)) {
            this.registerEventListener(EventKey.RAIDER_AMOUNT_CHANGED, (event: RaidersAmountChangedEvent) => {
                this.hasRaider = event.hasRaider
                this.updateDependenciesSprite(dependencies)
            })
        }
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.discoveredBuildingsMaxLevel = event.discoveredBuildingsMaxLevel
            this.updateDependenciesSprite(dependencies)
        })
    }

    private updateDependenciesSprite(dependencies: EntityDependency[]) {
        const checked: EntityDependencyChecked[] = dependencies.map((d: EntityDependency): EntityDependencyChecked => ({
            entityType: d.entityType,
            itemKey: d.itemKey,
            minLevel: d.minLevel,
            isOk: (d.entityType === EntityType.PILOT && this.hasRaider)
                || (this.discoveredBuildingsMaxLevel.getOrUpdate(d.entityType, () => -1) >= d.minLevel),
        }))
        this.hasUnfulfilledDependency = !DEV_MODE && checked.some((d) => !d.isOk)
        DependencySpriteWorkerPool.instance.createDependenciesSprite(checked).then((dependencySprite) => this.dependencyTooltipImage = dependencySprite)
        this.updateState(true)
    }

    showTooltipDisabled() {
        super.showTooltipDisabled()
        if (this.tooltipDisabled || this.tooltipDisabledSfx) {
            this.publishEvent(new ChangeTooltip(this.tooltipDisabled, 0, this.tooltipDisabledSfx, TOOLTIP_DELAY_SFX))
        }
    }

    reset() {
        super.reset()
        this.hasUnfulfilledDependency = false
        this.hasRaider = false
        this.discoveredBuildingsMaxLevel = new Map()
        this.updateState(false)
        this.showDependenciesTimeout = clearTimeoutSafe(this.showDependenciesTimeout)
    }

    hide() {
        super.hide()
        this.showDependenciesTimeout = clearTimeoutSafe(this.showDependenciesTimeout)
    }

    updateState(autoRedraw: boolean = true) {
        const targetState = this.isDisabled()
        const stateChanged = this.disabled !== targetState
        this.disabled = targetState
        if (stateChanged) {
            if (autoRedraw) this.notifyRedraw()
            if (this.disabled) {
                this.publishEvent(new HideTooltip(this.tooltip))
            } else {
                this.publishEvent(new HideTooltip(this.tooltipDisabled))
            }
        }
        return stateChanged
    }

    onPointerLeave(): boolean {
        let stateChanged = super.onPointerLeave()
        if (this.showDependencies || this.showDependenciesTimeout) {
            this.showDependencies = false
            this.showDependenciesTimeout = clearTimeoutSafe(this.showDependenciesTimeout)
            stateChanged = true
        }
        return stateChanged
    }

    onRedraw(context: SpriteContext) {
        super.onRedraw(context)
        if (this.showDependencies && this.dependencyTooltipImage) {
            context.drawImage(this.dependencyTooltipImage, this.x - this.dependencyTooltipImage.width, this.y + (this.height - this.dependencyTooltipImage.height) / 2)
        }
    }

    isInRect(sx: number, sy: number): boolean {
        const inRect = super.isInRect(sx, sy)
        if (inRect) {
            if (!this.showDependenciesTimeout) {
                this.showDependenciesTimeout = setTimeout(() => {
                    this.showDependencies = true
                    this.notifyRedraw()
                }, 500)
            }
        } else {
            this.showDependencies = false
            this.showDependenciesTimeout = clearTimeoutSafe(this.showDependenciesTimeout)
        }
        return inRect
    }
}
