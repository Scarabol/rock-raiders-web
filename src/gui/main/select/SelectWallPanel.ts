import { EventKey } from '../../../event/EventKeyEnum'
import { CancelSurfaceJobs, CreateDrillJob, CreateDynamiteJob, CreateReinforceJob } from '../../../event/GuiCommand'
import { BuildingsChangedEvent, RaidersAmountChangedEvent, RaiderTrainingCompleteEvent, SelectionChanged } from '../../../event/LocalEvents'
import { EntityType } from '../../../game/model/EntityType'
import { RAIDER_TRAINING } from '../../../game/model/raider/RaiderTraining'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectWallPanel extends IconSubPanel {
    isDrillable: boolean = false
    isReinforcable: boolean = false
    hasDemolition: boolean = false
    hasToolstation: boolean = false
    hasToolstationLevel2: boolean = false

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel, true)
        const itemDrill = this.addMenuItem(GameConfig.instance.interfaceImages.dig)
        itemDrill.isDisabled = () => !this.isDrillable
        itemDrill.onClick = () => this.publishEvent(new CreateDrillJob())
        const itemReinforce = this.addMenuItem(GameConfig.instance.interfaceImages.reinforce)
        itemReinforce.isDisabled = () => !this.isReinforcable
        itemReinforce.onClick = () => this.publishEvent(new CreateReinforceJob())
        const itemDynamite = this.addMenuItem(GameConfig.instance.interfaceImages.dynamite)
        itemDynamite.isDisabled = () => !(this.hasDemolition && this.hasToolstation) && !this.hasToolstationLevel2
        itemDynamite.onClick = () => this.publishEvent(new CreateDynamiteJob())
        const itemDeselect = this.addMenuItem(GameConfig.instance.interfaceImages.deselectDig)
        itemDeselect.isDisabled = () => false
        itemDeselect.onClick = () => this.publishEvent(new CancelSurfaceJobs())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.isDrillable = event.isDrillable
            this.isReinforcable = event.isReinforcable
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.hasToolstation = BuildingsChangedEvent.hasUsable(event, EntityType.TOOLSTATION)
            this.hasToolstationLevel2 = BuildingsChangedEvent.hasUsable(event, EntityType.TOOLSTATION, 2)
        })
        this.registerEventListener(EventKey.RAIDER_TRAINING_COMPLETE, (event: RaiderTrainingCompleteEvent) => {
            this.hasDemolition = this.hasDemolition || event.training === RAIDER_TRAINING.demolition
        })
        this.registerEventListener(EventKey.RAIDER_AMOUNT_CHANGED, (event: RaidersAmountChangedEvent) => {
            this.hasDemolition = event.hasDemolition
        })
    }

    override reset() {
        super.reset()
        this.isDrillable = false
        this.isReinforcable = false
        this.hasDemolition = false
        this.hasToolstation = false
        this.hasToolstationLevel2 = false
    }
}
