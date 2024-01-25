import { InfoMessagesCfg } from '../gui/infodock/InfoMessagesCfg'
import { TextInfoMessageCfg } from '../gui/messagepanel/TextInfoMessageCfg'
import { BaseConfig } from './BaseConfig'
import { BubblesCfg } from './BubblesCfg'
import { IconPanelBackButtonCfg, MenuItemCfg } from './ButtonCfg'
import { ButtonsCfg } from './ButtonsCfg'
import { parseLabel } from './CfgHelper'
import { DialogCfg } from './DialogCfg'
import { GameStatsCfg } from './GameStatsCfg'
import { LevelsCfg } from './LevelsCfg'
import { MainCfg } from './MainCfg'
import { GameMenuCfg } from './MenuCfg'
import { PanelsCfg } from './PanelCfg'
import { PanelRotationControlCfg } from './PanelRotationControlCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonsCfg } from './PriorityButtonsCfg'
import { RewardCfg } from './RewardCfg'
import { TexturesCfg } from './TexturesCfg'
import { MiscObjectsCfg } from './MiscObjectsCfg'
import { RockFallStylesCfg } from './RockFallStylesCfg'
import { EntityType, getEntityTypeByName } from '../game/model/EntityType'
import { ObjInfoCfg } from './ObjInfoCfg'
import { WeaponTypeCfg } from './WeaponTypesCfg'
import { SamplesCfg } from './SamplesCfg'
import { InterfaceSurroundImagesCfg } from './InterfaceSurroundImagesCfg'
import { AdvisorPositionCfg, AdvisorTypeCfg } from './AdvisorCfg'
import { Cursor } from '../resource/Cursor'

export type EntityDependency = { entityType: EntityType, minLevel: number, itemKey: string }
export type EntityDependencyChecked = EntityDependency & { isOk: boolean }

export class GameConfig extends BaseConfig {
    static readonly instance = new GameConfig()

