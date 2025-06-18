// noinspection JSUnusedGlobalSymbols

import { RaiderTrainingStats } from '../game/model/raider/RaiderTraining'
import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export interface PickSphereStats {
    pickSphere: number
    collRadius: number
    collHeight: number
}

export interface DoubleSelectStats {
    canDoubleSelect: boolean
}

export interface MovableEntityStats extends PickSphereStats {
    routeSpeed: number[]
    crossLand: boolean
    crossWater: boolean
    crossLava: boolean
    rubbleCoef: number
    pathCoef: number
    randomEnterWall: boolean
}

export class VehicleEntityStats implements MovableEntityStats, DoubleSelectStats, PickSphereStats, ConfigSetFromRecord {
    pickSphere: number = 0
    collRadius: number = 0
    collHeight: number = 0
    canDoubleSelect: boolean = false
    costOre: number = 0
    costCrystal: number = 0
    invisibleDriver: boolean = false
    engineSound: string = ''
    canClearRubble: boolean = false
    routeSpeed: number[] = []
    soilDrillTime: number[] = []
    looseDrillTime: number[] = []
    medDrillTime: number[] = []
    hardDrillTime: number[] = []
    seamDrillTime: number[] = []
    surveyRadius: number[] = []
    oxygenCoef: number = 0
    pathCoef: number = 1
    rubbleCoef: number = 1
    randomEnterWall: boolean = false
    crossLand: boolean = false
    crossWater: boolean = false
    crossLava: boolean = false
    maxCarry: number[] = []
    carryVehicles: boolean = false
    vehicleCanBeCarried: boolean = false
    upgradeCostOre: number[] = []
    upgradeCostStuds: number[] = []

