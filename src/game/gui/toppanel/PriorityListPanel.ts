import { PanelCfg } from '../../../cfg/PanelsCfg'
import { GameState } from '../../model/GameState'
import { PriorityIdentifier } from '../../model/job/PriorityIdentifier'
import { PriorityEntry } from '../../model/job/PriorityList'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { ButtonPriorityListCfg } from './ButtonPriorityListCfg'
import { PriorityButtonsConfig } from './PriorityButtonsConfig'
import { PriorityPositionsEntry } from './PriorityPositionsEntry'

export class PriorityListPanel extends Panel {

    prioPositions: PriorityPositionsEntry[] = []
    prioByName: Map<PriorityIdentifier, Button> = new Map()

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonPriorityListCfg, pos: PriorityPositionsEntry[], cfg: PriorityButtonsConfig) {
        super(panelCfg)
        buttonsCfg.panelButtonPriorityListDisable.forEach((buttonCfg, index) => {
            this.addChild(new Button(this, buttonCfg)).onClick = () => {
                GameState.priorityList.toggle(index)
                this.setList(GameState.priorityList.current)
            }
        })
        buttonsCfg.panelButtonPriorityListUpOne.forEach((buttonCfg, index) => {
            this.addChild(new Button(this, buttonCfg)).onClick = () => {
                GameState.priorityList.upOne(index)
                this.setList(GameState.priorityList.current)
            }
        })
        this.addChild(new Button(this, buttonsCfg.panelButtonPriorityListReset)).onClick = () => this.resetList()

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
    }

    reset() {
        super.reset()
        this.resetList()
    }

    resetList() {
        GameState.priorityList.reset()
        this.setList(GameState.priorityList.current)
    }

    private setList(priorityList: PriorityEntry[]) {
        this.prioByName.forEach((btn) => btn.hidden = true)
        let index = 0
        let updated = false
        priorityList.forEach(cfg => {
            const prioButton: Button = this.prioByName.get(cfg.key)
            if (prioButton) {
                updated = updated || prioButton.hidden || prioButton.disabled !== !cfg.enabled
                prioButton.hidden = false
                prioButton.disabled = !cfg.enabled
                prioButton.relX = this.prioPositions[index].x
                prioButton.relY = this.prioPositions[index].y
                prioButton.updatePosition()
                const btnIndex = index
                prioButton.onClick = () => {
                    GameState.priorityList.pushToTop(btnIndex)
                    this.setList(GameState.priorityList.current)
                }
                index++
            }
        })
        if (updated) this.notifyRedraw()
    }

}

