import { ButtonPriorityListCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonListCfg, PriorityPositionsEntry } from '../../cfg/PriorityButtonsCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { PriorityIdentifier } from '../../game/model/job/PriorityIdentifier'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { UpdatePriorities } from '../../event/WorldEvents'
import { GameState } from '../../game/model/GameState'
import { PriorityEntry } from '../../game/model/job/PriorityEntry'
import { VERBOSE } from '../../params'
import { SpriteContext } from '../../core/Sprite'

export class PriorityListPanel extends Panel {
    readonly prioPositions: PriorityPositionsEntry[] = []
    readonly prioByName: Map<PriorityIdentifier, Button> = new Map()

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonPriorityListCfg, cfgPos: PrioritiesImagePositionsCfg, cfg: PriorityButtonListCfg) {
        super(panelCfg)
        buttonsCfg.panelButtonPriorityListDisable.forEach((buttonCfg, index) => {
            this.addChild(new Button(buttonCfg)).onClick = () => {
                GameState.priorityList.toggle(index)
            }
        })
        buttonsCfg.panelButtonPriorityListUpOne.forEach((buttonCfg, index) => {
            this.addChild(new Button(buttonCfg)).onClick = () => {
                GameState.priorityList.upOne(index)
            }
        })
        this.addChild(new Button(buttonsCfg.panelButtonPriorityListReset)).onClick = () => {
            GameState.priorityList.reset()
        }

        this.prioPositions = cfgPos.positionByIndex
        this.prioByName.set(PriorityIdentifier.GET_IN, this.addChild(new Button(cfg.aiPriorityGetIn)))
        this.prioByName.set(PriorityIdentifier.CRYSTAL, this.addChild(new Button(cfg.aiPriorityCrystal)))
        this.prioByName.set(PriorityIdentifier.ORE, this.addChild(new Button(cfg.aiPriorityOre)))
        this.prioByName.set(PriorityIdentifier.REPAIR, this.addChild(new Button(cfg.aiPriorityRepair)))
        this.prioByName.set(PriorityIdentifier.CLEARING, this.addChild(new Button(cfg.aiPriorityClearing)))
        this.prioByName.set(PriorityIdentifier.DESTRUCTION, this.addChild(new Button(cfg.aiPriorityDestruction)))
        this.prioByName.set(PriorityIdentifier.CONSTRUCTION, this.addChild(new Button(cfg.aiPriorityConstruction)))
        this.prioByName.set(PriorityIdentifier.REINFORCE, this.addChild(new Button(cfg.aiPriorityReinforce)))
        this.prioByName.set(PriorityIdentifier.RECHARGE, this.addChild(new Button(cfg.aiPriorityRecharge)))
        this.prioByName.forEach((btn) => btn.hoverFrame = true)
        this.registerEventListener(EventKey.UPDATE_PRIORITIES, (event: UpdatePriorities) => {
            this.updateList(event.priorityList)
        })
    }

    private updateList(priorityList: PriorityEntry[]) {
        this.prioByName.forEach((btn) => btn.hidden = true)
        let btnIndex = 0
        let updated = false
        priorityList.forEach((prioEntry, prioIndex) => {
            const prioButton = this.prioByName.get(prioEntry.key)
            if (!prioButton) {
                if (VERBOSE) console.warn(`Could not find button for priority "${PriorityIdentifier[prioEntry.key]}"`)
                return
            }
            updated = updated || prioButton.hidden || prioButton.disabled !== !prioEntry.enabled
            prioButton.hidden = false
            prioButton.disabled = !prioEntry.enabled
            prioButton.relX = this.prioPositions[btnIndex].x
            prioButton.relY = this.prioPositions[btnIndex].y
            prioButton.updatePosition()
            prioButton.onClick = (cx: number, cy: number) => {
                prioButton.hover = !!this.prioByName.get(priorityList[0].key)?.isInRect(cx, cy)
                GameState.priorityList.pushToTop(prioIndex)
            }
            btnIndex++
        })
        if (updated) this.notifyRedraw()
    }

    isInactive(): boolean {
        return this.movedIn || super.isInactive()
    }

    onRedraw(context: SpriteContext) {
        if (this.movedIn) return
        super.onRedraw(context)
    }
}
