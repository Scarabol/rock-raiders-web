import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { TrainJob } from '../../game/model/job/TrainJob'
import { RaiderTraining } from '../../game/model/raider/RaiderTraining'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class TrainRaiderPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(6, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDriver')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainEngineer')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainGeologist')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainPilot')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSailor')
        const trainDynamite = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDynamite')
        trainDynamite.isDisabled = () => !GameState.getBuildingsByType(EntityType.TOOLSTATION).some((b) => b.stats.TrainDynamite[b.level]) ||
            GameState.selectedRaiders.every((r) => r.hasTraining(RaiderTraining.DEMOLITION))
        trainDynamite.onClick = () => {
            GameState.getBuildingsByType(EntityType.TOOLSTATION).some((b) => {
                if (b.stats.TrainDynamite[b.level]) {
                    GameState.selectedRaiders.forEach((r) => !r.hasTraining(RaiderTraining.DEMOLITION) && r.setJob(new TrainJob(b.primarySurface, RaiderTraining.DEMOLITION)))
                    EventBus.publishEvent(new EntityDeselected())
                    return true
                }
            })
        }
        EventBus.registerEventListener(EventKey.BUILDING_UPGRADED, () => trainDynamite.updateState())
    }

}