    setFromRecord(cfgValue: CfgEntry): this {
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.canDoubleSelect = cfgValue.getValue('CanDoubleSelect').toBoolean()
        this.costOre = cfgValue.getValue('CostOre').toNumber()
        this.costCrystal = cfgValue.getValue('CostCrystal').toNumber()
        this.invisibleDriver = cfgValue.getValue('InvisibleDriver').toBoolean()
        this.engineSound = cfgValue.getValue('EngineSound').toString()
        this.canClearRubble = cfgValue.getValue('CanClearRubble').toBoolean()
        this.routeSpeed = cfgValue.getValue('RouteSpeed').toArray(':', undefined).map((v) => v.toNumber())
        this.soilDrillTime = cfgValue.getValue('SoilDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.looseDrillTime = cfgValue.getValue('LooseDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.medDrillTime = cfgValue.getValue('MedDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.hardDrillTime = cfgValue.getValue('HardDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.seamDrillTime = cfgValue.getValue('SeamDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.surveyRadius = cfgValue.getValue('SurveyRadius').toArray(':', undefined).map((v) => v.toNumber())
        this.oxygenCoef = cfgValue.getValue('OxygenCoef').toNumber(this.oxygenCoef)
        this.pathCoef = cfgValue.getValue('PathCoef').toNumber(this.pathCoef)
        this.rubbleCoef = cfgValue.getValue('RubbleCoef').toNumber(this.rubbleCoef)
        this.randomEnterWall = cfgValue.getValue('RandomEnterWall').toBoolean()
        this.crossLand = cfgValue.getValue('CrossLand').toBoolean()
        this.crossWater = cfgValue.getValue('CrossWater').toBoolean()
        this.crossLava = cfgValue.getValue('CrossLava').toBoolean()
        this.maxCarry = cfgValue.getValue('MaxCarry').toArray(':', undefined).map((v) => v.toNumber())
        this.carryVehicles = cfgValue.getValue('CarryVehicles').toBoolean()
        this.vehicleCanBeCarried = cfgValue.getValue('VehicleCanBeCarried').toBoolean()
        this.upgradeCostOre = cfgValue.getValue('UpgradeCostOre').toArray(':', undefined).map((v) => v.toNumber())
        this.upgradeCostStuds = cfgValue.getValue('UpgradeCostStuds').toArray(':', undefined).map((v) => v.toNumber())
        return this
    }
}

export class BuildingEntityStats implements DoubleSelectStats, RaiderTrainingStats, ConfigSetFromRecord {
    levels: number = 0
    selfPowered: boolean = false
    powerBuilding: boolean = false
    pickSphere: number = 0
    collRadius: number = 0
    collHeight: number = 0
    toolStore: boolean = false
    trainDriver: boolean[] = []
    trainRepair: boolean[] = []
    trainScanner: boolean[] = []
    trainPilot: boolean[] = []
    trainSailor: boolean[] = []
    trainDynamite: boolean[] = []
    costOre: number = 0
    costRefinedOre: number = 0
    costCrystal: number = 0
    upgradeBuilding: boolean = false
    snaxULike: boolean = false
    surveyRadius: number[] = []
    crystalDrain: number | number[] = 0
    oxygenCoef: number = 0
    engineSound: string = ''
    canDoubleSelect: boolean = false
    maxCarry: number[] = []
    damageCausesCallToArms: boolean = false
    functionCoef: number[] = []

    setFromRecord(cfgValue: CfgEntry): this {
        this.levels = cfgValue.getValue('Levels').toNumber()
        this.selfPowered = cfgValue.getValue('SelfPowered').toBoolean()
        this.powerBuilding = cfgValue.getValue('PowerBuilding').toBoolean()
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.toolStore = cfgValue.getValue('ToolStore').toBoolean()
        this.trainDriver = cfgValue.getValue('TrainDriver').toArray(':', undefined).map((v) => v.toBoolean())
        this.trainRepair = cfgValue.getValue('TrainRepair').toArray(':', undefined).map((v) => v.toBoolean())
        this.trainScanner = cfgValue.getValue('TrainScanner').toArray(':', undefined).map((v) => v.toBoolean())
        this.trainPilot = cfgValue.getValue('TrainPilot').toArray(':', undefined).map((v) => v.toBoolean())
        this.trainSailor = cfgValue.getValue('TrainSailor').toArray(':', undefined).map((v) => v.toBoolean())
        this.trainDynamite = cfgValue.getValue('TrainDynamite').toArray(':', undefined).map((v) => v.toBoolean())
        this.costOre = cfgValue.getValue('CostOre').toNumber()
        this.costRefinedOre = cfgValue.getValue('CostRefinedOre').toNumber()
        this.costCrystal = cfgValue.getValue('CostCrystal').toNumber()
        this.upgradeBuilding = cfgValue.getValue('UpgradeBuilding').toBoolean()
        this.snaxULike = cfgValue.getValue('SnaxULike').toBoolean()
        this.surveyRadius = cfgValue.getValue('SurveyRadius').toArray(':', undefined).map((v) => v.toNumber())
        this.crystalDrain = cfgValue.getValue('CrystalDrain').toArray(':', undefined).map((v) => v.toNumber())
        this.oxygenCoef = cfgValue.getValue('OxygenCoef').toNumber()
        this.engineSound = cfgValue.getValue('EngineSound').toString()
        this.canDoubleSelect = cfgValue.getValue('CanDoubleSelect').toBoolean()
        this.maxCarry = cfgValue.getValue('MaxCarry').toArray(':', undefined).map((v) => v.toNumber())
        this.damageCausesCallToArms = cfgValue.getValue('DamageCausesCallToArms').toBoolean()
        this.functionCoef = cfgValue.getValue('FunctionCoef').toArray(':', undefined).map((v) => v.toNumber())
        return this
    }

    get maxLevel(): number {
        return this.levels - 1
    }
}

export class MonsterEntityStats implements MovableEntityStats, ConfigSetFromRecord {
    pickSphere: number = 0
    restPercent: number = 100.0
    collRadius: number = 0
    collHeight: number = 0
    routeSpeed: number[] = []
    pathCoef: number = 1
    rubbleCoef: number = 1
    randomEnterWall: boolean = false
    randomMove: boolean = false
    randomMoveTime: number = 0
    crossLand: boolean = false
    crossLava: boolean = false
    crossWater: boolean = false
    canBeHitByFence: boolean = false
    canBeShotAt: boolean = false
    canFreeze: boolean = false
    freezerTime: number = 0
    freezerDamage: number = 0
    canLaser: boolean = false
    laserDamage: number = 0
    canPush: boolean = false
    pusherDist: number = 0
    pusherDamage: number = 0
    wakeRadius: number = 0
    capacity: number = 0
    repairValue: number = 0
    attackRadius: number = 0
    alertRadius: number = 0

    setFromRecord(cfgValue: CfgEntry): this {
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        this.restPercent = cfgValue.getValue('RestPercent').toNumber(this.restPercent) / 100
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.routeSpeed = cfgValue.getValue('RouteSpeed').toArray(':', undefined).map((v) => v.toNumber())
        this.pathCoef = cfgValue.getValue('PathCoef').toNumber(this.pathCoef)
        this.rubbleCoef = cfgValue.getValue('RubbleCoef').toNumber(this.rubbleCoef)
        this.randomEnterWall = cfgValue.getValue('RandomEnterWall').toBoolean()
        this.randomMove = cfgValue.getValue('RandomMove').toBoolean()
        this.randomMoveTime = cfgValue.getValue('RandomMoveTime').toNumber()
        this.crossLand = cfgValue.getValue('CrossLand').toBoolean()
        this.crossLava = cfgValue.getValue('CrossLava').toBoolean()
        this.crossWater = cfgValue.getValue('CrossWater').toBoolean()
        this.canBeHitByFence = cfgValue.getValue('CanBeHitByFence').toBoolean()
        this.canBeShotAt = cfgValue.getValue('CanBeShotAt').toBoolean()
        this.canFreeze = cfgValue.getValue('CanFreeze').toBoolean()
        this.freezerTime = cfgValue.getValue('FreezerTime').toNumber()
        this.freezerDamage = cfgValue.getValue('FreezerDamage').toNumber()
        this.canLaser = cfgValue.getValue('CanLaser').toBoolean()
        this.laserDamage = cfgValue.getValue('LaserDamage').toNumber()
        this.canPush = cfgValue.getValue('CanPush').toBoolean()
        this.pusherDist = cfgValue.getValue('PusherDist').toNumber()
        this.pusherDamage = cfgValue.getValue('PusherDamage').toNumber()
        this.wakeRadius = cfgValue.getValue('WakeRadius').toNumber()
        this.capacity = cfgValue.getValue('Capacity').toNumber()
        this.repairValue = cfgValue.getValue('RepairValue').toNumber()
        this.attackRadius = cfgValue.getValue('AttackRadius').toNumber()
        this.alertRadius = cfgValue.getValue('AlertRadius').toNumber()
        return this
    }

    get freezerTimeMs(): number {
        return this.freezerTime * 1000 / 25 // given as 25 per second
    }
}

export class PilotStats implements MovableEntityStats, PickSphereStats, ConfigSetFromRecord {
    levels: number = 4
    routeSpeed: number[] = [1.10, 1.10, 1.10, 1.10]
    soilDrillTime: number[] = [4.0, 4.0, 4.0, 4.0] // Time in seconds to drill through the rock.
    looseDrillTime: number[] = [4.0, 4.0, 4.0, 4.0]
    medDrillTime: number[] = [8.0, 8.0, 8.0, 8.0]
    hardDrillTime: number[] = [0.0, 0.0, 0.0, 0.0] // Zero means the object cannot drill the rock type
    seamDrillTime: number[] = [10.0, 10.0, 10.0, 10.0] // Either or both ore or crystal.
    upgradeTime: number[] = [30.0, 45.0, 60.0, 60.0] // Last entry is ignored as it can never upgrade from that.
    collRadius: number = 5.0
    collHeight: number = 12.0
    trackDist: number = 40.0
    pickSphere: number = 10.0
    repairValue: number[] = [10.0, 15.0, 20.0, 25.0]
    surveyRadius: number[] = [3, 3, 3, 3]
    drillSound: string = 'SND_pilotdrill'
    drillFadeSound: string = 'SND_pilotdrillfade'
    restPercent: number = 60.0
    energyDecayRate: number = 0.25
    canClearRubble: boolean = true
    numOfToolsCanCarry: number[] = [2, 3, 4, 5]
    randomEnterWall: boolean = false
    crossLand: boolean = true
    crossWater: boolean = false
    crossLava: boolean = false
    rubbleCoef: number = 0.5
    pathCoef: number = 2.0
    routeAvoidance: boolean = true
    useManTeleporter: boolean = true
    awarenessRange: number = 10.0
    oxygenCoef: number = -1.0
    canStrafe: boolean = true
    enterToolStore: boolean = true
    showHealthBar: boolean = true

    setFromRecord(cfgValue: CfgEntry): this {
        this.levels = cfgValue.getValue('Levels').toNumber()
        this.routeSpeed = cfgValue.getValue('RouteSpeed').toArray(':', undefined).map((v) => v.toNumber())
        this.soilDrillTime = cfgValue.getValue('SoilDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.looseDrillTime = cfgValue.getValue('LooseDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.medDrillTime = cfgValue.getValue('MedDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.hardDrillTime = cfgValue.getValue('HardDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.seamDrillTime = cfgValue.getValue('SeamDrillTime').toArray(':', undefined).map((v) => v.toNumber())
        this.upgradeTime = cfgValue.getValue('UpgradeTime').toArray(':', undefined).map((v) => v.toNumber())
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.trackDist = cfgValue.getValue('TrackDist').toNumber()
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        this.repairValue = cfgValue.getValue('RepairValue').toArray(':', undefined).map((v) => v.toNumber())
        this.surveyRadius = cfgValue.getValue('SurveyRadius').toArray(':', undefined).map((v) => v.toNumber())
        this.drillSound = cfgValue.getValue('DrillSound').toString()
        this.drillFadeSound = cfgValue.getValue('DrillFadeSound').toString()
        this.restPercent = cfgValue.getValue('RestPercent').toNumber() / 100
        this.energyDecayRate = cfgValue.getValue('EnergyDecayRate').toNumber()
        this.canClearRubble = cfgValue.getValue('CanClearRubble').toBoolean()
        this.numOfToolsCanCarry = cfgValue.getValue('NumOfToolsCanCarry').toArray(':', undefined).map((v) => v.toNumber())
        this.randomEnterWall = cfgValue.getValue('RandomEnterWall').toBoolean()
        this.crossLand = cfgValue.getValue('CrossLand').toBoolean()
        this.crossWater = cfgValue.getValue('CrossWater').toBoolean()
        this.crossLava = cfgValue.getValue('CrossLava').toBoolean()
        this.rubbleCoef = cfgValue.getValue('RubbleCoef').toNumber()
        this.pathCoef = cfgValue.getValue('PathCoef').toNumber()
        this.routeAvoidance = cfgValue.getValue('RouteAvoidance').toBoolean()
        this.useManTeleporter = cfgValue.getValue('UseLegoManTeleporter').toBoolean()
        this.awarenessRange = cfgValue.getValue('AwarenessRange').toNumber()
        this.oxygenCoef = cfgValue.getValue('OxygenCoef').toNumber()
        this.canStrafe = cfgValue.getValue('CanStrafe').toBoolean()
        this.enterToolStore = cfgValue.getValue('EnterToolStore').toBoolean()
        this.showHealthBar = cfgValue.getValue('ShowHealthBar').toBoolean()
        return this
    }

    get maxLevel(): number {
        return this.levels - 1
    }
}

export class RockMonsterStats extends MonsterEntityStats {
    routeSpeed: number[] = [0.8]
    trackDist: number = 50.0
    collRadius: number = 10.0
    collHeight: number = 22.0
    alertRadius: number = 60.0
    healthDecayRate: number = 0.6 // Reduce health by 'n' every second.
    pickSphere: number = 22.0
    repairValue: number = -10.0
    canScare: boolean = true
    restPercent: number = 20.0
    carryMinHealth: number = 15.0
    painThreshold: number = 20.0
    stampRadius: number = 80.0
    attackRadius: number = 160.0
    canSteal: boolean = true
    crossLand: boolean = true
    rubbleCoef: number = 1.5
    grabMinifigure: boolean = true
    routeAvoidance: boolean = true
    bumpDamage: boolean = true
    attackPaths: boolean = true
    splitOnZeroHealth: boolean = true
    canBeHitByFence: boolean = true
    capacity: number = 6 // How many crystals it can eat
    pathCoef: number = 0.5
    // Statistics about the weapons
    canBeShotAt: boolean = true // Can this monster be shot at
    canFreeze: boolean = true // Can this object be frozen
    freezerTime: number = 25.0 // Time this object is frozen for
    freezerDamage: number = 5.0 // Damage that freezing causes
    canLaser: boolean = true // Can this object be lasered
    laserDamage: number = 110.0 // Damage sustained by a laser
    canPush: boolean = true // Can this object be pusher'ed
    pusherDist: number = 20.0 // Distance the object is pushed 40=1 block
    pusherDamage: number = 2.0 // Damage that the pusher gun causes
    wakeRadius: number = 25.0
    scaredByBigBangs: boolean = true
    removeReinforcement: boolean = true
    showHealthBar: boolean = true
}

export class SmallSpiderStats extends MonsterEntityStats {
    routeSpeed: number[] = [2.0]
    trackDist: number = 10.0
    collRadius: number = 0.0
    collHeight: number = 0.0
    pickSphere: number = 6.0
    alertRadius: number = 40.0
    randomMove: boolean = true
    randomEnterWall: boolean = true
    causeSlip: boolean = true
    crossLand: boolean = true
    rubbleCoef: number = 0.2
    dontShowDamage: boolean = true
    dontShowOnRadar: boolean = true
    scaredByBigBangs: boolean = true
}

export class BatStats extends MonsterEntityStats {
    routeSpeed: number[] = [1.0]
    trackDist: number = 10.0
    collRadius: number = 10.0
    alertRadius: number = 10.0 // Alert radius (causes attack mode)
    randomMove: boolean = true // Random movement
    randomMoveTime: number = 10
    canScare: boolean = true // Scare away the player
    scaredByBigBangs: boolean = true
    // Flock parameters.
    flocks: boolean = true // Set this to create a flock for this object.
    flocksDebug: boolean = false // If this is set the actual objects animation is displayed at the debug position.
    flocksSmooth: boolean = true // Smooths out the orientation of the flocks elements.
    flocksSize: number = 8 // Number of the given item in the flock.  (Default 5)
    flocksTurn: number = 0.06 // Turning speed of the bat. (0.06 default)
    flocksSpeed: number = 1.5 // Velocity of the flock. (2.0 default)
    flocksTightness: number = 0.8 // Tightness of the flock. (2.0 default)
    flocksGoalUpdate: number = 2.0 // How often the flocks goal is updated (25 per second).  (2.0 default)
    flocksRandomness: number = 6.0 // Randomness of goals. (2.0 default)
    flocksHeight: number = 22.0 // Height above the ground of the flock elements.  (30.0 default)
    crossLand: boolean = true
    crossWater: boolean = true
    crossLava: boolean = true
    dontShowDamage: boolean = true
}

export class TinyRMStats extends MonsterEntityStats {
    routeSpeed: number[] = [1.2]
    trackDist: number = 10.0
    collRadius: number = 0.0
    collHeight: number = 5.0
    pickSphere: number = 6.0
    alertRadius: number = 40.0
    crossLand: boolean = true
    rubbleCoef: number = 1.5
    dontShowDamage: boolean = true
    dontShowOnRadar: boolean = true
    scaredByPlayer: boolean = true
    scaredByBigBangs: boolean = true
}

export class TinyIMStats extends MonsterEntityStats {
    routeSpeed: number[] = [1.2]
    trackDist: number = 10.0
    collRadius: number = 0.0
    collHeight: number = 5.0
    pickSphere: number = 6.0
    alertRadius: number = 40.0
    crossLand: boolean = true
    rubbleCoef: number = 1.5
    dontShowDamage: boolean = true
    dontShowOnRadar: boolean = true
    scaredByPlayer: boolean = true
    scaredByBigBangs: boolean = true
}

export class SlugStats extends MonsterEntityStats {
    routeSpeed: number[] = [0.3]
    trackDist: number = 10.0
    collRadius: number = 3.0
    collHeight: number = 7.0
    pickSphere: number = 12.0
    alertRadius: number = 40.0
    crossLand: boolean = true
    rubbleCoef: number = 0.3
    useHoles: boolean = true
    drainPower: boolean = true
    attackRadius: number = 280.0
    painThreshold: number = 50.0
    canBeShotAt: boolean = true
    canLaser: boolean = true
    laserDamage: number = 5.0
    canPush: boolean = true // Can this object be pusher'ed
    pusherDist: number = 60.0 // Distance the object is pushed
    pusherDamage: number = 5.0 // Damage that the pusher gun causes
    showHealthBar: boolean = true
    scaredByBigBangs: boolean = true
}

export class LavaMonsterStats extends MonsterEntityStats {
    routeSpeed: number[] = [0.8]
    trackDist: number = 50.0
    collRadius: number = 10.0
    collHeight: number = 22.0
    alertRadius: number = 60.0
    healthDecayRate: number = 0.6 // Reduce health by 'n' every second.
    pickSphere: number = 22.0
    repairValue: number = -10.0
    canScare: boolean = true
    restPercent: number = 20.0
    carryMinHealth: number = 15.0
    painThreshold: number = 20.0
    stampRadius: number = 80.0
    attackRadius: number = 160.0
    canSteal: boolean = true
    crossLand: boolean = true
    rubbleCoef: number = 1.5
    grabMinifigure: boolean = true
    capacity: number = 7 // How many crystals it can eat
    routeAvoidance: boolean = true
    bumpDamage: boolean = true
    attackPaths: boolean = true
    splitOnZeroHealth: boolean = true
    canBeHitByFence: boolean = true
    pathCoef: number = 0.5
    crossLava: boolean = true
    // Statistics about the weapons
    canBeShotAt: boolean = true // Can this monster be shot at
    canFreeze: boolean = true // Can this object be frozen
    freezerTime: number = 75.0 // Time this object is frozen for
    freezerDamage: number = 40.0 // Damage that freezing causes
    canLaser: boolean = true // Can this object be lasered
    laserDamage: number = 1.0 // Damage sustained by a laser
    canPush: boolean = true // Can this object be pusher'ed
    pusherDist: number = 60.0 // Distance the object is pushed
    pusherDamage: number = 5.0 // Damage that the pusher gun causes
    wakeRadius: number = 25.0
    scaredByBigBangs: boolean = true
    removeReinforcement: boolean = true
    showHealthBar: boolean = true
}

export class IceMonsterStats extends MonsterEntityStats {
    routeSpeed: number[] = [0.8]
    trackDist: number = 50.0
    collRadius: number = 10.0
    collHeight: number = 22.0
    alertRadius: number = 60.0
    healthDecayRate: number = 0.6 // Reduce health by 'n' every second.
    pickSphere: number = 22.0
    repairValue: number = -10.0
    canScare: boolean = true
    restPercent: number = 20.0
    carryMinHealth: number = 15.0
    painThreshold: number = 20.0
    stampRadius: number = 80.0
    attackRadius: number = 120.0
    canSteal: boolean = true
    crossLand: boolean = true
    rubbleCoef: number = 1.5
    grabMinifigure: boolean = true
    capacity: number = 5 // How many crystals it can eat
    routeAvoidance: boolean = true
    bumpDamage: boolean = true
    attackPaths: boolean = true
    splitOnZeroHealth: boolean = true
    canBeHitByFence: boolean = true
    pathCoef: number = 0.5
    // Statistics about the weapons
    canBeShotAt: boolean = true // Can this monster be shot at
    canFreeze: boolean = false // Can this object be frozen
    freezerTime: number = 0.0 // Time this object is frozen for
    freezerDamage: number = 0.0 // Damage that freezing causes
    canLaser: boolean = true // Can this object be lasered
    laserDamage: number = 110.0 // Damage sustained by a laser
    canPush: boolean = true // Can this object be pusher'ed
    pusherDist: number = 60.0 // Distance the object is pushed
    pusherDamage: number = 2.0 // Damage that the pusher gun causes
    wakeRadius: number = 25.0
    scaredByBigBangs: boolean = true
    removeReinforcement: boolean = true
    showHealthBar: boolean = true
}

export class HoverboardStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No drill or carry)
    routeSpeed: number[] = [3.0, 3.0, 5.0, 5.0, 3.0, 3.0, 5.0, 5.0]
    surveyRadius: number[] = [0, 0, 0, 0, 4, 4, 4, 4]
    trackDist: number = 50.0
    collRadius: number = 8.0
    collHeight: number = 12.0
    pickSphere: number = 16.0
    canBeDriven: boolean = true
    crossLand: boolean = true
    useSmallTeleporter: boolean = true
    canStrafe: boolean = true
    costCrystal: number = 1
    upgradeCostOre: number[] = [0, 5, 10, 0]
    upgradeCostStuds: number[] = [0, 1, 2, 0]
    showHealthBar: boolean = true
    engineSound: string = 'SND_SmallEngine'
}

export class SmallHeliStats extends VehicleEntityStats {
    routeSpeed: number[] = [2.50]
    trackDist: number = 50.0
    collRadius: number = 10.0
    collHeight: number = 12.0
    pickSphere: number = 20.0
    canBeDriven: boolean = true
    crossLand: boolean = true
    crossWater: boolean = true
    crossLava: boolean = true
    useSmallTeleporter: boolean = true
    canStrafe: boolean = true
    costCrystal: number = 3
    showHealthBar: boolean = true
    engineSound: string = 'SND_HeliEngine'
}

export class SmallMlpStats extends VehicleEntityStats {
    routeSpeed: number[] = [0.50, 0.50, 0.50, 0.50]
    trackDist: number = 50.0
    collRadius: number = 12.0
    collHeight: number = 22.0
    pickSphere: number = 26.0
    canBeDriven: boolean = true
    crossLand: boolean = true
    useSmallTeleporter: boolean = true
    tracker: boolean = true
    canDoubleSelect: boolean = true
    costCrystal: number = 3
    upgradeCostOre: number[] = [0, 0, 0, 10]
    upgradeCostStuds: number[] = [0, 0, 0, 2]
    showHealthBar: boolean = true
    engineSound: string = 'SND_MediumEngine'
}

export class SmallCatStats extends VehicleEntityStats {
    routeSpeed: number[] = [2.0, 3.0, 4.0]
    trackDist: number = 50.0
    collRadius: number = 12.0
    collHeight: number = 12.0
    pickSphere: number = 26.0
    crossWater: boolean = true
    canBeDriven: boolean = true
    useWaterTeleporter: boolean = true
    costCrystal: number = 2
    maxCarry: number[] = [1, 1, 1]
    getInAtLand: boolean = true
    getOutAtLand: boolean = true
    takeCarryingDrivers: boolean = true
    showHealthBar: boolean = true
    engineSound: string = 'SND_Catamaran'
}

export class SmallDiggerStats extends VehicleEntityStats {
    routeSpeed: number[] = [2.0, 2.0, 4.0, 4.0, 2.0, 2.0, 4.0, 4.0]
    soilDrillTime: number[] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    looseDrillTime: number[] = [2.0, 1.0, 2.0, 1.0, 2.0, 1.0, 2.0, 1.0]
    medDrillTime: number[] = [4.0, 2.0, 4.0, 2.0, 4.0, 2.0, 4.0, 2.0]
    hardDrillTime: number[] = [180.0, 150.0, 180.0, 150.0, 180.0, 150.0, 180.0, 150.0]
    seamDrillTime: number[] = [8.0, 4.0, 8.0, 4.0, 8.0, 4.0, 8.0, 4.0]
    maxCarry: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
    surveyRadius: number[] = [0, 0, 0, 0, 4, 4, 4, 4]
    trackDist: number = 50.0
    collRadius: number = 10.0
    collHeight: number = 12.0
    pickSphere: number = 20.0
    canBeDriven: boolean = true
    crossLand: boolean = true
    routeAvoidance: boolean = true
    useSmallTeleporter: boolean = true
    vehicleCanBeCarried: boolean = true
    costCrystal: number = 1
    upgradeCostOre: number[] = [0, 5, 10, 10]
    upgradeCostStuds: number[] = [0, 1, 2, 2]
    showHealthBar: boolean = true
    engineSound: string = 'SND_SmallEngine'
}

export class SmallTruckStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No drill)
    routeSpeed: number[] = [2.0, 2.0, 3.0, 3.0, 2.0, 2.0, 3.0, 3.0, 2.0, 2.0, 3.0, 3.0, 2.0, 2.0, 3.0, 3.0]
    maxCarry: number[] = [3, 3, 3, 3, 3, 3, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6]
    carryStart: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3]
    surveyRadius: number[] = [0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 4]
    trackDist: number = 50.0
    collRadius: number = 10.0
    collHeight: number = 12.0
    pickSphere: number = 20.0
    canBeDriven: boolean = true
    crossLand: boolean = true
    useSmallTeleporter: boolean = true
    vehicleCanBeCarried: boolean = true
    costCrystal: number = 2
    enterToolStore: boolean = true
    upgradeCostOre: number[] = [5, 5, 10, 0]
    upgradeCostStuds: number[] = [1, 1, 2, 0]
    showHealthBar: boolean = true
    engineSound: string = 'SND_SmallEngine'
}

