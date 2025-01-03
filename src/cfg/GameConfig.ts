import { InfoMessagesCfg } from '../gui/infodock/InfoMessagesCfg'
import { TextInfoMessageCfg } from '../gui/messagepanel/TextInfoMessageCfg'
import { BaseConfig } from './BaseConfig'
import { BubblesCfg } from './BubblesCfg'
import { IconPanelBackButtonCfg, MenuItemCfg } from './ButtonCfg'
import { ButtonsCfg } from './ButtonsCfg'
import { parseLabel } from './CfgHelper'
import { DialogCfg } from './DialogCfg'
import { GameStatsCfg } from './GameStatsCfg'
import { LevelEntryCfg, LevelsCfg } from './LevelsCfg'
import { MainCfg } from './MainCfg'
import { GameMenuCfg } from './MenuCfg'
import { PanelsCfg } from './PanelCfg'
import { PanelRotationControlCfg } from './PanelRotationControlCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonsCfg } from './PriorityButtonsCfg'
import { RewardCfg } from './RewardCfg'
import { TexturesCfg } from './TexturesCfg'
import { MiscObjectsCfg } from './MiscObjectsCfg'
import { RockFallStyle } from './RockFallStyle'
import { EntityType, getEntityTypeByName } from '../game/model/EntityType'
import { ObjInfoCfg } from './ObjInfoCfg'
import { WeaponTypeCfg } from './WeaponTypeCfg'
import { SamplesCfg } from './SamplesCfg'
import { InterfaceSurroundImagesEntryCfg } from './InterfaceSurroundImagesCfg'
import { AdvisorPositionCfg, AdvisorTypeCfg } from './AdvisorCfg'
import { Cursor } from '../resource/Cursor'
import { VERBOSE } from '../params'

export type EntityDependency = { entityType: EntityType, minLevel: number, itemKey: string }
export type EntityDependencyChecked = EntityDependency & { isOk: boolean }

export class GameConfig extends BaseConfig {
    static readonly instance = new GameConfig()

