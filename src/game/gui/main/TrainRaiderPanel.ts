import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { EventBus } from '../../../event/EventBus'
import { BuildingUpgraded } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { Building } from '../../model/entity/building/Building'
import { TrainJob } from '../../model/job/TrainJob'
import { EntityDeselected } from '../../../event/LocalEvents'
import { RaiderSkills } from '../../../scene/model/Raider'

export class TrainRaiderPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(6, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDriver')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainEngineer')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainGeologist')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainPilot')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSailor')
        const trainDynamite = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDynamite')
        trainDynamite.isDisabled = () => !GameState.getBuildingsByType(Building.TOOLSTATION).some((b) => b.type.stats.trainDynamite[b.level]) ||
            GameState.selectedRaiders.every((r) => r.hasSkills([RaiderSkills.DEMOLITION]))
        trainDynamite.onClick = () => {
            GameState.getBuildingsByType(Building.TOOLSTATION).some((b) => { // TODO find closest with pathfinding for every raider
                if (b.type.stats.trainDynamite[b.level]) {
                    GameState.selectedRaiders.forEach((r) => !r.hasSkills([RaiderSkills.DEMOLITION]) && r.setJob(new TrainJob(b.getPosition(), RaiderSkills.DEMOLITION)))
                    EventBus.publishEvent(new EntityDeselected())
                    return true
                }
            })
        }
        EventBus.registerEventListener(BuildingUpgraded.eventKey, () => trainDynamite.updateState())
    }

}
