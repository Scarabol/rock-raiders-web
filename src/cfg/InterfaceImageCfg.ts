import { BaseButtonCfg } from './ButtonCfg'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class InterfaceImageEntryCfg extends BaseButtonCfg implements ConfigSetFromEntryValue {
    tooltipDisabled: string = ''
    tooltipDisabledSfx: string = ''
    hotkey: string = ''

    constructor(buttonType: string) {
        super()
        this.buttonType = buttonType
        this.width = 40
        this.height = 40
    }

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(':', undefined)
        let hotkeyName: string | undefined
        if (array.length === 4) {
            this.normalFile = array[0].toFileName()
            this.disabledFile = array[1].toFileName()
            this.pressedFile = array[2].toFileName()
            hotkeyName = array[3].toString()
        } else if (array.length === 6 || array.length === 7) { // XXX 7th element is boolean, but usage unknown
            this.normalFile = array[0].toFileName()
            this.disabledFile = array[1].toFileName()
            this.pressedFile = array[2].toFileName()
            const tooltip = array[3].toArray('|', undefined)
            const tooltipDisabled = array[4].toArray('|', undefined)
            hotkeyName = array[5].toString()
            this.tooltipText = tooltip[0]?.toLabel() || ''
            this.tooltipSfx = tooltip[1]?.toString() || ''
            this.tooltipDisabled = tooltipDisabled[0]?.toLabel() || ''
            this.tooltipDisabledSfx = tooltipDisabled[1]?.toString() || ''
        } else {
            console.error(`Unexpected menu item cfg value length: ${array.length}`)
        }
        this.hotkey = this.keyNameToKey(hotkeyName)
        return this
    }

    private keyNameToKey(hotkeyName?: string): string {
        if ('KEY_ONE'.equalsIgnoreCase(hotkeyName)) {
            return '1'
        } else if ('KEY_TWO'.equalsIgnoreCase(hotkeyName)) {
            return '2'
        } else if ('KEY_THREE'.equalsIgnoreCase(hotkeyName)) {
            return '3'
        } else if ('KEY_FOUR'.equalsIgnoreCase(hotkeyName)) {
            return '4'
        } else if ('KEY_FIVE'.equalsIgnoreCase(hotkeyName)) {
            return '5'
        } else if ('KEY_SIX'.equalsIgnoreCase(hotkeyName)) {
            return '6'
        } else if ('KEY_SEVEN'.equalsIgnoreCase(hotkeyName)) {
            return '7'
        } else if ('KEY_EIGHT'.equalsIgnoreCase(hotkeyName)) {
            return '8'
        } else if ('KEY_NINE'.equalsIgnoreCase(hotkeyName)) {
            return '9'
        } else if ('KEY_ZERO'.equalsIgnoreCase(hotkeyName)) {
            return '0'
        } else if ('KEY_MINUS'.equalsIgnoreCase(hotkeyName)) {
            return '-'
        } else if ('KEY_EQUALS'.equalsIgnoreCase(hotkeyName)) {
            return '='
        } else {
            const hotkeyMatch = hotkeyName?.match(/^KEY_([A-Z])$/i)
            if (hotkeyMatch) {
                return hotkeyMatch[1].toLowerCase()
            } else if (hotkeyName) {
                console.warn(`Given hotkey '${hotkeyName}' does not match with pattern`)
            }
        }
        return ''
    }
}

type ExcludeFunctionPropertyNames<T> = Pick<T, {
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]>;

export type InterfaceImage = keyof ExcludeFunctionPropertyNames<InterfaceImagesCfg>

