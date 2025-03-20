import { CfgHelper } from './CfgHelper'
import { BaseButtonCfg } from './ButtonCfg'

export class InterfaceImageEntryCfg extends BaseButtonCfg {
    tooltipDisabled: string = ''
    tooltipDisabledSfx: string = ''
    hotkey: string = ''

    constructor() {
        super()
        this.width = 40
        this.height = 40
    }

    setFromValue(cfgValue: any, buttonType: string): void {
        let hotkeyName: string | undefined
        if (cfgValue.length === 4) {
            [this.normalFile, this.disabledFile, this.pressedFile, hotkeyName] = cfgValue
        } else if (cfgValue.length === 6 || cfgValue.length === 7) { // XXX 7th element is boolean, but usage unknown
            let tooltip: string | undefined, tooltipDisabled: string[] | string | undefined
            ;[this.normalFile, this.disabledFile, this.pressedFile, tooltip, tooltipDisabled, hotkeyName] = cfgValue
            this.tooltipText = CfgHelper.parseLabel((Array.isArray(tooltip) && tooltip[0]) || tooltip)
            this.tooltipSfx = (Array.isArray(tooltip) && tooltip[1]) || ''
            this.tooltipDisabled = CfgHelper.parseLabel((Array.isArray(tooltipDisabled) && tooltipDisabled[0]) || tooltipDisabled)
            this.tooltipDisabledSfx = (Array.isArray(tooltipDisabled) && tooltipDisabled[1]) || ''
        } else {
            console.error(`Unexpected menu item cfg value length: ${cfgValue.length}`)
        }
        this.buttonType = buttonType
        this.hotkey = this.keyNameToKey(hotkeyName)
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

export class InterfaceImagesCfg {
    backToDefault: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    teleportMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    buildBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    buildSmallVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    buildLargeVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    layPath: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    repairLava: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    geologistTest: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    clearRubble: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    dam: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    selectMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    deleteMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    attack: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    selectVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    unLoadVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    unLoadMiniFigure: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    miniFigurePickUp: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    vehiclePickUp: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getOut: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    gotoDock: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getIn: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    dig: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    reinforce: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    dynamite: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeMan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    goFeed: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    gotoFirstPerson: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    gotoSecondPerson: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trackObject: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    powerOn: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    powerOff: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    repair: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    selectBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    gotoTopView: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    makeTeleporterPrimary: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    deselectDig: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    placeFence: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    encyclopedia: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    removePath: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    deleteElectricFence: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    deleteVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    deleteBuilding: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    dropBirdScarer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getTool: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getDrill: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getSpade: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getHammer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getSpanner: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getFreezerGun: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getLaser: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getPusherGun: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    getBirdScarer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainSkill: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainDriver: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainEngineer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainGeologist: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainPilot: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainSailor: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    trainDynamite: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    ejectCrystal: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    ejectOre: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeVehicle: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeEngine: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeDrill: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeScan: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgradeCarry: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    cancelConstruction: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()

    setFromValue(cfgValue: Record<string, [string, string, string, string]>): void {
        this.backToDefault.setFromValue(CfgHelper.getValue(cfgValue, 'backToDefault'), 'backToDefault')
        this.teleportMan.setFromValue(CfgHelper.getValue(cfgValue, 'teleportMan'), 'teleportMan')
        this.buildBuilding.setFromValue(CfgHelper.getValue(cfgValue, 'buildBuilding'), 'buildBuilding')
        this.buildSmallVehicle.setFromValue(CfgHelper.getValue(cfgValue, 'buildSmallVehicle'), 'buildSmallVehicle')
        this.buildLargeVehicle.setFromValue(CfgHelper.getValue(cfgValue, 'buildLargeVehicle'), 'buildLargeVehicle')
        this.layPath.setFromValue(CfgHelper.getValue(cfgValue, 'layPath'), 'layPath')
        this.repairLava.setFromValue(CfgHelper.getValue(cfgValue, 'repairLava'), 'repairLava')
        this.geologistTest.setFromValue(CfgHelper.getValue(cfgValue, 'geologistTest'), 'geologistTest')
        this.clearRubble.setFromValue(CfgHelper.getValue(cfgValue, 'clearRubble'), 'clearRubble')
        this.dam.setFromValue(CfgHelper.getValue(cfgValue, 'dam'), 'dam')
        this.selectMan.setFromValue(CfgHelper.getValue(cfgValue, 'selectMan'), 'selectMan')
        this.deleteMan.setFromValue(CfgHelper.getValue(cfgValue, 'deleteMan'), 'deleteMan')
        this.attack.setFromValue(CfgHelper.getValue(cfgValue, 'attack'), 'attack')
        this.selectVehicle.setFromValue(CfgHelper.getValue(cfgValue, 'selectVehicle'), 'selectVehicle')
        this.unLoadVehicle.setFromValue(CfgHelper.getValue(cfgValue, 'unLoadVehicle'), 'unLoadVehicle')
        this.unLoadMiniFigure.setFromValue(CfgHelper.getValue(cfgValue, 'unLoadMinifigure'), 'unLoadMiniFigure')
        this.miniFigurePickUp.setFromValue(CfgHelper.getValue(cfgValue, 'minifigurePickUp'), 'miniFigurePickUp')
        this.vehiclePickUp.setFromValue(CfgHelper.getValue(cfgValue, 'vehiclePickUp'), 'vehiclePickUp')
        this.getOut.setFromValue(CfgHelper.getValue(cfgValue, 'getOut'), 'getOut')
        this.gotoDock.setFromValue(CfgHelper.getValue(cfgValue, 'gotoDock'), 'gotoDock')
        this.getIn.setFromValue(CfgHelper.getValue(cfgValue, 'getIn'), 'getIn')
        this.dig.setFromValue(CfgHelper.getValue(cfgValue, 'dig'), 'dig')
        this.reinforce.setFromValue(CfgHelper.getValue(cfgValue, 'reinforce'), 'reinforce')
        this.dynamite.setFromValue(CfgHelper.getValue(cfgValue, 'dynamite'), 'dynamite')
        this.upgradeMan.setFromValue(CfgHelper.getValue(cfgValue, 'upgradeMan'), 'upgradeMan')
        this.goFeed.setFromValue(CfgHelper.getValue(cfgValue, 'goFeed'), 'goFeed')
        this.gotoFirstPerson.setFromValue(CfgHelper.getValue(cfgValue, 'gotoFirstPerson'), 'gotoFirstPerson')
        this.gotoSecondPerson.setFromValue(CfgHelper.getValue(cfgValue, 'gotoSecondPerson'), 'gotoSecondPerson')
        this.trackObject.setFromValue(CfgHelper.getValue(cfgValue, 'trackObject'), 'trackObject')
        this.powerOn.setFromValue(CfgHelper.getValue(cfgValue, 'powerOn'), 'powerOn')
        this.powerOff.setFromValue(CfgHelper.getValue(cfgValue, 'powerOff'), 'powerOff')
        this.upgradeBuilding.setFromValue(CfgHelper.getValue(cfgValue, 'upgradeBuilding'), 'upgradeBuilding')
        this.repair.setFromValue(CfgHelper.getValue(cfgValue, 'repair'), 'repair')
        this.selectBuilding.setFromValue(CfgHelper.getValue(cfgValue, 'selectBuilding'), 'selectBuilding')
        this.gotoTopView.setFromValue(CfgHelper.getValue(cfgValue, 'gotoTopView'), 'gotoTopView')
        this.makeTeleporterPrimary.setFromValue(CfgHelper.getValue(cfgValue, 'makeTeleporterPrimary'), 'makeTeleporterPrimary')
        this.deselectDig.setFromValue(CfgHelper.getValue(cfgValue, 'deselectDig'), 'deselectDig')
        this.placeFence.setFromValue(CfgHelper.getValue(cfgValue, 'placeFence'), 'placeFence')
        this.encyclopedia.setFromValue(CfgHelper.getValue(cfgValue, 'encyclopedia'), 'encyclopedia')
        this.removePath.setFromValue(CfgHelper.getValue(cfgValue, 'removePath'), 'removePath')
        this.deleteElectricFence.setFromValue(CfgHelper.getValue(cfgValue, 'deleteElectricFence'), 'deleteElectricFence')
        this.deleteVehicle.setFromValue(CfgHelper.getValue(cfgValue, 'deleteVehicle'), 'deleteVehicle')
        this.deleteBuilding.setFromValue(CfgHelper.getValue(cfgValue, 'deleteBuilding'), 'deleteBuilding')
        this.dropBirdScarer.setFromValue(CfgHelper.getValue(cfgValue, 'dropBirdScarer'), 'dropBirdScarer')
        this.getTool.setFromValue(CfgHelper.getValue(cfgValue, 'getTool'), 'getTool')
        this.getDrill.setFromValue(CfgHelper.getValue(cfgValue, 'getDrill'), 'getDrill')
        this.getSpade.setFromValue(CfgHelper.getValue(cfgValue, 'getSpade'), 'getSpade')
        this.getHammer.setFromValue(CfgHelper.getValue(cfgValue, 'getHammer'), 'getHammer')
        this.getSpanner.setFromValue(CfgHelper.getValue(cfgValue, 'getSpanner'), 'getSpanner')
        this.getFreezerGun.setFromValue(CfgHelper.getValue(cfgValue, 'getFreezerGun'), 'getFreezerGun')
        this.getLaser.setFromValue(CfgHelper.getValue(cfgValue, 'getLaser'), 'getLaser')
        this.getPusherGun.setFromValue(CfgHelper.getValue(cfgValue, 'getPusherGun'), 'getPusherGun')
        this.getBirdScarer.setFromValue(CfgHelper.getValue(cfgValue, 'getBirdScarer'), 'getBirdScarer')
        this.trainSkill.setFromValue(CfgHelper.getValue(cfgValue, 'trainSkill'), 'trainSkill')
        this.trainDriver.setFromValue(CfgHelper.getValue(cfgValue, 'trainDriver'), 'trainDriver')
        this.trainEngineer.setFromValue(CfgHelper.getValue(cfgValue, 'trainEngineer'), 'trainEngineer')
        this.trainGeologist.setFromValue(CfgHelper.getValue(cfgValue, 'trainGeologist'), 'trainGeologist')
        this.trainPilot.setFromValue(CfgHelper.getValue(cfgValue, 'trainPilot'), 'trainPilot')
        this.trainSailor.setFromValue(CfgHelper.getValue(cfgValue, 'trainSailor'), 'trainSailor')
        this.trainDynamite.setFromValue(CfgHelper.getValue(cfgValue, 'trainDynamite'), 'trainDynamite')
        this.ejectCrystal.setFromValue(CfgHelper.getValue(cfgValue, 'ejectCrystal'), 'ejectCrystal')
        this.ejectOre.setFromValue(CfgHelper.getValue(cfgValue, 'ejectOre'), 'ejectOre')
        this.upgradeVehicle.setFromValue(CfgHelper.getValue(cfgValue, 'upgradeVehicle'), 'upgradeVehicle')
        this.upgradeEngine.setFromValue(CfgHelper.getValue(cfgValue, 'upgradeEngine'), 'upgradeEngine')
        this.upgradeDrill.setFromValue(CfgHelper.getValue(cfgValue, 'upgardeDrill'), 'upgradeDrill')
        this.upgradeScan.setFromValue(CfgHelper.getValue(cfgValue, 'upgardeScan'), 'upgradeScan')
        this.upgradeCarry.setFromValue(CfgHelper.getValue(cfgValue, 'upgardeCarry'), 'upgradeCarry')
        this.cancelConstruction.setFromValue(CfgHelper.getValue(cfgValue, 'cancelConstruction'), 'cancelConstruction')
    }
}

export type InterfaceBuildImage = keyof ExcludeFunctionPropertyNames<InterfaceBuildImagesCfg>

export class InterfaceBuildImagesCfg {
    largeMLP: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    hoverboard: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    smallHeli: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    smallMLP: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    smallCat: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    smallDigger: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    smallTruck: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    bullDozer: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    walkerDigger: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    largeDigger: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    largeCat: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    largeHeli: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    barracks: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    powerStation: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    oreRefinery: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    teleportPad: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    docks: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    canteen: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    teleportBig: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    toolstation: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    gunstation: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    upgrade: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()
    geoDome: InterfaceImageEntryCfg = new InterfaceImageEntryCfg()

    setFromValue(cfgValue: Record<string, [string, string, string, string]>): void {
        this.largeMLP.setFromValue(CfgHelper.getValue(cfgValue, 'largeMLP'), 'largeMLP')
        this.hoverboard.setFromValue(CfgHelper.getValue(cfgValue, 'hoverboard'), 'hoverboard')
        this.smallHeli.setFromValue(CfgHelper.getValue(cfgValue, 'smallHeli'), 'smallHeli')
        this.smallMLP.setFromValue(CfgHelper.getValue(cfgValue, 'smallMLP'), 'smallMLP')
        this.smallCat.setFromValue(CfgHelper.getValue(cfgValue, 'smallCat'), 'smallCat')
        this.smallDigger.setFromValue(CfgHelper.getValue(cfgValue, 'smallDigger'), 'smallDigger')
        this.smallTruck.setFromValue(CfgHelper.getValue(cfgValue, 'smallTruck'), 'smallTruck')
        this.bullDozer.setFromValue(CfgHelper.getValue(cfgValue, 'bullDozer'), 'bullDozer')
        this.walkerDigger.setFromValue(CfgHelper.getValue(cfgValue, 'walkerDigger'), 'walkerDigger')
        this.largeDigger.setFromValue(CfgHelper.getValue(cfgValue, 'largeDigger'), 'largeDigger')
        this.largeCat.setFromValue(CfgHelper.getValue(cfgValue, 'largeCat'), 'largeCat')
        this.largeHeli.setFromValue(CfgHelper.getValue(cfgValue, 'largeHeli'), 'largeHeli')
        this.barracks.setFromValue(CfgHelper.getValue(cfgValue, 'barracks'), 'barracks')
        this.powerStation.setFromValue(CfgHelper.getValue(cfgValue, 'powerStation'), 'powerStation')
        this.oreRefinery.setFromValue(CfgHelper.getValue(cfgValue, 'oreRefinery'), 'oreRefinery')
        this.teleportPad.setFromValue(CfgHelper.getValue(cfgValue, 'teleportPad'), 'teleportPad')
        this.docks.setFromValue(CfgHelper.getValue(cfgValue, 'docks'), 'docks')
        this.canteen.setFromValue(CfgHelper.getValue(cfgValue, 'canteen'), 'canteen')
        this.teleportBig.setFromValue(CfgHelper.getValue(cfgValue, 'teleportBig'), 'teleportBig')
        this.toolstation.setFromValue(CfgHelper.getValue(cfgValue, 'toolstation'), 'toolstation')
        this.gunstation.setFromValue(CfgHelper.getValue(cfgValue, 'gunstation'), 'gunstation')
        this.upgrade.setFromValue(CfgHelper.getValue(cfgValue, 'upgrade'), 'upgrade')
        this.geoDome.setFromValue(CfgHelper.getValue(cfgValue, 'geoDome'), 'geoDome')
    }
}
