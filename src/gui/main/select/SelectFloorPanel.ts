import { EventKey } from '../../../event/EventKeyEnum'
import { CreatePowerPath, MakeRubble, PlaceFence } from '../../../event/GuiCommand'
import { RaidersAmountChangedEvent, SelectionChanged } from '../../../event/LocalEvents'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { EntityType } from '../../../game/model/EntityType'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectFloorPanel extends SelectBasePanel {
    isGround: boolean = false
    hasRaider: boolean = false
    isPowerPath: boolean = false
    canPlaceFence: boolean = false

    constructor(onBackPanel: Panel) {
        super(3, onBackPanel)
        const pathItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_LayPath')
        pathItem.addDependencyCheck(EntityType.POWER_PATH)
        pathItem.onClick = () => this.publishEvent(new CreatePowerPath())
        pathItem.isDisabled = () => !this.isGround || !this.hasRaider
        const removeItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_RemovePath')
        removeItem.onClick = () => this.publishEvent(new MakeRubble())
        removeItem.isDisabled = () => !this.isPowerPath
        const placeFenceItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_PlaceFence')
        placeFenceItem.addDependencyCheck(EntityType.ELECTRIC_FENCE)
        placeFenceItem.isDisabled = () => placeFenceItem.hasUnfulfilledDependency || !this.canPlaceFence
        placeFenceItem.onClick = () => this.publishEvent(new PlaceFence())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.isGround = event.isGround
            this.isPowerPath = event.isPowerPath
            this.canPlaceFence = event.canPlaceFence
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.RAIDER_AMOUNT_CHANGED, (event: RaidersAmountChangedEvent) => {
            this.hasRaider = event.hasRaider
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.isGround = false
        this.isPowerPath = false
        this.canPlaceFence = false
    }
}
