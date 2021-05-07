import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { TrainJob } from '../../game/model/job/TrainJob'
import { RaiderTraining } from '../../game/model/raider/RaiderTraining'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class TrainRaiderPanel extends IconSubPanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 6, onBackPanel)
        this.addTrainingItem('Interface_MenuItem_TrainDriver', RaiderTraining.DRIVER, EntityType.BARRACKS, 'TrainDriver')
        this.addTrainingItem('Interface_MenuItem_TrainEngineer', RaiderTraining.ENGINEER, EntityType.UPGRADE, 'TrainRepair')
        this.addTrainingItem('Interface_MenuItem_TrainGeologist', RaiderTraining.GEOLOGIST, EntityType.GEODOME, 'TrainScanner')
        this.addTrainingItem('Interface_MenuItem_TrainPilot', RaiderTraining.PILOT, EntityType.TELEPORT_PAD, 'TrainPilot')
        this.addTrainingItem('Interface_MenuItem_TrainSailor', RaiderTraining.SAILOR, EntityType.DOCKS, 'TrainSailor')
        this.addTrainingItem('Interface_MenuItem_TrainDynamite', RaiderTraining.DEMOLITION, EntityType.TOOLSTATION, 'TrainDynamite')
        EventBus.registerEventListener(EventKey.ENTITY_ADDED, () => this.updateAllItems())
        EventBus.registerEventListener(EventKey.ENTITY_REMOVED, () => this.updateAllItems())
        EventBus.registerEventListener(EventKey.BUILDING_UPGRADED, () => this.updateAllItems())
    }

    updateAllItems() {
        this.iconPanelButtons.forEach((b) => b.updateState())
    }

    private addTrainingItem(itemKey: string, training: RaiderTraining, building: EntityType, statsProperty: string) {
        const trainingItem = this.addMenuItem('InterfaceImages', itemKey)
        trainingItem.isDisabled = () => !GameState.getBuildingsByType(building).some((b) => b.stats[statsProperty][b.level]) ||
            GameState.selectedRaiders.every((r) => r.hasTraining(training))
        trainingItem.onClick = () => {
            GameState.getBuildingsByType(building).some((b) => {
                if (b.stats[statsProperty][b.level]) {
                    GameState.selectedRaiders.forEach((r) => !r.hasTraining(training) && r.setJob(new TrainJob(b, training)))
                    EventBus.publishEvent(new EntityDeselected())
                    return true
                }
            })
        }
    }

}
