import { InfoMessagesCfg } from '../gui/infodock/InfoMessagesCfg'
import { TextInfoMessageCfg } from '../gui/messagepanel/TextInfoMessageCfg'
import { BaseConfig } from './BaseConfig'
import { BubblesCfg } from './BubblesCfg'
import { IconPanelBackButtonCfg } from './ButtonCfg'
import { ButtonsCfg } from './ButtonsCfg'
import { CfgHelper } from './CfgHelper'
import { DialogCfg } from './DialogCfg'
import { GameStatsCfg } from './GameStatsCfg'
import { LevelEntryCfg } from './LevelsCfg'
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
import { PointersCfg } from './PointersCfg'
import { TILESIZE, VERBOSE } from '../params'
import { InterfaceBuildImagesCfg, InterfaceImagesCfg } from './InterfaceImageCfg'

export type EntityDependency = { entityType: EntityType, minLevel: number, itemKey: string }
export type EntityDependencyChecked = EntityDependency & { isOk: boolean }

export class GameConfig extends BaseConfig {
    static readonly instance = new GameConfig()

    main: MainCfg = new MainCfg()
    dialog: DialogCfg = new DialogCfg()
    reward: RewardCfg = new RewardCfg()
    menu: GameMenuCfg = new GameMenuCfg()
    toolTipInfo: Record<string, string> = {}
    surfaceTypeDescriptions: Record<string, { objectName: string, sfxKey: string }> = {}
    objInfo: ObjInfoCfg = new ObjInfoCfg()
    pointers: PointersCfg = new PointersCfg()
    interfaceImages: InterfaceImagesCfg = new InterfaceImagesCfg()
    panelRotationControl: PanelRotationControlCfg = new PanelRotationControlCfg()
    panels: PanelsCfg = new PanelsCfg()
    buttons: ButtonsCfg = new ButtonsCfg()
    interfaceBackButton: IconPanelBackButtonCfg = new IconPanelBackButtonCfg()
    interfaceBuildImages: InterfaceBuildImagesCfg = new InterfaceBuildImagesCfg()
    interfaceSurroundImages: InterfaceSurroundImagesEntryCfg[] = []
    priorityImages: PriorityButtonsCfg = new PriorityButtonsCfg()
    prioritiesImagePositions: PrioritiesImagePositionsCfg = new PrioritiesImagePositionsCfg()
    miscObjects: MiscObjectsCfg = new MiscObjectsCfg()
    bubbles: BubblesCfg = new BubblesCfg()
    rockFallStyles: Record<string, RockFallStyle> = {}
    textMessagesWithImages: TextInfoMessageCfg = new TextInfoMessageCfg()
    samples: SamplesCfg = new SamplesCfg()
    textures: TexturesCfg = new TexturesCfg()
    objectNames: Record<string, string> = {}
    vehicleTypes: Record<string, string> = {}
    rockMonsterTypes: Record<string, string> = {}
    buildingTypes: Record<string, string> = {}
    upgradeTypes: Record<string, string> = {}
    infoMessages: InfoMessagesCfg = new InfoMessagesCfg()
    stats: GameStatsCfg = new GameStatsCfg()
    objTtSFXs: Record<string, string> = {}
    advisor: Record<string, AdvisorTypeCfg> = {}
    advisorPositions: Record<string, AdvisorPositionCfg> = {}
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
    dependencies: Record<string, EntityDependency[]> = {}
    levels: LevelEntryCfg[] = []
    tooltips: Record<string, string> = {}
    upgradeNames: string[] = []
    tooltipIcons: Record<string, string> = {}

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
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.toolTipInfo[cfgKey.toLowerCase()] = CfgHelper.parseLabel(value as string))
        } else if ('SurfaceTypeDescriptions'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue as Record<string, [string, string]>).forEach(([cfgKey, v]) => {
                this.surfaceTypeDescriptions[this.stripKey(cfgKey)] = {objectName: v[0], sfxKey: v[1]}
            })
        } else if ('ObjInfo'.equalsIgnoreCase(unifiedKey)) {
            this.objInfo.setFromCfgObj(cfgValue)
        } else if ('Pointers'.equalsIgnoreCase(unifiedKey)) {
            this.pointers.setFromValue(cfgValue)
        } else if ('InterfaceImages'.equalsIgnoreCase(unifiedKey)) {
            this.interfaceImages.setFromValue(cfgValue)
        } else if ('PanelRotationControl'.equalsIgnoreCase(unifiedKey)) {
            this.panelRotationControl.setFromCfgObj(cfgValue)
        } else if ('Panels640x480'.equalsIgnoreCase(unifiedKey)) {
            this.panels.setFromCfgObj(cfgValue)
        } else if ('Buttons640x480'.equalsIgnoreCase(unifiedKey)) {
            this.buttons.setFromCfgObj(cfgValue)
        } else if ('InterfaceBackButton'.equalsIgnoreCase(unifiedKey)) {
            this.interfaceBackButton.setFromValue(cfgValue)
        } else if ('InterfaceBuildImages'.equalsIgnoreCase(unifiedKey)) {
            this.interfaceBuildImages.setFromValue(cfgValue)
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
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.rockFallStyles[cfgKey.toLowerCase()] = new RockFallStyle(value))
        } else if ('TextMessagesWithImages'.equalsIgnoreCase(unifiedKey)) {
            this.textMessagesWithImages.setFromCfgObj(cfgValue)
        } else if ('Samples'.equalsIgnoreCase(unifiedKey)) {
            this.samples.setFromCfgObj(cfgValue)
        } else if ('Textures'.equalsIgnoreCase(unifiedKey)) {
            this.textures.setFromCfgObj(cfgValue)
        } else if ('ObjectNames'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.objectNames[cfgKey.toLowerCase()] = CfgHelper.parseLabel(value as string))
        } else if ('VehicleTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.vehicleTypes[cfgKey.toLowerCase()] = value as string)
        } else if ('RockMonsterTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.rockMonsterTypes[cfgKey.toLowerCase()] = value as string)
        } else if ('BuildingTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.buildingTypes[cfgKey.toLowerCase()] = value as string)
        } else if ('UpgradeTypes'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.upgradeTypes[cfgKey.toLowerCase()] = value as string)
        } else if ('InfoMessages'.equalsIgnoreCase(unifiedKey)) {
            this.infoMessages.setFromValue(cfgValue)
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
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.objTtSFXs[cfgKey.toLowerCase()] = value as string)
        } else if ('Advisor'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.advisor[cfgKey.toLowerCase()] = new AdvisorTypeCfg(value))
        } else if ('AdvisorPositions640x480'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.advisorPositions[cfgKey.toLowerCase()] = new AdvisorPositionCfg(value))
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
                this.dependencies[entityType.toLowerCase()] = (value as [string, number, string][])
                    .map((d): EntityDependency => ({entityType: getEntityTypeByName(d[0]), minLevel: d[1], itemKey: d[0]}))
            })
        } else if ('Levels'.equalsIgnoreCase(unifiedKey)) {
            Object.keys(cfgValue).forEach((levelName) => {
                if (!levelName.toLowerCase().startsWith('tutorial') && !levelName.toLowerCase().startsWith('level')) return // ignore incomplete test levels and duplicates
                const levelConf = new LevelEntryCfg(levelName).setFromCfgObj(cfgValue[levelName])
                const tileSize = levelConf.blockSize
                if (tileSize !== TILESIZE) console.warn(`Unexpected tile size in level configuration: ${tileSize}`)
                this.levels.push(levelConf)
            })
        } else if ('ToolTips'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.tooltips[cfgKey.toLowerCase()] = CfgHelper.parseLabel(value as string))
        } else if ('UpgradeNames'.equalsIgnoreCase(unifiedKey)) {
            this.upgradeNames = Object.values(cfgValue)
        } else if ('ToolTipIcons'.equalsIgnoreCase(unifiedKey)) {
            Object.entries(cfgValue).forEach(([cfgKey, value]) => this.tooltipIcons[this.stripKey(cfgKey)] = CfgHelper.parseLabel(value as string))
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
        return this.tooltips[tooltipKey.toLowerCase()] || ''
    }

    getRockFallDamage(entityType: EntityType, level: number = 0): number {
        return this.weaponTypes.rockFallIn.damageByEntityType.get(entityType)?.[level] || 0
    }

    getAllLevels(): LevelEntryCfg[] {
        return this.levels.filter((l) => l.levelName.toLowerCase().startsWith('level'))
    }
}