    main: MainCfg = new MainCfg()
    dialog: DialogCfg = new DialogCfg()
    reward: RewardCfg = new RewardCfg()
    menu: GameMenuCfg = new GameMenuCfg()
    toolTipInfo: Map<string, string> = new Map()
    surfaceTypeDescriptions: Map<string, string[]> = new Map()
    objInfo: ObjInfoCfg = new ObjInfoCfg()
    pointers: Map<Cursor, string> = new Map()
    interfaceImages: Map<string, MenuItemCfg> = new Map()
    panelRotationControl: PanelRotationControlCfg = new PanelRotationControlCfg()
    panels: PanelsCfg = new PanelsCfg()
    buttons: ButtonsCfg = new ButtonsCfg()
    interfaceBackButton: IconPanelBackButtonCfg = null
    interfaceBuildImages: Map<string, MenuItemCfg> = new Map()
    interfaceSurroundImages: InterfaceSurroundImagesCfg = null
    priorityImages: PriorityButtonsCfg = new PriorityButtonsCfg()
    prioritiesImagePositions: PrioritiesImagePositionsCfg = new PrioritiesImagePositionsCfg()
    miscObjects: MiscObjectsCfg = new MiscObjectsCfg()
    bubbles: BubblesCfg = new BubblesCfg()
    rockFallStyles: RockFallStylesCfg = new RockFallStylesCfg()
    textMessagesWithImages: TextInfoMessageCfg = new TextInfoMessageCfg()
    samples: SamplesCfg = new SamplesCfg()
    textures: TexturesCfg = new TexturesCfg()
    objectNamesCfg: Map<string, string> = new Map()
    // vehicleTypes: VehicleTypesCfg = new VehicleTypesCfg()
    // rockMonsterTypes: RockMonsterTypesCfg = new RockMonsterTypesCfg()
    // buildingTypes: BuildingTypesCfg = new BuildingTypesCfg()
    upgradeTypesCfg: Map<string, string> = new Map()
    infoMessages: InfoMessagesCfg = new InfoMessagesCfg()
    stats: GameStatsCfg = new GameStatsCfg()
    advisor: Map<string, AdvisorTypeCfg> = new Map()
    advisorPositions640x480: Map<string, AdvisorPositionCfg> = new Map()
    weaponTypes: Map<string, WeaponTypeCfg> = new Map()
    dependencies: Map<EntityType, EntityDependency[]> = new Map()
    levels: LevelsCfg = new LevelsCfg()
    tooltips: Map<string, string> = new Map()
    upgradeNames: string[] = []
    tooltipIcons: Map<string, string> = new Map()

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if ('Main'.equalsIgnoreCase(unifiedKey)) {
            this.main.setFromCfgObj(cfgValue)
        } else if ('Dialog'.equalsIgnoreCase(unifiedKey)) {
            this.dialog.setFromCfgObj(cfgValue)
        } else if ('Reward'.equalsIgnoreCase(unifiedKey)) {
            this.reward.setFromCfgObj(cfgValue)
        } else if ('Menu'.equalsIgnoreCase(unifiedKey)) {
            this.menu.setFromCfgObj(cfgValue)
        } else if ('ToolTipInfo'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.toolTipInfo.set(cfgKey.toLowerCase(), parseLabel(value as string)))
        } else if ('SurfaceTypeDescriptions'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.surfaceTypeDescriptions.set(this.stripKey(cfgKey), value as string[]))
        } else if ('ObjInfo'.equalsIgnoreCase(unifiedKey)) {
            this.objInfo.setFromCfgObj(cfgValue)
        } else if ('Pointers'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                const cursorFileName: string = Array.isArray(value) ? value[0] : value
                this.pointers.set(this.stripKey(cfgKey) as Cursor, cursorFileName)
            })
        } else if ('InterfaceImages'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.interfaceImages.set(cfgKey.toLowerCase(), new MenuItemCfg(value)))
        } else if ('PanelRotationControl'.equalsIgnoreCase(unifiedKey)) {
            this.panelRotationControl.setFromCfgObj(cfgValue)
        } else if ('Panels640x480'.equalsIgnoreCase(unifiedKey)) {
            this.panels.setFromCfgObj(cfgValue)
        } else if ('Buttons640x480'.equalsIgnoreCase(unifiedKey)) {
            this.buttons.setFromCfgObj(cfgValue)
        } else if ('InterfaceBackButton'.equalsIgnoreCase(unifiedKey)) {
            this.interfaceBackButton = new IconPanelBackButtonCfg(cfgValue)
        } else if ('InterfaceBuildImages'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.interfaceBuildImages.set(cfgKey.toLowerCase(), new MenuItemCfg(value)))
        } else if ('InterfaceSurroundImages'.equalsIgnoreCase(unifiedKey)) {
            this.interfaceSurroundImages = new InterfaceSurroundImagesCfg(cfgValue)
        } else if ('PriorityImages'.equalsIgnoreCase(unifiedKey)) {
            this.priorityImages.setFromCfgObj(cfgValue)
        } else if ('PrioritiesImagePositions'.equalsIgnoreCase(unifiedKey)) {
            this.prioritiesImagePositions.setFromCfgObj(cfgValue)
            // } else if ('MiscObjects'.equalsIgnoreCase(unifiedKey)) {
            //     this.miscObjects.setFromCfgObj(cfgValue)
        } else if ('Bubbles'.equalsIgnoreCase(unifiedKey)) {
            this.bubbles.setFromCfgObj(cfgValue)
        } else if ('RockFallStyles'.equalsIgnoreCase(unifiedKey)) {
            this.rockFallStyles.setFromCfgObj(cfgValue)
        } else if ('TextMessagesWithImages'.equalsIgnoreCase(unifiedKey)) {
            this.textMessagesWithImages.setFromCfgObj(cfgValue)
        } else if ('Samples'.equalsIgnoreCase(unifiedKey)) {
            this.samples.setFromCfgObj(cfgValue)
        } else if ('Textures'.equalsIgnoreCase(unifiedKey)) {
            this.textures.setFromCfgObj(cfgValue)
        } else if ('ObjectNames'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.objectNamesCfg.set(this.unifyKey(cfgKey), parseLabel(value as string)))
            // } else if ('VehicleTypes'.equalsIgnoreCase(unifiedKey)) {
            //     this.vehicleTypes.setFromCfgObj(cfgValue)
            // } else if ('RockMonsterTypes'.equalsIgnoreCase(unifiedKey)) {
            //     this.rockMonsterTypes.setFromCfgObj(cfgValue)
            // } else if ('BuildingTypes'.equalsIgnoreCase(unifiedKey)) {
            //     this.buildingTypes.setFromCfgObj(cfgValue)
        } else if ('UpgradeTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.upgradeTypesCfg.set(cfgKey.toLowerCase(), value as string))
        } else if ('InfoMessages'.equalsIgnoreCase(unifiedKey)) {
            this.infoMessages.setFromCfgObj(cfgValue)
        } else if ('Stats'.equalsIgnoreCase(unifiedKey)) {
            this.stats.setFromCfgObj(cfgValue)
        } else if ('Advisor'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.advisor.set(cfgKey.toLowerCase(), new AdvisorTypeCfg(value)))
        } else if ('AdvisorPositions640x480'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.advisorPositions640x480.set(cfgKey.toLowerCase(), new AdvisorPositionCfg(value)))
        } else if ('WeaponTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.weaponTypes.set(cfgKey.toLowerCase(), new WeaponTypeCfg().setFromCfgObj(value)))
        } else if ('Dependencies'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                if (!cfgKey.toLowerCase().startsWith('AlwaysCheck:'.toLowerCase())) {
                    console.warn(`Ignoring unexpected dependency check '${cfgKey}'`)
                    return
                }
                const entityType: EntityType = getEntityTypeByName(cfgKey.split(':')[1])
                const deps: EntityDependency[] = (value as unknown[])
                    .map((d): EntityDependency => ({entityType: getEntityTypeByName(d[0]), minLevel: d[1] as number, itemKey: d[0]}))
                this.dependencies.set(entityType, deps)
            })
        } else if ('Levels'.equalsIgnoreCase(unifiedKey)) {
            this.levels.setFromCfgObj(cfgValue)
        } else if ('ToolTips'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.tooltips.set(cfgKey.toLowerCase(), parseLabel(value as string)))
        } else if ('UpgradeNames'.equalsIgnoreCase(unifiedKey)) {
            this.upgradeNames = Object.values(cfgValue)
        } else if ('ToolTipIcons'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.tooltipIcons.set(this.stripKey(cfgKey), parseLabel(value as string)))
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
        return true
    }

    stripKey(cfgKey: string) {
        const keyParts = cfgKey.split('_')
        if (keyParts.length > 1) {
            keyParts.shift()
            return keyParts.flatMap((s) => s.split(/(?<!^)(?=[A-Z])/)) // split with camel case
                .filter((s) => s.toLowerCase().hashCode() !== 3317793)
                .join('').toLowerCase()
        } else {
            return cfgKey.toLowerCase()
        }
    }

    getTooltipText(tooltipKey: string): string {
        if (!tooltipKey) return ''
        return this.tooltips.get(tooltipKey.toLowerCase())
    }

    getRockFallDamage(entityType: EntityType, level: number = 0): number {
        return this.weaponTypes.get('rockfallin').damageByEntityType.get(entityType)?.[level] || 0
    }
}