    main: MainCfg = new MainCfg()
    dialog: DialogCfg = new DialogCfg()
    reward: RewardCfg = new RewardCfg()
    menu: GameMenuCfg = new GameMenuCfg()
    toolTipInfo: Map<string, string> = new Map()
    surfaceTypeDescriptions: Map<string, { objectName: string, sfxKey: string }> = new Map()
    objInfo: ObjInfoCfg = new ObjInfoCfg()
    pointers: Map<Cursor, string> = new Map()
    interfaceImages: Map<string, MenuItemCfg> = new Map()
    panelRotationControl: PanelRotationControlCfg = new PanelRotationControlCfg()
    panels: PanelsCfg = new PanelsCfg()
    buttons: ButtonsCfg = new ButtonsCfg()
    interfaceBackButton: IconPanelBackButtonCfg = new IconPanelBackButtonCfg()
    interfaceBuildImages: Map<string, MenuItemCfg> = new Map()
    interfaceSurroundImages: InterfaceSurroundImagesEntryCfg[] = []
    priorityImages: PriorityButtonsCfg = new PriorityButtonsCfg()
    prioritiesImagePositions: PrioritiesImagePositionsCfg = new PrioritiesImagePositionsCfg()
    miscObjects: MiscObjectsCfg = new MiscObjectsCfg()
    bubbles: BubblesCfg = new BubblesCfg()
    rockFallStyles: Map<string, RockFallStyle> = new Map()
    textMessagesWithImages: TextInfoMessageCfg = new TextInfoMessageCfg()
    samples: SamplesCfg = new SamplesCfg()
    textures: TexturesCfg = new TexturesCfg()
    objectNamesCfg: Map<string, string> = new Map()
    upgradeTypesCfg: Map<string, string> = new Map()
    infoMessages: InfoMessagesCfg = new InfoMessagesCfg()
    stats: GameStatsCfg = new GameStatsCfg()
    objTtSFXs: Map<string, string> = new Map()
    advisor: Map<string, AdvisorTypeCfg> = new Map()
    advisorPositions640x480: Map<string, AdvisorPositionCfg> = new Map()
    weaponTypes = new class implements Record<string, WeaponTypeCfg> {
        [x: string]: WeaponTypeCfg

        smallLazer = new WeaponTypeCfg()
        bigLazer = new WeaponTypeCfg()
        boulder = new WeaponTypeCfg()
        pusher = new WeaponTypeCfg()
        laserShot = new WeaponTypeCfg()
        freezer = new WeaponTypeCfg()
        rockFallIn = new WeaponTypeCfg()
    }
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
            Object.entries(cfgValue as Record<string, [string, string]>).forEach(([cfgKey, v]) => {
                this.surfaceTypeDescriptions.set(this.stripKey(cfgKey), {objectName: v[0], sfxKey: v[1]})
            })
        } else if ('ObjInfo'.equalsIgnoreCase(unifiedKey)) {
            this.objInfo.setFromCfgObj(cfgValue)
        } else if ('Pointers'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                const cursorFileName: string = Array.isArray(value) ? value[0] : value
                this.pointers.set(Cursor.fromString(this.stripKey(cfgKey)), cursorFileName.toLowerCase())
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
            this.interfaceBackButton.setFromValue(cfgValue)
        } else if ('InterfaceBuildImages'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.interfaceBuildImages.set(cfgKey.toLowerCase(), new MenuItemCfg(value)))
        } else if ('InterfaceSurroundImages'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([num, cfg]) => {
                const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = cfg as [string, number, number, number, number, string, number, number]
                this.interfaceSurroundImages[Number(num)] = {imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2}
            })
        } else if ('PriorityImages'.equalsIgnoreCase(unifiedKey)) {
            this.priorityImages.setFromCfgObj(cfgValue)
        } else if ('PrioritiesImagePositions'.equalsIgnoreCase(unifiedKey)) {
            this.prioritiesImagePositions.setFromCfgObj(cfgValue)
        } else if ('Bubbles'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                const bubblesKey = Object.keys(this.bubbles).find((k) => k.equalsIgnoreCase(cfgKey?.replace('_', '')))
                if (bubblesKey) {
                    this.bubbles[bubblesKey] = (value as string)?.toLowerCase()
                } else {
                    console.warn(`Unexpected key (${cfgKey}) given`)
                }
            })
        } else if ('RockFallStyles'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.rockFallStyles.set(cfgKey.toLowerCase(), new RockFallStyle(value)))
        } else if ('TextMessagesWithImages'.equalsIgnoreCase(unifiedKey)) {
            this.textMessagesWithImages.setFromCfgObj(cfgValue)
        } else if ('Samples'.equalsIgnoreCase(unifiedKey)) {
            this.samples.setFromCfgObj(cfgValue)
        } else if ('Textures'.equalsIgnoreCase(unifiedKey)) {
            this.textures.setFromCfgObj(cfgValue)
        } else if ('ObjectNames'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.objectNamesCfg.set(cfgKey.toLowerCase(), parseLabel(value as string)))
        } else if ('UpgradeTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.upgradeTypesCfg.set(cfgKey.toLowerCase(), value as string))
        } else if ('InfoMessages'.equalsIgnoreCase(unifiedKey)) {
            this.infoMessages.setFromCfgObj(cfgValue)
        } else if ('Stats'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                const statsKey = Object.keys(this.stats).find((k) => k.equalsIgnoreCase(cfgKey?.replace('-', '')))
                if (statsKey) {
                    this.stats[statsKey].setFromCfgObj(value)
                } else {
                    console.warn(`Unexpected key (${cfgKey}) given`)
                }
            })
        } else if ('ObjTtSFXs'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.objTtSFXs.set(cfgKey.toLowerCase(), value as string))
        } else if ('Advisor'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.advisor.set(cfgKey.toLowerCase(), new AdvisorTypeCfg(value)))
        } else if ('AdvisorPositions640x480'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.advisorPositions640x480.set(cfgKey.toLowerCase(), new AdvisorPositionCfg(value)))
        } else if ('WeaponTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                const weaponTypeKey = Object.keys(this.weaponTypes).find((k) => k.equalsIgnoreCase(cfgKey))
                if (weaponTypeKey) {
                    this.weaponTypes[weaponTypeKey].setFromCfgObj(value)
                } else if (VERBOSE) {
                    console.warn(`Unexpected weapon type key (${cfgKey}) given`)
                }
            })
        } else if ('Dependencies'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => {
                if (!cfgKey.toLowerCase().startsWith('AlwaysCheck:'.toLowerCase())) {
                    console.warn(`Ignoring unexpected dependency check '${cfgKey}'`)
                    return
                }
                const entityType: EntityType = getEntityTypeByName(cfgKey.split(':')[1])
                const deps: EntityDependency[] = (value as [string, number, string][])
                    .map((d): EntityDependency => ({entityType: getEntityTypeByName(d[0]), minLevel: d[1], itemKey: d[0]}))
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

    getTooltipText(tooltipKey: string | undefined): string {
        if (!tooltipKey) return ''
        return this.tooltips.get(tooltipKey.toLowerCase()) || ''
    }

    getRockFallDamage(entityType: EntityType, level: number = 0): number {
        return this.weaponTypes.rockFallIn.damageByEntityType.get(entityType)?.[level] || 0
    }

    getAllLevels(): LevelEntryCfg[] {
        return Array.from(this.levels.levelCfgByName.values()).filter((l) => l.levelName.toLowerCase().startsWith('level'))
    }
}
