import { InfoMessagesCfg } from './InfoMessagesCfg'
import { TextInfoMessageCfg } from './TextInfoMessageCfg'
import { BubblesCfg } from './BubblesCfg'
import { IconPanelBackButtonCfg } from './ButtonCfg'
import { ButtonsCfg } from './ButtonsCfg'
import { DialogCfg } from './DialogCfg'
import { GameStatsCfg } from './GameStatsCfg'
import { LevelEntryCfg } from './LevelsCfg'
import { MainCfg } from './MainCfg'
import { GameMenuCfg } from './MenuCfg'
import { PanelsCfg } from './PanelCfg'
import { PanelRotationControlCfg } from './PanelRotationControlCfg'
import { PrioritiesImagePositionsCfg, PriorityButtonListCfg } from './PriorityButtonsCfg'
import { RewardCfg } from './RewardCfg'
import { TexturesCfg } from './TexturesCfg'
import { MiscObjectsCfg } from './MiscObjectsCfg'
import { RockFallStyle } from './RockFallStyle'
import { EntityType, getEntityTypeByName } from '../game/model/EntityType'
import { ObjInfoCfg } from './ObjInfoCfg'
import { WeaponTypeListCfg } from './WeaponTypeCfg'
import { SamplesCfg } from './SamplesCfg'
import { InterfaceSurroundImagesEntryCfg } from './InterfaceSurroundImagesCfg'
import { AdvisorPositionCfg, AdvisorTypeCfg } from './AdvisorCfg'
import { PointersCfg } from './PointersCfg'
import { TILESIZE } from '../params'
import { InterfaceBuildImagesCfg, InterfaceImagesCfg } from './InterfaceImageCfg'
import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export type EntityDependency = { entityType: EntityType, minLevel: number, itemKey: string }
export type EntityDependencyChecked = EntityDependency & { isOk: boolean }

export class GameConfig implements ConfigSetFromRecord {
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
    priorityImages: PriorityButtonListCfg = new PriorityButtonListCfg()
    prioritiesImagePositions: PrioritiesImagePositionsCfg = new PrioritiesImagePositionsCfg()
    miscObjects: MiscObjectsCfg = new MiscObjectsCfg()
    bubbles: BubblesCfg = new BubblesCfg()
    rockFallStyles: Record<string, RockFallStyle> = {}
    textMessagesWithImages: TextInfoMessageCfg = new TextInfoMessageCfg()
    samples: SamplesCfg = new SamplesCfg()
    textures: TexturesCfg = new TexturesCfg()
    objectNames: Record<string, string> = {}
    vehicleTypes: Record<string, string[]> = {}
    rockMonsterTypes: Record<string, string> = {}
    buildingTypes: Record<string, string> = {}
    upgradeTypes: Record<string, string> = {}
    infoMessages: InfoMessagesCfg = new InfoMessagesCfg()
    stats: GameStatsCfg = new GameStatsCfg()
    objTtSFXs: Record<string, string> = {}
    advisor: Record<string, AdvisorTypeCfg> = {}
    advisorPositions: Record<string, AdvisorPositionCfg> = {}
    weaponTypes: WeaponTypeListCfg = new WeaponTypeListCfg()
    dependencies: Record<string, EntityDependency[]> = {}
    levels: LevelEntryCfg[] = []
    tooltips: Record<string, string> = {}
    upgradeNames: string[] = []
    tooltipIcons: Record<string, string> = {}

