import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { EventBus } from '../../../event/EventBus'
import { BuildingUpgraded } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { Building } from '../../model/entity/building/Building'

export class TrainRaiderPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(7, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSkill')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDriver')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainEngineer')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainGeologist')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainPilot')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSailor')
        const trainDynamite = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainDynamite')
        trainDynamite.isDisabled = () => !GameState.hasBuildingWithUpgrades(Building.TOOLSTATION, 2) // TODO better check all buildings for TrainDynamite stat
        trainDynamite.onClick = () => {
            console.log('FIXME implement train raider as (personal) jobs')
        }
        EventBus.registerEventListener(BuildingUpgraded.eventKey, () => trainDynamite.updateState())
    }

}