export class InterfaceImagesCfg implements ConfigSetFromRecord {
    backToDefault: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('backToDefault')
    teleportMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('teleportMan')
    buildBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('buildBuilding')
    buildSmallVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('buildSmallVehicle')
    buildLargeVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('buildLargeVehicle')
    layPath: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('layPath')
    repairLava: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('repairLava')
    geologistTest: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('geologistTest')
    clearRubble: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('clearRubble')
    dam: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('dam')
    selectMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('selectMan')
    deleteMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('deleteMan')
    attack: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('attack')
    selectVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('selectVehicle')
    unLoadVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('unLoadVehicle')
    unLoadMiniFigure: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('unLoadMiniFigure')
    miniFigurePickUp: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('miniFigurePickUp')
    vehiclePickUp: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('vehiclePickUp')
    getOut: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getOut')
    gotoDock: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('gotoDock')
    getIn: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getIn')
    dig: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('dig')
    reinforce: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('reinforce')
    dynamite: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('dynamite')
    upgradeMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeMan')
    goFeed: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('goFeed')
    gotoFirstPerson: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('gotoFirstPerson')
    gotoSecondPerson: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('gotoSecondPerson')
    trackObject: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trackObject')
    powerOn: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('powerOn')
    powerOff: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('powerOff')
    upgradeBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeBuilding')
    repair: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('repair')
    selectBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('selectBuilding')
    gotoTopView: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('gotoTopView')
    makeTeleporterPrimary: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('makeTeleporterPrimary')
    deselectDig: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('deselectDig')
    placeFence: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('placeFence')
    encyclopedia: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('encyclopedia')
    removePath: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('removePath')
    deleteElectricFence: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('deleteElectricFence')
    deleteVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('deleteVehicle')
    deleteBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('deleteBuilding')
    dropBirdScarer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('dropBirdScarer')
    getTool: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getTool')
    getDrill: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getDrill')
    getSpade: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getSpade')
    getHammer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getHammer')
    getSpanner: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getSpanner')
    getFreezerGun: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getFreezerGun')
    getLaser: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getLaser')
    getPusherGun: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getPusherGun')
    getBirdScarer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('getBirdScarer')
    trainSkill: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainSkill')
    trainDriver: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainDriver')
    trainEngineer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainEngineer')
    trainGeologist: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainGeologist')
    trainPilot: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainPilot')
    trainSailor: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainSailor')
    trainDynamite: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('trainDynamite')
    ejectCrystal: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('ejectCrystal')
    ejectOre: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('ejectOre')
    upgradeVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeVehicle')
    upgradeEngine: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeEngine')
    upgradeDrill: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeDrill')
    upgradeScan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeScan')
    upgradeCarry: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgradeCarry')
    cancelConstruction: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('cancelConstruction')