export class BulldozerStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No drill)
    routeSpeed: number[] = [0.5, 0.5, 0.8, 0.8, 0.5, 0.5, 0.8, 0.8, 0.5, 0.5, 0.8, 0.8, 0.5, 0.5, 0.8, 0.8]
    maxCarry: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2]
    surveyRadius: number[] = [0, 0, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 5]
    trackDist: number = 80.0
    collRadius: number = 18.0
    collHeight: number = 26.0
    pickSphere: number = 40.0
    crossLand: boolean = true
    canClearRubble: boolean = true
    useBigTeleporter: boolean = true
    canBeDriven: boolean = true
    costCrystal: number = 4
    invisibleDriver: boolean = true
    upgradeCostOre: number[] = [5, 5, 20, 0]
    upgradeCostStuds: number[] = [1, 1, 4, 0]
    showHealthBar: boolean = true
    engineSound: string = 'SND_MediumEngine'
}

export class WalkerDiggerStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No carry)
    routeSpeed: number[] = [0.50, 0.50, 0.80, 0.80, 0.50, 0.50, 0.80, 0.80]
    soilDrillTime: number[] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    looseDrillTime: number[] = [0.80, 0.40, 0.80, 0.40, 0.80, 0.40, 0.80, 0.40]
    medDrillTime: number[] = [2.0, 1.0, 2.0, 1.0, 2.0, 1.0, 2.0, 1.0]
    hardDrillTime: number[] = [180.0, 150.0, 180.0, 150.0, 180.0, 150.0, 180.0, 150.0]
    seamDrillTime: number[] = [4.0, 2.0, 4.0, 2.0, 4.0, 2.0, 4.0, 2.0]
    surveyRadius: number[] = [0, 0, 0, 0, 5, 5, 5, 5]
    trackDist: number = 80.0
    collRadius: number = 15.0
    collHeight: number = 33.0
    pickSphere: number = 35.0
    crossLand: boolean = true
    useBigTeleporter: boolean = true
    costCrystal: number = 3
    canBeDriven: boolean = true
    invisibleDriver: boolean = true
    canStrafe: boolean = true
    drillSound: string = 'DrillSFX_Grinder'
    drillFadeSound: string = 'DrillSFX_GrinderFade'
    upgradeCostOre: number[] = [0, 5, 20, 20]
    upgradeCostStuds: number[] = [0, 1, 4, 4]
    showHealthBar: boolean = true
    engineSound: string = 'SND_MediumEngine'
}

