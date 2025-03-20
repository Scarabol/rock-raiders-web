import { EventKey } from '../../event/EventKeyEnum'
import { TrainRaider } from '../../event/GuiCommand'
import { SelectionChanged } from '../../event/LocalEvents'
import { RaiderTraining } from '../../game/model/raider/RaiderTraining'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'
import { InterfaceImage } from '../../cfg/InterfaceImageCfg'

export class TrainRaiderPanel extends IconSubPanel {
    canDoTraining: Map<RaiderTraining, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(6, onBackPanel, false)
        this.addTrainingItem('trainDriver', RaiderTraining.DRIVER)
        this.addTrainingItem('trainEngineer', RaiderTraining.ENGINEER)
        this.addTrainingItem('trainGeologist', RaiderTraining.GEOLOGIST)
        this.addTrainingItem('trainPilot', RaiderTraining.PILOT)
        this.addTrainingItem('trainSailor', RaiderTraining.SAILOR)
        this.addTrainingItem('trainDynamite', RaiderTraining.DEMOLITION)
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.canDoTraining = event.canDoTraining
            this.updateAllButtonStates()
        })
    }

    private addTrainingItem(interfaceImage: InterfaceImage, training: RaiderTraining) {
        const trainingItem = this.addMenuItem(GameConfig.instance.interfaceImages[interfaceImage])
        trainingItem.isDisabled = () => !this.canDoTraining.get(training)
        trainingItem.onClick = () => this.publishEvent(new TrainRaider(training))
    }

    reset() {
        super.reset()
        this.canDoTraining = new Map()
    }
}
