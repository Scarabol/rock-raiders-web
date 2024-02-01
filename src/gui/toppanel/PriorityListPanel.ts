import { ButtonPriorityListCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonsCfg, PriorityPositionsEntry } from '../../cfg/PriorityButtonsCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { ChangePriorityList } from '../../event/GuiCommand'
import { PriorityIdentifier } from '../../game/model/job/PriorityIdentifier'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { PriorityList } from './PriorityList'
import { SetupPriorityList } from '../../event/WorldEvents'

export class PriorityListPanel extends Panel {
    prioPositions: PriorityPositionsEntry[] = []
    prioByName: Map<PriorityIdentifier, Button> = new Map()

    priorityList: PriorityList = new PriorityList()

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonPriorityListCfg, cfgPos: PrioritiesImagePositionsCfg, cfg: PriorityButtonsCfg) {
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

        this.prioPositions = cfgPos.positionByIndex
        this.prioByName.set(PriorityIdentifier.TRAIN, this.addChild(new Button(this, cfg.aiPriorityTrain)))
        this.prioByName.set(PriorityIdentifier.GET_IN, this.addChild(new Button(this, cfg.aiPriorityGetIn)))
        this.prioByName.set(PriorityIdentifier.CRYSTAL, this.addChild(new Button(this, cfg.aiPriorityCrystal)))
        this.prioByName.set(PriorityIdentifier.ORE, this.addChild(new Button(this, cfg.aiPriorityOre)))
        this.prioByName.set(PriorityIdentifier.REPAIR, this.addChild(new Button(this, cfg.aiPriorityRepair)))
        this.prioByName.set(PriorityIdentifier.CLEARING, this.addChild(new Button(this, cfg.aiPriorityClearing)))
        this.prioByName.set(PriorityIdentifier.DESTRUCTION, this.addChild(new Button(this, cfg.aiPriorityDestruction)))
        this.prioByName.set(PriorityIdentifier.CONSTRUCTION, this.addChild(new Button(this, cfg.aiPriorityConstruction)))
        this.prioByName.set(PriorityIdentifier.REINFORCE, this.addChild(new Button(this, cfg.aiPriorityReinforce)))
        this.prioByName.set(PriorityIdentifier.RECHARGE, this.addChild(new Button(this, cfg.aiPriorityRecharge)))
        this.prioByName.forEach((btn) => btn.hoverFrame = true)
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
        this.priorityList.current.forEach((prioEntry) => {
            const prioButton: Button = this.prioByName.get(prioEntry.key)
            if (!prioButton) {
                console.error('Could not find button for priority entry', prioEntry.key)
                return
            }
            updated = updated || prioButton.hidden || prioButton.disabled !== !prioEntry.enabled
            prioButton.hidden = index > 8
            prioButton.disabled = !prioEntry.enabled
            prioButton.relX = this.prioPositions[index].x
            prioButton.relY = this.prioPositions[index].y
            prioButton.updatePosition()
            const btnIndex = index
            prioButton.onClick = () => {
                this.priorityList.pushToTop(btnIndex)
                this.updateList()
            }
            index++
        })
        if (updated) {
            this.notifyRedraw()
            this.publishEvent(new ChangePriorityList(this.priorityList.current))
        }
    }
}