export class LargeDiggerStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No carry or scan)
    routeSpeed: number[] = [0.30, 0.30, 0.60, 0.60]
    soilDrillTime: number[] = [1.0, 1.0, 1.0, 1.0]
    looseDrillTime: number[] = [0.40, 0.20, 0.40, 0.20]
    medDrillTime: number[] = [0.80, 0.40, 0.80, 0.40]
    hardDrillTime: number[] = [1.0, 0.50, 1.0, 0.50]
    seamDrillTime: number[] = [1.0, 0.50, 1.0, 0.50]
    trackDist: number = 80.0
    collRadius: number = 22.0
    collHeight: number = 30.0
    pickSphere: number = 50.0
    crossLand: boolean = true
    useBigTeleporter: boolean = true
    tracker: boolean = true
    canDoubleSelect: boolean = true
    canBeDriven: boolean = true
    costCrystal: number = 5
    invisibleDriver: boolean = true
    drillSound: string = 'DrillSFX_Grinder'
    drillFadeSound: string = 'DrillSFX_GrinderFade'
    upgradeCostOre: number[] = [0, 0, 15, 20]
    upgradeCostStuds: number[] = [0, 0, 3, 4]
    showHealthBar: boolean = true
    engineSound: string = 'SND_LargeEngine'
}

