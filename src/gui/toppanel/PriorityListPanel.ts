import { PanelCfg } from '../../cfg/PanelCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { ChangePriorityList } from '../../event/GuiCommand'
import { SetupPriorityList } from '../../event/LocalEvents'
import { PriorityIdentifier } from '../../game/model/job/PriorityIdentifier'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { ButtonPriorityListCfg } from './ButtonPriorityListCfg'
import { PriorityButtonsConfig } from './PriorityButtonsConfig'
import { PriorityList } from './PriorityList'
import { PriorityPositionsEntry } from './PriorityPositionsEntry'

export class PriorityListPanel extends Panel {

    prioPositions: PriorityPositionsEntry[] = []
    prioByName: Map<PriorityIdentifier, Button> = new Map()

    priorityList: PriorityList = new PriorityList()

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonPriorityListCfg, pos: PriorityPositionsEntry[], cfg: PriorityButtonsConfig) {
        super(parent, panelCfg)
        buttonsCfg.panelButtonPriorityListDisable.forEach((buttonCfg, index) => {
            this.addChild(new Button(this, buttonCfg)).onClick = () => {
                this.priorityList.toggle(index)
                this.updateList()
            }
        })
        buttonsCfg.panelButtonPriorityListUpOne.forEach((buttonCfg, index) => {
            this.addChild(new Button(this, buttonCfg)).onClick = () => {
                this.priorityList.upOne(index)
                this.updateList()
            }
        })
        this.addChild(new Button(this, buttonsCfg.panelButtonPriorityListReset)).onClick = () => {
            this.priorityList.reset()
            this.updateList()
        }

        this.prioPositions = pos
        this.prioByName.set(PriorityIdentifier.aiPriorityTrain, this.addChild(new Button(this, cfg.aiPriorityTrain)))
        this.prioByName.set(PriorityIdentifier.aiPriorityGetIn, this.addChild(new Button(this, cfg.aiPriorityGetIn)))
        this.prioByName.set(PriorityIdentifier.aiPriorityCrystal, this.addChild(new Button(this, cfg.aiPriorityCrystal)))
        this.prioByName.set(PriorityIdentifier.aiPriorityOre, this.addChild(new Button(this, cfg.aiPriorityOre)))
        this.prioByName.set(PriorityIdentifier.aiPriorityRepair, this.addChild(new Button(this, cfg.aiPriorityRepair)))
        this.prioByName.set(PriorityIdentifier.aiPriorityClearing, this.addChild(new Button(this, cfg.aiPriorityClearing)))
        this.prioByName.set(PriorityIdentifier.aiPriorityDestruction, this.addChild(new Button(this, cfg.aiPriorityDestruction)))
        this.prioByName.set(PriorityIdentifier.aiPriorityConstruction, this.addChild(new Button(this, cfg.aiPriorityConstruction)))
        this.prioByName.set(PriorityIdentifier.aiPriorityReinforce, this.addChild(new Button(this, cfg.aiPriorityReinforce)))
        this.prioByName.set(PriorityIdentifier.aiPriorityRecharge, this.addChild(new Button(this, cfg.aiPriorityRecharge)))
        this.registerEventListener(EventKey.SETUP_PRIORITY_LIST, (event: SetupPriorityList) => {
            this.priorityList.setList(event.priorityList)
            this.updateList()
        })
    }

    reset() {
        super.reset()
        this.priorityList.reset()
    }

    private updateList() {
        this.prioByName.forEach((btn) => btn.hidden = true)
        let index = 0
        let updated = false
        this.priorityList.current.forEach((cfg) => {
            const prioButton: Button = this.prioByName.get(cfg.key)
            if (prioButton) {
                updated = updated || prioButton.hidden || prioButton.disabled !== !cfg.enabled
                prioButton.hidden = index > 8
                prioButton.disabled = !cfg.enabled
                prioButton.relX = this.prioPositions[index].x
                prioButton.relY = this.prioPositions[index].y
                prioButton.updatePosition()
                const btnIndex = index
                prioButton.onClick = () => {
                    this.priorityList.pushToTop(btnIndex)
                    this.updateList()
                }
                index++
            }
        })
        if (updated) {
            this.notifyRedraw()
            this.publishEvent(new ChangePriorityList(this.priorityList.current))
        }
    }

}