    setFromRecord(cfgValue: CfgEntry): this {
        this.main.setFromRecord(cfgValue.getRecord('Main'))
        this.dialog.setFromRecord(cfgValue.getRecord('Dialog'))
        this.reward.setFromRecord(cfgValue.getRecord('Reward'))
        this.menu.setFromRecord(cfgValue.getRecord('Menu'))
        cfgValue.getRecord('ToolTipInfo').forEachCfgEntryValue((value, cfgKey) => this.toolTipInfo[cfgKey.toLowerCase()] = value.toLabel())
        cfgValue.getRecord('SurfaceTypeDescriptions').forEachCfgEntryValue((value, cfgKey) => {
            const array = value.toArray(',', 2)
            this.surfaceTypeDescriptions[this.stripSurfaceTypeKey(cfgKey)] = {objectName: array[0].toLabel(), sfxKey: array[1].toString()}
        })
        this.objInfo.setFromRecord(cfgValue.getRecord('ObjInfo'))
        this.pointers.setFromRecord(cfgValue.getRecord('Pointers'))
        this.interfaceImages.setFromRecord(cfgValue.getRecord('InterfaceImages'))
        this.panelRotationControl.setFromRecord(cfgValue.getRecord('PanelRotationControl'))
        this.panels.setFromRecord(cfgValue.getRecord('Panels640x480'))
        this.buttons.setFromRecord(cfgValue.getRecord('Buttons640x480'))
        this.interfaceBackButton.setFromValue(cfgValue.getValue('InterfaceBackButton'))
        this.interfaceBuildImages.setFromRecord(cfgValue.getRecord('InterfaceBuildImages'))
        cfgValue.getRecord('InterfaceSurroundImages').forEachCfgEntryValue((cfg, numStr) => {
            const num = Number(numStr)
            if (isNaN(num)) {
                console.warn(`Unexpected InterfaceSurroundImages key (${numStr}) given; expected number`)
                return
            }
            this.interfaceSurroundImages[num] = new InterfaceSurroundImagesEntryCfg().setFromValue(cfg)
        })
        this.priorityImages.setFromRecord(cfgValue.getRecord('PriorityImages'))
        this.prioritiesImagePositions.setFromRecord(cfgValue.getRecord('PrioritiesImagePositions'))
        this.miscObjects.setFromRecord(cfgValue.getRecord('MiscObjects'))
        cfgValue.getRecord('Bubbles').forEachCfgEntryValue((value, cfgKey) => {
            const bubblesKey = Object.keys(this.bubbles).find((k) => k.equalsIgnoreCase(cfgKey?.replace('_', '')))
            if (bubblesKey) {
                this.bubbles[bubblesKey] = value.toFileName().toLowerCase()
            } else {
                console.warn(`Unexpected key (${cfgKey}) given`)
            }
        })
        cfgValue.getRecord('RockFallStyles').forEachCfgEntryValue((value, cfgKey) => this.rockFallStyles[cfgKey.toLowerCase()] = new RockFallStyle().setFromValue(value))
        this.textMessagesWithImages.setFromRecord(cfgValue.getRecord('TextMessagesWithImages'))
        this.samples.setFromRecord(cfgValue.getRecord('Samples'))
        this.textures.setFromRecord(cfgValue.getRecord('Textures'))
        cfgValue.getRecord('ObjectNames').forEachCfgEntryValue((value, cfgKey) => this.objectNames[cfgKey.toLowerCase()] = value.toLabel())
        cfgValue.getRecord('VehicleTypes').forEachCfgEntryValue((value, cfgKey) => this.vehicleTypes[cfgKey.toLowerCase()] = value.toArray(',', undefined).map((v) => v.toFileName()))
        cfgValue.getRecord('RockMonsterTypes').forEachCfgEntryValue((value, cfgKey) => this.rockMonsterTypes[cfgKey.toLowerCase()] = value.toFileName())
        cfgValue.getRecord('BuildingTypes').forEachCfgEntryValue((value, cfgKey) => this.buildingTypes[cfgKey.toLowerCase()] = value.toFileName())
        cfgValue.getRecord('UpgradeTypes').forEachCfgEntryValue((value, cfgKey) => this.upgradeTypes[cfgKey.toLowerCase()] = value.toFileName())
        this.infoMessages.setFromRecord(cfgValue.getRecord('InfoMessages'))
        this.stats.setFromRecord(cfgValue.getRecord('Stats'))
        cfgValue.getRecord('ObjTtSFXs').forEachCfgEntryValue((value, cfgKey) => this.objTtSFXs[cfgKey.toLowerCase()] = value.toString())
        cfgValue.getRecord('Advisor').forEachCfgEntryValue((value, cfgKey) => this.advisor[cfgKey.toLowerCase()] = new AdvisorTypeCfg().setFromValue(value))
        cfgValue.getRecord('AdvisorPositions640x480').forEachCfgEntryValue((value, cfgKey) => this.advisorPositions[cfgKey.toLowerCase()] = new AdvisorPositionCfg().setFromValue(value))
        this.weaponTypes.setFromRecord(cfgValue.getRecord('WeaponTypes'))
        cfgValue.getRecord('Dependencies').forEachCfgEntryValue((value, cfgKey) => {
            if (cfgKey.toLowerCase().startsWith('AlwaysCheck:'.toLowerCase())) {
                const entityTypeStr = cfgKey.split(':')[1]
                const entityType = getEntityTypeByName(entityTypeStr)
                if (!entityType) {
                    console.warn(`Skipping unmatched entity type "${entityTypeStr}" given`)
                    return
                }
                this.dependencies[entityType.toLowerCase()] = value.toArray(',', undefined).map((dependency): EntityDependency => {
                    const depEntry = dependency.toArray(':', 2)
                    const entityTypeStr = depEntry[0].toString()
                    return {
                        entityType: getEntityTypeByName(entityTypeStr),
                        minLevel: depEntry[1].toNumber(),
                        itemKey: entityTypeStr
                    }
                })
            } else {
                console.warn(`Ignoring unexpected dependency check '${cfgKey}'`)
            }
        })
        cfgValue.getRecord('Levels').forEachEntry((levelName, entry) => {
            if (!LevelEntryCfg.isTutorial(levelName) && !LevelEntryCfg.isLevel(levelName)) return // ignore incomplete test levels and duplicates
            const levelConf = new LevelEntryCfg(levelName).setFromRecord(entry)
            const tileSize = levelConf.blockSize
            if (tileSize !== TILESIZE) console.warn(`Unexpected tile size in level configuration: ${tileSize}`)
            this.levels.push(levelConf)
        })
        cfgValue.getRecord('ToolTips').forEachCfgEntryValue((value, cfgKey) => this.tooltips[cfgKey.toLowerCase()] = value.toLabel())
        cfgValue.getRecord('UpgradeNames').forEachCfgEntryValue((value) => ((v) => {
            this.upgradeNames.push(v.toLabel())
        })(value))
        cfgValue.getRecord('TooltipIcons').forEachCfgEntryValue((value, cfgKey) => {
            const tooltipKey = this.stripTooltipKey(cfgKey)
            this.tooltipIcons[tooltipKey] = value.toFileName()
        })
        return this
    }

    private stripSurfaceTypeKey(cfgKey: string) {
        const surfaceTypeVal = cfgKey.toLowerCase().replaceAll(/[_-]/g, '')
        const index = surfaceTypeVal.indexOf('surfacetype')
        return surfaceTypeVal.substring(index < 0 ? 0 : index)
    }

    private stripTooltipKey(cfgKey: string) {
        const keyVal = cfgKey.toLowerCase().replaceAll(/[_-]/g, '')
        let index: number = 0
        const toolTypeIndex = keyVal.indexOf('tooltype')
        if (toolTypeIndex >= 0) {
            index = toolTypeIndex
        } else {
            const abilityTypeIndex = keyVal.indexOf('abilitytype')
            if (abilityTypeIndex >= 0) {
                index = abilityTypeIndex
            }
        }
        return keyVal.substring(index)
    }

    getTooltipText(tooltipKey: string | undefined): string {
        if (!tooltipKey) return ''
        return this.tooltips[tooltipKey.toLowerCase()] || ''
    }

    getRockFallDamage(entityType: EntityType, level: number = 0): number {
        return this.weaponTypes.rockFallIn.damageByEntityType[entityType]?.[level] || 0
    }
}