export class LargeCatStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill] (No carry) (Drill???)
    routeSpeed: number[] = [1.50]
    surveyRadius: number[] = []
    trackDist: number = 80.0
    collRadius: number = 22.0
    collHeight: number = 25.0
    pickSphere: number = 50.0
    canBeDriven: boolean = true
    crossWater: boolean = true
    useWaterTeleporter: boolean = true
    classAsLarge: boolean = true
    carryVehicles: boolean = true
    costCrystal: number = 4
    engineSound: string = 'SND_Catamaran'
    showHealthBar: boolean = true
}

export class LargeHeliStats extends VehicleEntityStats {
    routeSpeed: number[] = [0.30, 0.40, 0.50]
    trackDist: number = 80.0
    collRadius: number = 0.0
    collHeight: number = 0.0
    pickSphere: number = 20.0
    showHealthBar: boolean = true
    engineSound: string = 'SND_HeliEngine'
}

export class LargeMlpStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No carry or speed) (Doesn't have drills, just lasers)
    routeSpeed: number[] = [0.40, 0.40, 0.40, 0.40, 0.40, 0.40, 0.40, 0.40]
    surveyRadius: number[] = [0, 0, 0, 0, 5, 5, 5, 5]
    trackDist: number = 80.0
    collRadius: number = 20.0
    collHeight: number = 24.0
    pickSphere: number = 47.0
    crossLand: boolean = true
    useBigTeleporter: boolean = true
    tracker: boolean = true
    canDoubleSelect: boolean = true
    costCrystal: number = 4
    canBeDriven: boolean = true
    invisibleDriver: boolean = true
    upgradeCostOre: number[] = [0, 5, 0, 25]
    upgradeCostStuds: number[] = [0, 1, 0, 5]
    showHealthBar: boolean = true
    engineSound: string = 'SND_LargeEngine'
}

