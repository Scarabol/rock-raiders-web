import { Panel } from '../base/Panel'
import { PanelCfg } from '../../../cfg/PanelsCfg'
import { Button } from '../base/Button'
import { GameState } from '../../model/GameState'
import { LevelPrioritiesEntryConfig } from '../../../cfg/LevelsCfg'
import { ButtonPriorityListCfg } from './ButtonPriorityListCfg'
import { PriorityButtonsConfig } from './PriorityButtonsConfig'
import { PriorityPositionsEntry } from './PriorityPositionsEntry'

export class PriorityListPanel extends Panel {

    prioPositions: PriorityPositionsEntry[] = []
    prioByName: Map<string, Button> = new Map()

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
        this.prioByName.set('aiPriorityTrain'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityTrain)))
        this.prioByName.set('aiPriorityGetIn'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityGetIn)))
        this.prioByName.set('aiPriorityCrystal'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityCrystal)))
        this.prioByName.set('aiPriorityOre'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityOre)))
        this.prioByName.set('aiPriorityRepair'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityRepair)))
        this.prioByName.set('aiPriorityClearing'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityClearing)))
        this.prioByName.set('aiPriorityDestruction'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityDestruction)))
        this.prioByName.set('aiPriorityConstruction'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityConstruction)))
        this.prioByName.set('aiPriorityReinforce'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityReinforce)))
        this.prioByName.set('aiPriorityRecharge'.toLowerCase(), this.addChild(new Button(this, cfg.aiPriorityRecharge)))
    }

    reset() {
        super.reset()
        this.resetList()
    }

    resetList() {
        GameState.priorityList.reset()
        this.setList(GameState.priorityList.current)
    }

    private setList(priorityList: LevelPrioritiesEntryConfig[]) {
        this.prioByName.forEach((btn) => btn.hidden = true)
        let index = 0
        let updated = false
        priorityList.forEach(cfg => {
            const prioButton: Button = this.prioByName.get(cfg.key.toLowerCase())
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

