import { BaseButtonCfg } from './ButtonCfg'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class PriorityButtonListCfg implements ConfigSetFromRecord {
    aiPriorityGetIn: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityCrystal: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityOre: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityRepair: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityClearing: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityDestruction: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityConstruction: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityReinforce: PriorityButtonCfg = new PriorityButtonCfg()
    aiPriorityRecharge: PriorityButtonCfg = new PriorityButtonCfg()

    setFromRecord(cfgValue: CfgEntry): this {
        this.aiPriorityGetIn.setFromValue(cfgValue.getValue('AI_Priority_GetIn'))
        this.aiPriorityCrystal.setFromValue(cfgValue.getValue('AI_Priority_Crystal'))
        this.aiPriorityOre.setFromValue(cfgValue.getValue('AI_Priority_Ore'))
        this.aiPriorityRepair.setFromValue(cfgValue.getValue('AI_Priority_Repair'))
        this.aiPriorityClearing.setFromValue(cfgValue.getValue('AI_Priority_Clearing'))
        this.aiPriorityDestruction.setFromValue(cfgValue.getValue('AI_Priority_Destruction'))
        this.aiPriorityConstruction.setFromValue(cfgValue.getValue('AI_Priority_Construction'))
        this.aiPriorityReinforce.setFromValue(cfgValue.getValue('AI_Priority_Reinforce'))
        this.aiPriorityRecharge.setFromValue(cfgValue.getValue('AI_Priority_Recharge'))
        return this
    }
}

export class PriorityButtonCfg extends BaseButtonCfg implements ConfigSetFromEntryValue {
    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toArray(':', 4)
        const [tooltipText, tooltipSfx] = value[0].toArray('|', undefined)
        this.normalFile = value[1].toFileName()
        this.highlightFile = value[1].toFileName()
        this.pressedFile = value[2].toFileName()
        this.disabledFile = value[3].toFileName()
        this.tooltipText = tooltipText?.toLabel() || ''
        this.tooltipSfx = tooltipSfx?.toString() || ''
        return this
    }
}

export class PrioritiesImagePositionsCfg implements ConfigSetFromRecord {
    positionByIndex: PriorityPositionsEntry[] = []

    setFromRecord(cfgValue: CfgEntry): this {
        cfgValue.forEachCfgEntryValue((value) => this.positionByIndex.push(new PriorityPositionsEntry().setFromValue(value)))
        return this
    }
}

export class PriorityPositionsEntry implements ConfigSetFromEntryValue {
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const value = cfgValue.toPos(',')
        this.x = value.x
        this.y = value.y
        return this
    }
}
