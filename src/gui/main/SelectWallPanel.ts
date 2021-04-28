import { EventKey } from '../../event/EventKeyEnum'
import { CancelSurfaceJobs, CreateDrillJob, CreateDynamiteJob, CreateReinforceJob } from '../../event/GuiCommand'
import { BuildingsChangedEvent, SelectionChanged } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectWallPanel extends SelectBasePanel {

    isDrillable: boolean = false
    isHardDrillable: boolean = false
    isReinforcable: boolean = false
    numToolstationsLevel2: number = 0

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 4, onBackPanel)
        const itemDrill = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dig')
        itemDrill.isDisabled = () => !this.isDrillable && !this.isHardDrillable // TODO implement vehicle check for drill hard skill
        itemDrill.onClick = () => this.publishEvent(new CreateDrillJob())
        const itemReinforce = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Reinforce')
        itemReinforce.isDisabled = () => !this.isReinforcable
        itemReinforce.onClick = () => this.publishEvent(new CreateReinforceJob())
        const itemDynamite = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dynamite')
        itemDynamite.isDisabled = () => this.numToolstationsLevel2 < 1
        itemDynamite.onClick = () => this.publishEvent(new CreateDynamiteJob())
        const itemDeselect = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig')
        itemDeselect.isDisabled = () => false
        itemDeselect.onClick = () => this.publishEvent(new CancelSurfaceJobs())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.isDrillable = event.isDrillable
            this.isHardDrillable = event.isDrillableHard
            this.isReinforcable = event.isReinforcable
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.numToolstationsLevel2 = BuildingsChangedEvent.countUsable(event, EntityType.TOOLSTATION, 2)
        })
    }

    reset() {
        super.reset()
        this.isDrillable = false
        this.isHardDrillable = false
        this.isReinforcable = false
        this.numToolstationsLevel2 = 0
    }

}