    setFromRecord(cfgValue: CfgEntry): this {
        this.backToDefault.setFromValue(cfgValue.getValue('Interface_MenuItem_BackToDefault'))
        this.teleportMan.setFromValue(cfgValue.getValue('Interface_MenuItem_TeleportMan'))
        this.buildBuilding.setFromValue(cfgValue.getValue('Interface_MenuItem_BuildBuilding'))
        this.buildSmallVehicle.setFromValue(cfgValue.getValue('Interface_MenuItem_BuildSmallVehicle'))
        this.buildLargeVehicle.setFromValue(cfgValue.getValue('Interface_MenuItem_BuildLargeVehicle'))
        this.layPath.setFromValue(cfgValue.getValue('Interface_MenuItem_LayPath'))
        this.repairLava.setFromValue(cfgValue.getValue('Interface_MenuItem_RepairLava'))
        this.geologistTest.setFromValue(cfgValue.getValue('Interface_MenuItem_GeologistTest'))
        this.clearRubble.setFromValue(cfgValue.getValue('Interface_MenuItem_ClearRubble'))
        this.dam.setFromValue(cfgValue.getValue('Interface_MenuItem_Dam'))
        this.selectMan.setFromValue(cfgValue.getValue('Interface_MenuItem_SelectMan'))
        this.deleteMan.setFromValue(cfgValue.getValue('Interface_MenuItem_DeleteMan'))
        this.attack.setFromValue(cfgValue.getValue('Interface_MenuItem_Attack'))
        this.selectVehicle.setFromValue(cfgValue.getValue('Interface_MenuItem_SelectVehicle'))
        this.unLoadVehicle.setFromValue(cfgValue.getValue('Interface_MenuItem_UnLoadVehicle'))
        this.unLoadMiniFigure.setFromValue(cfgValue.getValue('Interface_MenuItem_UnLoadMinifigure'))
        this.miniFigurePickUp.setFromValue(cfgValue.getValue('Interface_MenuItem_MinifigurePickUp'))
        this.vehiclePickUp.setFromValue(cfgValue.getValue('Interface_MenuItem_VehiclePickUp'))
        this.getOut.setFromValue(cfgValue.getValue('Interface_MenuItem_GetOut'))
        this.gotoDock.setFromValue(cfgValue.getValue('Interface_MenuItem_GotoDock'))
        this.getIn.setFromValue(cfgValue.getValue('Interface_MenuItem_GetIn'))
        this.dig.setFromValue(cfgValue.getValue('Interface_MenuItem_Dig'))
        this.reinforce.setFromValue(cfgValue.getValue('Interface_MenuItem_Reinforce'))
        this.dynamite.setFromValue(cfgValue.getValue('Interface_MenuItem_Dynamite'))
        this.upgradeMan.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgradeMan'))
        this.goFeed.setFromValue(cfgValue.getValue('Interface_MenuItem_GoFeed'))
        this.gotoFirstPerson.setFromValue(cfgValue.getValue('Interface_MenuItem_GotoFirstPerson'))
        this.gotoSecondPerson.setFromValue(cfgValue.getValue('Interface_MenuItem_GotoSecondPerson'))
        this.trackObject.setFromValue(cfgValue.getValue('Interface_MenuItem_TrackObject'))
        this.powerOn.setFromValue(cfgValue.getValue('Interface_MenuItem_PowerOn'))
        this.powerOff.setFromValue(cfgValue.getValue('Interface_MenuItem_PowerOff'))
        this.upgradeBuilding.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgradeBuilding'))
        this.repair.setFromValue(cfgValue.getValue('Interface_MenuItem_Repair'))
        this.selectBuilding.setFromValue(cfgValue.getValue('Interface_MenuItem_SelectBuilding'))
        this.gotoTopView.setFromValue(cfgValue.getValue('Interface_MenuItem_GotoTopView'))
        this.makeTeleporterPrimary.setFromValue(cfgValue.getValue('Interface_MenuItem_MakeTeleporterPrimary'))
        this.deselectDig.setFromValue(cfgValue.getValue('Interface_MenuItem_DeselectDig'))
        this.placeFence.setFromValue(cfgValue.getValue('Interface_MenuItem_PlaceFence'))
        this.encyclopedia.setFromValue(cfgValue.getValue('Interface_MenuItem_Encyclopedia'))
        this.removePath.setFromValue(cfgValue.getValue('Interface_MenuItem_RemovePath'))
        this.deleteElectricFence.setFromValue(cfgValue.getValue('Interface_MenuItem_DeleteElectricFence'))
        this.deleteVehicle.setFromValue(cfgValue.getValue('Interface_MenuItem_DeleteVehicle'))
        this.deleteBuilding.setFromValue(cfgValue.getValue('Interface_MenuItem_DeleteBuilding'))
        this.dropBirdScarer.setFromValue(cfgValue.getValue('Interface_MenuItem_DropBirdScarer'))
        this.getTool.setFromValue(cfgValue.getValue('Interface_MenuItem_GetTool'))
        this.getDrill.setFromValue(cfgValue.getValue('Interface_MenuItem_GetDrill'))
        this.getSpade.setFromValue(cfgValue.getValue('Interface_MenuItem_GetSpade'))
        this.getHammer.setFromValue(cfgValue.getValue('Interface_MenuItem_GetHammer'))
        this.getSpanner.setFromValue(cfgValue.getValue('Interface_MenuItem_GetSpanner'))
        this.getFreezerGun.setFromValue(cfgValue.getValue('Interface_MenuItem_GetFreezerGun'))
        this.getLaser.setFromValue(cfgValue.getValue('Interface_MenuItem_GetLaser'))
        this.getPusherGun.setFromValue(cfgValue.getValue('Interface_MenuItem_GetPusherGun'))
        this.getBirdScarer.setFromValue(cfgValue.getValue('Interface_MenuItem_GetBirdScarer'))
        this.trainSkill.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainSkill'))
        this.trainDriver.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainDriver'))
        this.trainEngineer.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainEngineer'))
        this.trainGeologist.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainGeologist'))
        this.trainPilot.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainPilot'))
        this.trainSailor.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainSailor'))
        this.trainDynamite.setFromValue(cfgValue.getValue('Interface_MenuItem_TrainDynamite'))
        this.ejectCrystal.setFromValue(cfgValue.getValue('Interface_MenuItem_EjectCrystal'))
        this.ejectOre.setFromValue(cfgValue.getValue('Interface_MenuItem_EjectOre'))
        this.upgradeVehicle.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgradeVehicle'))
        this.upgradeEngine.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgradeEngine'))
        this.upgradeDrill.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgardeDrill'))
        this.upgradeScan.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgardeScan'))
        this.upgradeCarry.setFromValue(cfgValue.getValue('Interface_MenuItem_UpgardeCarry'))
        this.cancelConstruction.setFromValue(cfgValue.getValue('Interface_MenuItem_CancelConstruction'))
        return this
    }
}

