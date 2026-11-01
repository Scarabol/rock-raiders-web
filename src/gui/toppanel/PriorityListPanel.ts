import { BaseButtonCfg } from '../../cfg/ButtonCfg'
import { ButtonPriorityListCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonListCfg, PriorityPositionsEntry } from '../../cfg/PriorityButtonsCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { PRIORITY_IDENTIFIER, PriorityIdentifier } from '../../game/model/job/PriorityIdentifier'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { UpdatePriorities } from '../../event/WorldEvents'
import { GameState } from '../../game/model/GameState'
import { PriorityEntry } from '../../game/model/job/PriorityEntry'
import { VERBOSE } from '../../params'
import { SpriteContext } from '../../core/Sprite'

class PriorityControlButton extends Button {
    constructor(
        buttonCfg: Partial<BaseButtonCfg>,
        private readonly precedence: number,
        private readonly order: number,
        private readonly controls: PriorityControlButton[],
    ) {
        super(buttonCfg)
    }

    override isInRect(sx: number, sy: number): boolean {
        if (!super.isInRect(sx, sy)) return false
        return !this.controls.some((control) =>
            control !== this &&
            !control.hidden &&
            !control.disabled &&
            (control.precedence < this.precedence || (control.precedence === this.precedence && control.order < this.order)) &&
            sx >= control.x &&
            sy >= control.y &&
            sx < control.x + control.width &&
            sy < control.y + control.height,
        )
    }
}

export class PriorityListPanel extends Panel {
    readonly prioPositions: PriorityPositionsEntry[] = []
    readonly prioByName: Map<PriorityIdentifier, Button> = new Map()

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonPriorityListCfg, cfgPos: PrioritiesImagePositionsCfg, cfg: PriorityButtonListCfg) {
        super(panelCfg)
        const priorityControls: PriorityControlButton[] = []
        let controlOrder = 0
        for (const [index, buttonCfg] of buttonsCfg.panelButtonPriorityListDisable.entries()) {
            const button = this.addChild(new PriorityControlButton(buttonCfg, 1, controlOrder++, priorityControls))
            priorityControls.push(button)
            button.onClick = () => {
                GameState.priorityList.toggle(index)
            }
        }
        for (const [index, buttonCfg] of buttonsCfg.panelButtonPriorityListUpOne.entries()) {
            const button = this.addChild(new PriorityControlButton(buttonCfg, 2, controlOrder++, priorityControls))
            priorityControls.push(button)
            button.onClick = () => {
                GameState.priorityList.upOne(index)
            }
        }
        const resetButton = this.addChild(new PriorityControlButton(buttonsCfg.panelButtonPriorityListReset, 0, controlOrder++, priorityControls))
        priorityControls.push(resetButton)
        resetButton.onClick = () => {
            GameState.priorityList.reset()
        }

        this.prioPositions = cfgPos.positionByIndex
        const addPriorityButton = (identifier: PriorityIdentifier, buttonCfg: Partial<BaseButtonCfg>) => {
            const button = this.addChild(new PriorityControlButton(buttonCfg, 3, controlOrder++, priorityControls))
            priorityControls.push(button)
            this.prioByName.set(identifier, button)
        }
        addPriorityButton(PRIORITY_IDENTIFIER.getIn, cfg.aiPriorityGetIn)
        addPriorityButton(PRIORITY_IDENTIFIER.crystal, cfg.aiPriorityCrystal)
        addPriorityButton(PRIORITY_IDENTIFIER.ore, cfg.aiPriorityOre)
        addPriorityButton(PRIORITY_IDENTIFIER.repair, cfg.aiPriorityRepair)
        addPriorityButton(PRIORITY_IDENTIFIER.clearing, cfg.aiPriorityClearing)
        addPriorityButton(PRIORITY_IDENTIFIER.destruction, cfg.aiPriorityDestruction)
        addPriorityButton(PRIORITY_IDENTIFIER.construction, cfg.aiPriorityConstruction)
        addPriorityButton(PRIORITY_IDENTIFIER.reinforce, cfg.aiPriorityReinforce)
        addPriorityButton(PRIORITY_IDENTIFIER.recharge, cfg.aiPriorityRecharge)
        for (const [, btn] of this.prioByName) btn.hoverFrame = true
        this.registerEventListener(EventKey.UPDATE_PRIORITIES, (event: UpdatePriorities) => {
            this.updateList(event.priorityList)
        })
    }

    private updateList(priorityList: PriorityEntry[]) {
        for (const [, btn] of this.prioByName) btn.hidden = true
        let btnIndex = 0
        let updated = false
        for (const [prioIndex, prioEntry] of priorityList.entries()) {
            const prioButton = this.prioByName.get(prioEntry.key)
            if (!prioButton) {
                if (VERBOSE) console.warn(`Could not find button for priority "${prioEntry.key}"`)
                continue
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
        }
        if (updated) this.notifyRedraw()
    }

    override isInactive(): boolean {
        return this.movedIn || super.isInactive()
    }

    override onRedraw(context: SpriteContext) {
        if (this.movedIn) return
        super.onRedraw(context)
    }
}
