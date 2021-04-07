import { Panel } from '../base/Panel'
import { PanelCfg } from '../../../cfg/PanelsCfg'
import { Button } from '../base/Button'
import { iGet } from '../../../core/Util'
import { GameState } from '../../model/GameState'
import { LevelPrioritiesEntryConfig } from '../../../cfg/LevelsCfg'
import { ButtonPriorityListCfg } from './ButtonPriorityListCfg'
import { PriorityButtonsConfig } from './PriorityButtonsConfig'
import { PriorityPositionsEntry } from './PriorityPositionsEntry'

export class PriorityListPanel extends Panel {

    prioPositions: PriorityPositionsEntry[] = []
    prioByName: {} = {}

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
        const btnReset = this.addChild(new Button(this, buttonsCfg.panelButtonPriorityListReset))
        btnReset.onClick = () => this.reset()

        this.prioPositions = pos
        this.prioByName['aiPriorityTrain'] = this.addChild(new Button(this, cfg.aiPriorityTrain))
        this.prioByName['aiPriorityGetIn'] = this.addChild(new Button(this, cfg.aiPriorityGetIn))
        this.prioByName['aiPriorityCrystal'] = this.addChild(new Button(this, cfg.aiPriorityCrystal))
        this.prioByName['aiPriorityOre'] = this.addChild(new Button(this, cfg.aiPriorityOre))
        this.prioByName['aiPriorityRepair'] = this.addChild(new Button(this, cfg.aiPriorityRepair))
        this.prioByName['aiPriorityClearing'] = this.addChild(new Button(this, cfg.aiPriorityClearing))
        this.prioByName['aiPriorityDestruction'] = this.addChild(new Button(this, cfg.aiPriorityDestruction))
        this.prioByName['aiPriorityConstruction'] = this.addChild(new Button(this, cfg.aiPriorityConstruction))
        this.prioByName['aiPriorityReinforce'] = this.addChild(new Button(this, cfg.aiPriorityReinforce))
        this.prioByName['aiPriorityRecharge'] = this.addChild(new Button(this, cfg.aiPriorityRecharge))
    }

    reset() {
        GameState.priorityList.reset()
        this.setList(GameState.priorityList.current)
    }

    private setList(priorityList: LevelPrioritiesEntryConfig[]) {
        Object.keys(this.prioByName).forEach(key => this.prioByName[key].hidden = true)
        let index = 0
        let updated = false
        priorityList.forEach(cfg => {
            const prioButton: Button = iGet(this.prioByName, cfg.key)
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