export type InterfaceBuildImage = keyof ExcludeFunctionPropertyNames<InterfaceBuildImagesCfg>

export class InterfaceBuildImagesCfg implements ConfigSetFromRecord {
    largeMLP: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('largeMLP')
    hoverboard: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('hoverboard')
    smallHeli: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('smallHeli')
    smallMLP: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('smallMLP')
    smallCat: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('smallCat')
    smallDigger: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('smallDigger')
    smallTruck: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('smallTruck')
    bullDozer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('bullDozer')
    walkerDigger: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('walkerDigger')
    largeDigger: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('largeDigger')
    largeCat: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('largeCat')
    largeHeli: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('largeHeli')
    barracks: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('barracks')
    powerStation: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('powerStation')
    oreRefinery: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('oreRefinery')
    teleportPad: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('teleportPad')
    docks: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('docks')
    canteen: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('canteen')
    teleportBig: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('teleportBig')
    toolstation: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('toolstation')
    gunstation: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('gunstation')
    upgrade: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('upgrade')
    geoDome: InterfaceImageEntryCfg = new InterfaceImageEntryCfg('geoDome')

    setFromRecord(cfgValue: CfgEntry): this {
        this.largeMLP.setFromValue(cfgValue.getValue('LargeMLP'))
        this.hoverboard.setFromValue(cfgValue.getValue('Hoverboard'))
        this.smallHeli.setFromValue(cfgValue.getValue('SmallHeli'))
        this.smallMLP.setFromValue(cfgValue.getValue('SmallMLP'))
        this.smallCat.setFromValue(cfgValue.getValue('SmallCat'))
        this.smallDigger.setFromValue(cfgValue.getValue('SmallDigger'))
        this.smallTruck.setFromValue(cfgValue.getValue('SmallTruck'))
        this.bullDozer.setFromValue(cfgValue.getValue('BullDozer'))
        this.walkerDigger.setFromValue(cfgValue.getValue('WalkerDigger'))
        this.largeDigger.setFromValue(cfgValue.getValue('LargeDigger'))
        this.largeCat.setFromValue(cfgValue.getValue('LargeCat'))
        this.largeHeli.setFromValue(cfgValue.getValue('LargeHeli'))
        this.barracks.setFromValue(cfgValue.getValue('Barracks'))
        this.powerStation.setFromValue(cfgValue.getValue('PowerStation'))
        this.oreRefinery.setFromValue(cfgValue.getValue('OreRefinery'))
        this.teleportPad.setFromValue(cfgValue.getValue('TeleportPad'))
        this.docks.setFromValue(cfgValue.getValue('Docks'))
        this.canteen.setFromValue(cfgValue.getValue('Canteen'))
        this.teleportBig.setFromValue(cfgValue.getValue('TeleportBig'))
        this.toolstation.setFromValue(cfgValue.getValue('Toolstation'))
        this.gunstation.setFromValue(cfgValue.getValue('Gunstation'))
        this.upgrade.setFromValue(cfgValue.getValue('Upgrade'))
        this.geoDome.setFromValue(cfgValue.getValue('Geo-Dome'))
        return this
    }
}
