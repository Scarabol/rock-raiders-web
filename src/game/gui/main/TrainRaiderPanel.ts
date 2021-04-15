import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { EventBus } from '../../../event/EventBus'
import { BuildingUpgraded } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { Building } from '../../model/entity/building/Building'
import { TrainJob } from '../../model/job/TrainJob'
import { EntityDeselected } from '../../../event/LocalEvents'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'

export class TrainRaiderPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(6, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDriver')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainEngineer')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainGeologist')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainPilot')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSailor')
        const trainDynamite = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDynamite')
        trainDynamite.isDisabled = () => !GameState.getBuildingsByType(Building.TOOLSTATION).some((b) => b.stats.TrainDynamite[b.level]) ||
            GameState.selectedRaiders.every((r) => r.hasSkill(RaiderSkill.DEMOLITION))
        trainDynamite.onClick = () => {
            GameState.getBuildingsByType(Building.TOOLSTATION).some((b) => {
                if (b.stats.TrainDynamite[b.level]) {
                    GameState.selectedRaiders.forEach((r) => !r.hasSkill(RaiderSkill.DEMOLITION) && r.setJob(new TrainJob(b.getPosition(), RaiderSkill.DEMOLITION)))
                    EventBus.publishEvent(new EntityDeselected())
                    return true
                }
            })
        }
        EventBus.registerEventListener(BuildingUpgraded.eventKey, () => trainDynamite.updateState())
    }

}
