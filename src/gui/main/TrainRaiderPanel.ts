import { EventKey } from '../../event/EventKeyEnum'
import { TrainRaider } from '../../event/GuiCommand'
import { SelectionChanged } from '../../event/LocalEvents'
import { RAIDER_TRAINING, RaiderTraining } from '../../game/model/raider/RaiderTraining'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'
import { InterfaceImage } from '../../cfg/InterfaceImageCfg'

export class TrainRaiderPanel extends IconSubPanel {
    canDoTraining: Map<RaiderTraining, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(6, onBackPanel, false)
        this.addTrainingItem('trainDriver', RAIDER_TRAINING.driver)
        this.addTrainingItem('trainEngineer', RAIDER_TRAINING.engineer)
        this.addTrainingItem('trainGeologist', RAIDER_TRAINING.geologist)
        this.addTrainingItem('trainPilot', RAIDER_TRAINING.pilot)
        this.addTrainingItem('trainSailor', RAIDER_TRAINING.sailor)
        this.addTrainingItem('trainDynamite', RAIDER_TRAINING.demolition)
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

    override reset() {
        super.reset()
        this.canDoTraining = new Map()
    }
}
