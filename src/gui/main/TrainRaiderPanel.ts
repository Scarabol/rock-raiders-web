import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { Building } from '../../game/model/building/Building'
import { GameState } from '../../game/model/GameState'
import { TrainJob } from '../../game/model/job/TrainJob'
import { RaiderSkill } from '../../game/model/raider/RaiderSkill'
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
        trainDynamite.isDisabled = () => !GameState.getBuildingsByType(Building.TOOLSTATION).some((b) => b.stats.TrainDynamite[b.level]) ||
            GameState.selectedRaiders.every((r) => r.hasSkill(RaiderSkill.DEMOLITION))
        trainDynamite.onClick = () => {
            GameState.getBuildingsByType(Building.TOOLSTATION).some((b) => {
                if (b.stats.TrainDynamite[b.level]) {
                    GameState.selectedRaiders.forEach((r) => !r.hasSkill(RaiderSkill.DEMOLITION) && r.setJob(new TrainJob(b.surfaces[0], RaiderSkill.DEMOLITION)))
                    EventBus.publishEvent(new EntityDeselected())
                    return true
                }
            })
        }
        EventBus.registerEventListener(EventKey.BUILDING_UPGRADED, () => trainDynamite.updateState())
    }

}