export class BarracksStats extends BuildingEntityStats {
    levels: number = 3
    trackDist: number = 50.0
    collHeight: number = 23.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 15
    costRefinedOre: number = 3
    costCrystal: number = 3
    snaxULike: boolean = true
    trainDriver: boolean[] = [true, true, true]
    crystalDrain: number[] = [1, 1, 1]
    damageCausesCallToArms: boolean = true
    oxygenCoef: number = 10.0
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class PowerStationStats extends BuildingEntityStats {
    levels: number = 2
    trackDist: number = 80.0
    processCrystal: boolean = true
    collHeight: number = 31.0
    collRadius: number = 15.0
    pickSphere: number = 32.0
    costOre: number = 12
    costRefinedOre: number = 3
    costCrystal: number = 2
    powerBuilding: boolean = true
    damageCausesCallToArms: boolean = true
    engineSound: string = 'SND_PowerBuildingHum'
    showHealthBar: boolean = true
}

export class OreRefineryStats extends BuildingEntityStats {
    levels: number = 4
    trackDist: number = 60.0
    processOre: boolean = true
    collHeight: number = 16.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 20
    costRefinedOre: number = 4
    costCrystal: number = 3
    crystalDrain: number[] = [1, 1, 1, 1]
    damageCausesCallToArms: boolean = true
    maxCarry: number[] = [5, 4, 3, 2]
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class TeleportPadStats extends BuildingEntityStats {
    levels: number = 3
    trackDist: number = 60.0
    smallTeleporter: boolean = true
    manTeleporter: boolean = true
    collHeight: number = 20.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 8
    costRefinedOre: number = 2
    crystalDrain: number[] = [1, 1, 1]
    damageCausesCallToArms: boolean = true
    trainPilot: boolean[] = [true, true, true]
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class TeleportBigStats extends BuildingEntityStats {
    levels: number = 2
    trackDist: number = 50.0
    bigTeleporter: boolean = true
    collHeight: number = 17.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 20
    costRefinedOre: number = 4
    costCrystal: number = 2
    crystalDrain: number[] = [1, 1]
    damageCausesCallToArms: boolean = true
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class DocksStats extends BuildingEntityStats {
    levels: number = 1
    trackDist: number = 60.0
    collHeight: number = 20.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 8
    costRefinedOre: number = 2
    costCrystal: number = 1
    waterEntrances: number = 1
    waterTeleporter: boolean = true
    crystalDrain: number = 1
    damageCausesCallToArms: boolean = true
    trainSailor: boolean[] = [true]
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class ToolStationStats extends BuildingEntityStats {
    levels: number = 3
    trackDist: number = 50.0
    manTeleporter: boolean = true
    collHeight: number = 16.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    toolStore: boolean = true
    storeObjects: boolean = true
    selfPowered: boolean = true
    damageCausesCallToArms: boolean = true
    trainDynamite: boolean[] = [false, false, true]
    functionCoef: number[] = [1.0, 1.0, 1.0] // Function here is how long it takes to upgrade a minfigure
    showHealthBar: boolean = true
}

export class GunStationStats extends BuildingEntityStats {
    levels: number = 2
    trackDist: number = 60.0
    collHeight: number = 33.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 15
    costRefinedOre: number = 3
    costCrystal: number = 1
    tracker: boolean = true
    canDoubleSelect: boolean = true
    crystalDrain: number[] = [1, 1]
    damageCausesCallToArms: boolean = true
    functionCoef: number[] = [1.0, 0.5] // How much of a crystal it drains every time it fires...
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class GeodomeStats extends BuildingEntityStats {
    levels: number = 3
    trackDist: number = 50.0
    collHeight: number = 20.0
    collRadius: number = 15.0
    pickSphere: number = 30.0
    costOre: number = 15
    costRefinedOre: number = 3
    costCrystal: number = 3
    surveyRadius: number[] = [6, 8, 12]
    crystalDrain: number[] = [1, 1, 1]
    damageCausesCallToArms: boolean = true
    trainScanner: boolean[] = [true, true, true]
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class UpgradeStats extends BuildingEntityStats {
    levels: number = 2
    trackDist: number = 80.0
    collHeight: number = 40.0
    collRadius: number = 15.0
    pickSphere: number = 32.0
    costOre: number = 20
    costRefinedOre: number = 4
    costCrystal: number = 3
    upgradeBuilding: boolean = true
    crystalDrain: number[] = [1, 1]
    damageCausesCallToArms: boolean = true
    functionCoef: number[] = [0.8, 1.6] // Function is speed of upgrade animation.
    trainRepair: boolean[] = [true, true]
    engineSound: string = 'SND_BuildingHum'
    showHealthBar: boolean = true
}

export class PowerCrystalStats implements ConfigSetFromRecord {
    trackDist: number = 20.0
    collRadius: number = 0
    collHeight: number = 2.0
    pickSphere: number = 6.0

    setFromRecord(cfgValue: CfgEntry): this {
        this.trackDist = cfgValue.getValue('TrackDist').toNumber()
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        return this
    }
}

export class ProcessedOreStats implements ConfigSetFromRecord {
    trackDist: number = 20.0
    collRadius: number = 0
    collHeight: number = 2.0
    pickSphere: number = 8.0

    setFromRecord(cfgValue: CfgEntry): this {
        this.trackDist = cfgValue.getValue('TrackDist').toNumber()
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        return this
    }
}

export class OreStats implements ConfigSetFromRecord {
    trackDist: number = 20.0
    collRadius: number = 0
    collHeight: number = 2.0
    pickSphere: number = 6.0

    setFromRecord(cfgValue: CfgEntry): this {
        this.trackDist = cfgValue.getValue('TrackDist').toNumber()
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        return this
    }
}

export class BoulderStats implements ConfigSetFromRecord {
    collRadius: number = 2.0

    setFromRecord(cfgValue: CfgEntry): this {
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        return this
    }
}

export class PusherStats implements ConfigSetFromRecord {
    collRadius: number = 1.0

    setFromRecord(cfgValue: CfgEntry): this {
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        return this
    }
}

export class FreezerStats implements ConfigSetFromRecord {
    collRadius: number = 1.0

    setFromRecord(cfgValue: CfgEntry): this {
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        return this
    }
}

export class LaserShotStats implements ConfigSetFromRecord {
    collRadius: number = 1.0 // Original game has typo and specifies colRadius instead

    setFromRecord(cfgValue: CfgEntry): this {
        this.collRadius = cfgValue.getValue('CollRadius').toNumber(this.collRadius) // typo in original config ColRadius instead of CollRadius
        return this
    }
}

export class ElectricFenceStats implements ConfigSetFromRecord {
    trackDist: number = 50.0
    collRadius: number = 5.0
    collHeight: number = 18.0
    pickSphere: number = 20.0
    damageCausesCallToArms: boolean = true

    setFromRecord(cfgValue: CfgEntry): this {
        this.trackDist = cfgValue.getValue('TrackDist').toNumber()
        this.collRadius = cfgValue.getValue('CollRadius').toNumber()
        this.collHeight = cfgValue.getValue('CollHeight').toNumber()
        this.pickSphere = cfgValue.getValue('PickSphere').toNumber()
        this.damageCausesCallToArms = cfgValue.getValue('DamageCausesCallToArms').toBoolean()
        return this
    }
}

export class PathStats implements ConfigSetFromRecord {
    costOre: number = 2
    costRefinedOre: number = 1

    setFromRecord(cfgValue: CfgEntry): this {
        this.costOre = cfgValue.getValue('CostOre').toNumber()
        this.costRefinedOre = cfgValue.getValue('CostRefinedOre').toNumber()
        return this
    }
}

export class GameStatsCfg implements ConfigSetFromRecord {
    pilot = new PilotStats()
    rockMonster = new RockMonsterStats()
    smallSpider = new SmallSpiderStats()
    bat = new BatStats()
    tinyRM = new TinyRMStats()
    tinyIM = new TinyIMStats()
    slug = new SlugStats()
    lavaMonster = new LavaMonsterStats()
    iceMonster = new IceMonsterStats()
    hoverboard = new HoverboardStats()
    smallHeli = new SmallHeliStats()
    smallMlp = new SmallMlpStats()
    smallCat = new SmallCatStats()
    smallDigger = new SmallDiggerStats()
    smallTruck = new SmallTruckStats()
    bulldozer = new BulldozerStats()
    walkerDigger = new WalkerDiggerStats()
    largeDigger = new LargeDiggerStats()
    largeCat = new LargeCatStats()
    largeHeli = new LargeHeliStats()
    largeMlp = new LargeMlpStats()
    barracks = new BarracksStats()
    powerStation = new PowerStationStats()
    oreRefinery = new OreRefineryStats()
    teleportPad = new TeleportPadStats()
    teleportBig = new TeleportBigStats()
    docks = new DocksStats()
    toolStation = new ToolStationStats()
    gunStation = new GunStationStats()
    geoDome = new GeodomeStats()
    upgrade = new UpgradeStats()
    powerCrystal = new PowerCrystalStats()
    processedOre = new ProcessedOreStats()
    ore = new OreStats()
    boulder = new BoulderStats()
    pusher = new PusherStats()
    freezer = new FreezerStats()
    laserShot = new LaserShotStats()
    electricFence = new ElectricFenceStats()
    path = new PathStats()

    setFromRecord(cfgValue: CfgEntry): this {
        this.pilot.setFromRecord(cfgValue.getRecord('Pilot'))
        this.rockMonster.setFromRecord(cfgValue.getRecord('RockMonster'))
        this.smallSpider.setFromRecord(cfgValue.getRecord('SmallSpider'))
        this.bat.setFromRecord(cfgValue.getRecord('Bat'))
        this.tinyRM.setFromRecord(cfgValue.getRecord('TinyRM'))
        this.tinyIM.setFromRecord(cfgValue.getRecord('TinyIM'))
        this.slug.setFromRecord(cfgValue.getRecord('Slug'))
        this.lavaMonster.setFromRecord(cfgValue.getRecord('LavaMonster'))
        this.iceMonster.setFromRecord(cfgValue.getRecord('IceMonster'))
        this.hoverboard.setFromRecord(cfgValue.getRecord('Hoverboard'))
        this.smallHeli.setFromRecord(cfgValue.getRecord('SmallHeli'))
        this.smallMlp.setFromRecord(cfgValue.getRecord('SmallMlp'))
        this.smallCat.setFromRecord(cfgValue.getRecord('SmallCat'))
        this.smallDigger.setFromRecord(cfgValue.getRecord('SmallDigger'))
        this.smallTruck.setFromRecord(cfgValue.getRecord('SmallTruck'))
        this.bulldozer.setFromRecord(cfgValue.getRecord('Bulldozer'))
        this.walkerDigger.setFromRecord(cfgValue.getRecord('WalkerDigger'))
        this.largeDigger.setFromRecord(cfgValue.getRecord('LargeDigger'))
        this.largeCat.setFromRecord(cfgValue.getRecord('LargeCat'))
        this.largeHeli.setFromRecord(cfgValue.getRecord('LargeHeli'))
        this.largeMlp.setFromRecord(cfgValue.getRecord('LargeMlp'))
        this.barracks.setFromRecord(cfgValue.getRecord('Barracks'))
        this.powerStation.setFromRecord(cfgValue.getRecord('PowerStation'))
        this.oreRefinery.setFromRecord(cfgValue.getRecord('OreRefinery'))
        this.teleportPad.setFromRecord(cfgValue.getRecord('TeleportPad'))
        this.teleportBig.setFromRecord(cfgValue.getRecord('TeleportBig'))
        this.docks.setFromRecord(cfgValue.getRecord('Docks'))
        this.toolStation.setFromRecord(cfgValue.getRecord('ToolStation'))
        this.gunStation.setFromRecord(cfgValue.getRecord('GunStation'))
        this.geoDome.setFromRecord(cfgValue.getRecord('Geo-Dome'))
        this.upgrade.setFromRecord(cfgValue.getRecord('Upgrade'))
        this.powerCrystal.setFromRecord(cfgValue.getRecord('PowerCrystal'))
        this.processedOre.setFromRecord(cfgValue.getRecord('ProcessedOre'))
        this.ore.setFromRecord(cfgValue.getRecord('Ore'))
        this.boulder.setFromRecord(cfgValue.getRecord('Boulder'))
        this.pusher.setFromRecord(cfgValue.getRecord('Pusher'))
        this.freezer.setFromRecord(cfgValue.getRecord('Freezer'))
        this.laserShot.setFromRecord(cfgValue.getRecord('LaserShot'))
        this.electricFence.setFromRecord(cfgValue.getRecord('ElectricFence'))
        this.path.setFromRecord(cfgValue.getRecord('Path'))
        return this
    }
}
