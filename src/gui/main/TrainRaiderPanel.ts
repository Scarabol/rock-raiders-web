import { EventKey } from '../../event/EventKeyEnum'
import { TrainRaider } from '../../event/GuiCommand'
import { SelectionChanged } from '../../event/LocalEvents'
import { RaiderTraining } from '../../game/model/raider/RaiderTraining'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'

export class TrainRaiderPanel extends IconSubPanel {
    canDoTraining: Map<RaiderTraining, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(6, onBackPanel, false)
        this.addTrainingItem('Interface_MenuItem_TrainDriver', RaiderTraining.DRIVER)
        this.addTrainingItem('Interface_MenuItem_TrainEngineer', RaiderTraining.ENGINEER)
        this.addTrainingItem('Interface_MenuItem_TrainGeologist', RaiderTraining.GEOLOGIST)
        this.addTrainingItem('Interface_MenuItem_TrainPilot', RaiderTraining.PILOT)
        this.addTrainingItem('Interface_MenuItem_TrainSailor', RaiderTraining.SAILOR)
        this.addTrainingItem('Interface_MenuItem_TrainDynamite', RaiderTraining.DEMOLITION)
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.canDoTraining = event.canDoTraining
            this.updateAllButtonStates()
        })
    }

    private addTrainingItem(itemKey: string, training: RaiderTraining) {
        const trainingItem = this.addMenuItem(GameConfig.instance.interfaceImages, itemKey)
        trainingItem.isDisabled = () => !this.canDoTraining.get(training)
        trainingItem.onClick = () => this.publishEvent(new TrainRaider(training))
    }

    reset() {
        super.reset()
        this.canDoTraining = new Map()
    }
}
