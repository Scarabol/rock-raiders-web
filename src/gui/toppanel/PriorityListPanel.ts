import { ButtonPriorityListCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonsCfg, PriorityPositionsEntry } from '../../cfg/PriorityButtonsCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { PriorityIdentifier } from '../../game/model/job/PriorityIdentifier'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { UpdatePriorities } from '../../event/WorldEvents'
import { GameState } from '../../game/model/GameState'
import { PriorityEntry } from '../../game/model/job/PriorityEntry'

export class PriorityListPanel extends Panel {
    prioPositions: PriorityPositionsEntry[] = []
    prioByName: Map<PriorityIdentifier, Button> = new Map()

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonPriorityListCfg, cfgPos: PrioritiesImagePositionsCfg, cfg: PriorityButtonsCfg) {
        super(parent, panelCfg)
        buttonsCfg.panelButtonPriorityListDisable.forEach((buttonCfg, index) => {
            this.addChild(new Button(this, buttonCfg)).onClick = () => {
                GameState.priorityList.toggle(index)
            }
        })
        buttonsCfg.panelButtonPriorityListUpOne.forEach((buttonCfg, index) => {
            this.addChild(new Button(this, buttonCfg)).onClick = () => {
                GameState.priorityList.upOne(index)
            }
        })
        this.addChild(new Button(this, buttonsCfg.panelButtonPriorityListReset)).onClick = () => {
            GameState.priorityList.reset()
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
        this.registerEventListener(EventKey.UPDATE_PRIORITIES, (event: UpdatePriorities) => {
            this.updateList(event.priorityList)
        })
    }

    reset() {
        super.reset()
    }

    private updateList(priorityList: PriorityEntry[]) {
        this.prioByName.forEach((btn) => btn.hidden = true)
        let index = 0
        let updated = false
        priorityList.forEach((prioEntry) => {
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
                GameState.priorityList.pushToTop(btnIndex)
            }
            index++
        })
        if (updated) this.notifyRedraw()
    }
}
