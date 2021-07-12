// noinspection JSUnusedGlobalSymbols

import { BaseConfig } from './BaseConfig'
import { BuildingEntityStats } from './BuildingEntityStats'
import { VehicleEntityStats } from './VehicleEntityStats'

export class GameStatsCfg extends BaseConfig {

    Pilot = new class PilotStats extends BaseConfig {
        Levels: number = 4
        RouteSpeed: number[] = [1.10, 1.10, 1.10, 1.10]
        SoilDrillTime: number[] = [4.0, 4.0, 4.0, 4.0] // Time in seconds to drill through the rock.
        LooseDrillTime: number[] = [4.0, 4.0, 4.0, 4.0]
        MedDrillTime: number[] = [8.0, 8.0, 8.0, 8.0]
        HardDrillTime: number[] = [0.0, 0.0, 0.0, 0.0] // Zero means the object cannot drill the rock type
        SeamDrillTime: number[] = [10.0, 10.0, 10.0, 10.0] // Either or both ore or crystal.
        UpgradeTime: number[] = [30.0, 45.0, 60.0, 60.0] // Last entry is ignored as it can never upgrade from that.
        CollRadius: number = 5.0
        CollHeight: number = 12.0
        TrackDist: number = 40.0
        SingleWidthDig: boolean[] = [true, true, true, true]
        PickSphere: number = 10.0
        RepairValue: number[] = [10.0, 15.0, 20.0, 25.0]
        SurveyRadius: number[] = [3, 3, 3, 3]
        Drillsound: string = 'SND_pilotdrill'
        Drillfadesound: string = 'SND_pilotdrillfade'
        RestPercent: number = 60.0
        EnergyDecayRate: number = 0.25
        CanClearRubble: boolean = true
        NumOfToolsCanCarry: number[] = [2, 3, 4, 5]
        CrossLand: boolean = true
        RubbleCoef: number = 0.5
        PathCoef: number = 2.0
        RouteAvoidance: boolean = true
        UseLegoManTeleporter: boolean = true
        AwarenessRange: number = 10.0
        OxygenCoef: number = -1.0
        CanStrafe: boolean = true
        EnterToolStore: boolean = true
        ShowHealthBar: boolean = true
    }

    RockMonster = new class RockMonsterStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number = 0.8
        TrackDist: number = 50.0
        CollRadius: number = 10.0
        CollHeight: number = 22.0
        AlertRadius: number = 60.0
        HealthDecayRate: number = 0.6 // Reduce health by 'n' every second.
        PickSphere: number = 22.0
        RepairValue: number = -10.0
        CanScare: boolean = true
        RestPercent: number = 20.0
        CarryMinHealth: number = 15.0
        PainThreshold: number = 20.0
        StampRadius: number = 80.0
        AttackRadius: number = 160.0
        CanSteal: boolean = true
        CrossLand: boolean = true
        RubbleCoef: number = 1.5
        GrabMinifigure: boolean = true
        RouteAvoidance: boolean = true
        BumpDamage: boolean = true
        AttackPaths: boolean = true
        SplitOnZeroHealth: boolean = true
        CanBeHitByFence: boolean = true
        Capacity: number = 6 // How many crystals it can eat
        PathCoef: number = 0.5
        // Statistics about the weapons
        CanBeShotAt: boolean = true // Can this monster be shot at by lego men
        CanFreeze: boolean = true // Can this object be frozen
        FreezerTime: number = 25.0 // Time this object is frozen for
        FreezerDamage: number = 5.0 // Damage that freezing causes
        CanLaser: boolean = true // Can this object be lasered
        LaserDamage: number = 110.0 // Damage sustained by a laser
        CanPush: boolean = true // Can this object be pusher'ed
        PusherDist: number = 20.0 // Distance the object is pushed 40=1 block
        PusherDamage: number = 2.0 // Damage that the pusher gun causes
        WakeRadius: number = 25.0
        ScaredByBigBangs: boolean = true
        RemoveReinforcement: boolean = true
        ShowHealthBar: boolean = true
    }

    SmallSpider = new class SmallSpiderStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number[] = [2.0]
        TrackDist: number = 10.0
        CollRadius: number = 0.0
        CollHeight: number = 0.0
        PickSphere: number = 6.0
        AlertRadius: number = 40.0
        RandomMove: boolean = true
        RandomEnterWall: boolean = true
        CauseSlip: boolean = true
        CrossLand: boolean = true
        RubbleCoef: number = 0.2
        DontShowDamage: boolean = true
        DontShowOnRadar: boolean = true
        ScaredByBigBangs: boolean = true
    }

    Bat = new class BatStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number[] = [1.0]
        TrackDist: number = 10.0
        CollRadius: number = 10.0
        AlertRadius: number = 10.0 // Alert radius (causes attack mode)
        RandomMove: boolean = true // Random movement
        randomMoveTime: number = 10
        CanScare: boolean = true // Scare away the player
        ScaredByBigBangs: boolean = true
        // Flock parameters.
        Flocks: boolean = true // Set this to create a flock for this object.
        FlocksDebug: boolean = false // If this is set the actual lego objects animation is displayed at the "lego" position.
        FlocksSmooth: boolean = true // Smooths out the orientation of the flocks elements.
        FlocksSize: number = 8 // Number of the given item in the flock.  (Default 5)
        FlocksTurn: number = 0.6 // Turning speed of the bat. (0.6 default)
        FlocksSpeed: number = 1.5 // Velocity of the flock. (2.0 default)
        FlocksTightness: number = 0.8 // Tightness of the flock. (2.0 default)
        FlocksGoalUpdate: number = 2.0 // How often the flocks goal is updated (25 per second).  (2.0 default)
        FlocksRandomness: number = 6.0 // Randomness of goals. (2.0 default)
        FlocksHeight: number = 22.0 // Height above the ground of the flock elements.  (30.0 default)
        CrossLand: boolean = true
        CrossWater: boolean = true
        CrossLava: boolean = true
        DontShowDamage: boolean = true
    }

    TinyRM = new class TinyRMStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number = 1.2
        TrackDist: number = 10.0
        CollRadius: number = 0.0
        CollHeight: number = 5.0
        PickSphere: number = 6.0
        AlertRadius: number = 40.0
        CrossLand: boolean = true
        RubbleCoef: number = 1.5
        DontShowDamage: boolean = true
        DontShowOnRadar: boolean = true
        ScaredByPlayer: boolean = true
        ScaredByBigBangs: boolean = true
    }

    TinyIM = new class TinyIMStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number = 1.2
        TrackDist: number = 10.0
        CollRadius: number = 0.0
        CollHeight: number = 5.0
        PickSphere: number = 6.0
        AlertRadius: number = 40.0
        CrossLand: boolean = true
        RubbleCoef: number = 1.5
        DontShowDamage: boolean = true
        DontShowOnRadar: boolean = true
        ScaredByPlayer: boolean = true
        ScaredByBigBangs: boolean = true
    }

    Slug = new class SlugStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number = 0.3
        TrackDist: number = 10.0
        CollRadius: number = 3.0
        CollHeight: number = 7.0
        PickSphere: number = 12.0
        AlertRadius: number = 40.0
        CrossLand: boolean = true
        RubbleCoef: number = 0.3
        UseHoles: boolean = true
        DrainPower: boolean = true
        AttackRadius: number = 280.0
        PainThreshold: number = 50.0
        CanBeShotAt: boolean = true
        CanLaser: boolean = true
        LaserDamage: number = 5.0
        CanPush: boolean = true // Can this object be pusher'ed
        PusherDist: number = 60.0 // Distance the object is pushed
        PusherDamage: number = 5.0 // Damage that the pusher gun causes
        ShowHealthBar: boolean = true
        ScaredByBigBangs: boolean = true
    }

    LavaMonster = new class LavaMonsterStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number = 0.8
        TrackDist: number = 50.0
        CollRadius: number = 10.0
        CollHeight: number = 22.0
        AlertRadius: number = 60.0
        HealthDecayRate: number = 0.6 // Reduce health by 'n' every second.
        PickSphere: number = 22.0
        RepairValue: number = -10.0
        CanScare: boolean = true
        RestPercent: number = 20.0
        CarryMinHealth: number = 15.0
        PainThreshold: number = 20.0
        StampRadius: number = 80.0
        AttackRadius: number = 160.0
        CanSteal: boolean = true
        CrossLand: boolean = true
        RubbleCoef: number = 1.5
        GrabMinifigure: boolean = true
        Capacity: number = 7 // How many crystals it can eat
        RouteAvoidance: boolean = true
        BumpDamage: boolean = true
        AttackPaths: boolean = true
        SplitOnZeroHealth: boolean = true
        CanBeHitByFence: boolean = true
        PathCoef: number = 0.5
        CrossLava: boolean = true
        // Statistics about the weapons
        CanBeShotAt: boolean = true // Can this monster be shot at by lego men
        CanFreeze: boolean = true // Can this object be frozen
        FreezerTime: number = 75.0 // Time this object is frozen for
        FreezerDamage: number = 40.0 // Damage that freezing causes
        CanLaser: boolean = true // Can this object be lasered
        LaserDamage: number = 1.0 // Damage sustained by a laser
        CanPush: boolean = true // Can this object be pusher'ed
        PusherDist: number = 60.0 // Distance the object is pushed
        PusherDamage: number = 5.0 // Damage that the pusher gun causes
        WakeRadius: number = 25.0
        ScaredByBigBangs: boolean = true
        RemoveReinforcement: boolean = true
        ShowHealthBar: boolean = true
    }

    IceMonster = new class IceMonsterStats extends BaseConfig {
        Levels: number = 1
        RouteSpeed: number = 0.8
        TrackDist: number = 50.0
        CollRadius: number = 10.0
        CollHeight: number = 22.0
        AlertRadius: number = 60.0
        HealthDecayRate: number = 0.6 // Reduce health by 'n' every second.
        PickSphere: number = 22.0
        RepairValue: number = -10.0
        CanScare: boolean = true
        RestPercent: number = 20.0
        CarryMinHealth: number = 15.0
        PainThreshold: number = 20.0
        StampRadius: number = 80.0
        AttackRadius: number = 120.0
        CanSteal: boolean = true
        CrossLand: boolean = true
        RubbleCoef: number = 1.5
        GrabMinifigure: boolean = true
        Capacity: number = 5 // How many crystals it can eat
        RouteAvoidance: boolean = true
        BumpDamage: boolean = true
        AttackPaths: boolean = true
        SplitOnZeroHealth: boolean = true
        CanBeHitByFence: boolean = true
        PathCoef: number = 0.5
        // Statistics about the weapons
        CanBeShotAt: boolean = true // Can this monster be shot at by lego men
        CanFreeze: boolean = false // Can this object be frozen
        FreezerTime: number = 0.0 // Time this object is frozen for
        FreezerDamage: number = 0.0 // Damage that freezing causes
        CanLaser: boolean = true // Can this object be lasered
        LaserDamage: number = 110.0 // Damage sustained by a laser
        CanPush: boolean = true // Can this object be pusher'ed
        PusherDist: number = 60.0 // Distance the object is pushed
        PusherDamage: number = 2.0 // Damage that the pusher gun causes
        WakeRadius: number = 25.0
        ScaredByBigBangs: boolean = true
        RemoveReinforcement: boolean = true
        ShowHealthBar: boolean = true
    }

    Hoverboard = new class HoverboardStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No drill or carry)
        Levels: number = 8
        RouteSpeed: number[] = [3.0, 3.0, 5.0, 5.0, 3.0, 3.0, 5.0, 5.0]
        SurveyRadius: number[] = [0, 0, 0, 0, 4, 4, 4, 4]
        TrackDist: number = 50.0
        CollRadius: number = 8.0
        CollHeight: number = 12.0
        PickSphere: number = 16.0
        CanBeDriven: boolean = true
        CrossLand: boolean = true
        UseSmallTeleporter: boolean = true
        CanStrafe: boolean = true
        CostCrystal: number = 1
        UpgradeCostOre: number[] = [0, 5, 10, 0]
        UpgradeCostStuds: number[] = [0, 1, 2, 0]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_SmallEngine'
    }

    SmallHeli = new class SmallHeliStats extends VehicleEntityStats {
        Levels: number = 1
        RouteSpeed: number = 2.50
        TrackDist: number = 50.0
        CollRadius: number = 10.0
        CollHeight: number = 12.0
        PickSphere: number = 20.0
        CanBeDriven: boolean = true
        CrossLand: boolean = true
        CrossWater: boolean = true
        CrossLava: boolean = true
        UseSmallTeleporter: boolean = true
        CanStrafe: boolean = true
        CostCrystal: number = 3
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_HeliEngine'
    }

    Smallmlp = new class SmallmlpStats extends VehicleEntityStats {
        Levels: number = 4
        RouteSpeed: number[] = [0.50, 0.50, 0.50, 0.50]
        TrackDist: number = 50.0
        CollRadius: number = 12.0
        CollHeight: number = 22.0
        PickSphere: number = 26.0
        CanBeDriven: boolean = true
        CrossLand: boolean = true
        UseSmallTeleporter: boolean = true
        Tracker: boolean = true
        CanDoubleSelect: boolean = true
        CostCrystal: number = 3
        UpgradeCostOre: number[] = [0, 0, 0, 10]
        UpgradeCostStuds: number[] = [0, 0, 0, 2]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_MediumEngine'
    }

    SmallCat = new class SmallCatStats extends VehicleEntityStats {
        Levels: number = 3
        RouteSpeed: number[] = [2.0, 3.0, 4.0]
        TrackDist: number = 50.0
        CollRadius: number = 12.0
        CollHeight: number = 12.0
        PickSphere: number = 26.0
        CrossWater: boolean = true
        CanBeDriven: boolean = true
        UseWaterTeleporter: boolean = true
        CostCrystal: number = 2
        MaxCarry: number[] = [1, 1, 1]
        GetInAtLand: boolean = true
        GetOutAtLand: boolean = true
        TakeCarryingDrivers: boolean = true
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_Catamaran'
    }

    SmallDigger = new class SmallDiggerStats extends VehicleEntityStats {
        Levels: number = 8
        RouteSpeed: number[] = [2.0, 2.0, 4.0, 4.0, 2.0, 2.0, 4.0, 4.0]
        SoilDrillTime: number[] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        LooseDrillTime: number[] = [2.0, 1.0, 2.0, 1.0, 2.0, 1.0, 2.0, 1.0]
        MedDrillTime: number[] = [4.0, 2.0, 4.0, 2.0, 4.0, 2.0, 4.0, 2.0]
        HardDrillTime: number[] = [180.0, 150.0, 180.0, 150.0, 180.0, 150.0, 180.0, 150.0]
        SeamDrillTime: number[] = [8.0, 4.0, 8.0, 4.0, 8.0, 4.0, 8.0, 4.0]
        MaxCarry: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
        SurveyRadius: number[] = [0, 0, 0, 0, 4, 4, 4, 4]
        TrackDist: number = 50.0
        CollRadius: number = 10.0
        CollHeight: number = 12.0
        PickSphere: number = 20.0
        CanBeDriven: boolean = true
        CrossLand: boolean = true
        RouteAvoidance: boolean = true
        UseSmallTeleporter: boolean = true
        VehicleCanBeCarried: boolean = true
        CostCrystal: number = 1
        UpgradeCostOre: number[] = [0, 5, 10, 10]
        UpgradeCostStuds: number[] = [0, 1, 2, 2]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_SmallEngine'
    }

    SmallTruck = new class SmallTruckStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No drill)
        Levels: number = 16
        RouteSpeed: number[] = [2.0, 2.0, 3.0, 3.0, 2.0, 2.0, 3.0, 3.0, 2.0, 2.0, 3.0, 3.0, 2.0, 2.0, 3.0, 3.0]
        MaxCarry: number[] = [3, 3, 3, 3, 3, 3, 3, 3, 6, 6, 6, 6, 6, 6, 6, 6]
        CarryStart: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3]
        SurveyRadius: number[] = [0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 4, 4, 4, 4]
        TrackDist: number = 50.0
        CollRadius: number = 10.0
        CollHeight: number = 12.0
        PickSphere: number = 20.0
        CanBeDriven: boolean = true
        CrossLand: boolean = true
        UseSmallTeleporter: boolean = true
        VehicleCanBeCarried: boolean = true
        CostCrystal: number = 2
        EnterToolStore: boolean = true
        UpgradeCostOre: number[] = [5, 5, 10, 0]
        UpgradeCostStuds: number[] = [1, 1, 2, 0]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_SmallEngine'
    }

    Bulldozer = new class BulldozerStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No drill)
        Levels: number = 16
        RouteSpeed: number[] = [0.5, 0.5, 0.8, 0.8, 0.5, 0.5, 0.8, 0.8, 0.5, 0.5, 0.8, 0.8, 0.5, 0.5, 0.8, 0.8]
        MaxCarry: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2]
        SurveyRadius: number[] = [0, 0, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 5]
        TrackDist: number = 80.0
        CollRadius: number = 18.0
        CollHeight: number = 26.0
        PickSphere: number = 40.0
        CrossLand: boolean = true
        CanClearRubble: boolean = true
        UseBigTeleporter: boolean = true
        CanBeDriven: boolean = true
        CostCrystal: number = 4
        InvisibleDriver: boolean = true
        UpgradeCostOre: number[] = [5, 5, 20, 0]
        UpgradeCostStuds: number[] = [1, 1, 4, 0]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_MediumEngine'
    }

    WalkerDigger = new class WalkerDiggerStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No carry)
        Levels: number = 8
        RouteSpeed: number[] = [0.50, 0.50, 0.80, 0.80, 0.50, 0.50, 0.80, 0.80]
        SoilDrillTime: number[] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
        LooseDrillTime: number[] = [0.80, 0.40, 0.80, 0.40, 0.80, 0.40, 0.80, 0.40]
        MedDrillTime: number[] = [2.0, 1.0, 2.0, 1.0, 2.0, 1.0, 2.0, 1.0]
        HardDrillTime: number[] = [180.0, 150.0, 180.0, 150.0, 180.0, 150.0, 180.0, 150.0]
        SeamDrillTime: number[] = [4.0, 2.0, 4.0, 2.0, 4.0, 2.0, 4.0, 2.0]
        SurveyRadius: number[] = [0, 0, 0, 0, 5, 5, 5, 5]
        TrackDist: number = 80.0
        CollRadius: number = 15.0
        CollHeight: number = 33.0
        PickSphere: number = 35.0
        CrossLand: boolean = true
        UseBigTeleporter: boolean = true
        CostCrystal: number = 3
        CanBeDriven: boolean = true
        InvisibleDriver: boolean = true
        CanStrafe: boolean = true
        DrillSound: string = 'DrillSFX_Grinder'
        DrillFadeSound: string = 'DrillSFX_GrinderFade'
        UpgradeCostOre: number[] = [0, 5, 20, 20]
        UpgradeCostStuds: number[] = [0, 1, 4, 4]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_MediumEngine'
    }

    LargeDigger = new class LargeDiggerStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No carry or scan)
        Levels: number = 4
        RouteSpeed: number[] = [0.30, 0.30, 0.60, 0.60]
        SoilDrillTime: number[] = [1.0, 1.0, 1.0, 1.0]
        LooseDrillTime: number[] = [0.40, 0.20, 0.40, 0.20]
        MedDrillTime: number[] = [0.80, 0.40, 0.80, 0.40]
        HardDrillTime: number[] = [1.0, 0.50, 1.0, 0.50]
        SeamDrillTime: number[] = [1.0, 0.50, 1.0, 0.50]
        TrackDist: number = 80.0
        CollRadius: number = 22.0
        CollHeight: number = 30.0
        PickSphere: number = 50.0
        CrossLand: boolean = true
        UseBigTeleporter: boolean = true
        Tracker: boolean = true
        CanDoubleSelect: boolean = true
        CanBeDriven: boolean = true
        CostCrystal: number = 5
        InvisibleDriver: boolean = true
        DrillSound: string = 'DrillSFX_Grinder'
        DrillFadeSound: string = 'DrillSFX_GrinderFade'
        UpgradeCostOre: number[] = [0, 0, 15, 20]
        UpgradeCostStuds: number[] = [0, 0, 3, 4]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_LargeEngine'
    }

    LargeCat = new class LargeCatStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill] (No carry) (Drill???)
        Levels: number = 1
        RouteSpeed: number = 1.50
        SurveyRadius: number = 0
        TrackDist: number = 80.0
        CollRadius: number = 22.0
        CollHeight: number = 25.0
        PickSphere: number = 50.0
        CanBeDriven: boolean = true
        CrossWater: boolean = true
        UseWaterTeleporter: boolean = true
        ClassAsLarge: boolean = true
        CarryVehicles: boolean = true
        CostCrystal: number = 4
        EngineSound: string = 'SND_Catamaran'
        ShowHealthBar: boolean = true
    }

    LargeHeli = new class LargeHeliStats extends VehicleEntityStats {
        Levels: number = 3
        RouteSpeed: number[] = [0.30, 0.40, 0.50]
        TrackDist: number = 80.0
        CollRadius: number = 0.0
        CollHeight: number = 0.0
        PickSphere: number = 20.0
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_HeliEngine'
    }

    LargeMLP = new class LargeMLPStats extends VehicleEntityStats { // [Carry][Scan][Speed][Drill]    (No carry or speed) (Doesn't have drills, just lasers)
        Levels: number = 8
        RouteSpeed: number[] = [0.40, 0.40, 0.40, 0.40, 0.40, 0.40, 0.40, 0.40]
        SurveyRadius: number[] = [0, 0, 0, 0, 5, 5, 5, 5]
        TrackDist: number = 80.0
        CollRadius: number = 20.0
        CollHeight: number = 24.0
        PickSphere: number = 47.0
        CrossLand: boolean = true
        UseBigTeleporter: boolean = true
        Tracker: boolean = true
        CanDoubleSelect: boolean = true
        CostCrystal: number = 4
        CanBeDriven: boolean = true
        InvisibleDriver: boolean = true
        UpgradeCostOre: number[] = [0, 5, 0, 25]
        UpgradeCostStuds: number[] = [0, 1, 0, 5]
        ShowHealthBar: boolean = true
        EngineSound: string = 'SND_LargeEngine'
    }

    Barracks = new class BarracksStats extends BuildingEntityStats {
        Levels: number = 3
        TrackDist: number = 50.0
        CollHeight: number = 23.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 15
        CostRefinedOre: number = 3
        CostCrystal: number = 3
        SnaxULike: boolean = true
        TrainDriver: boolean[] = [true, true, true]
        CrystalDrain: number[] = [1, 1, 1]
        DamageCausesCallToArms: boolean = true
        OxygenCoef: number = 10.0
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    Powerstation = new class PowerstationStats extends BuildingEntityStats {
        Levels: number = 2
        TrackDist: number = 80.0
        ProcessCrystal: boolean = true
        CollHeight: number = 31.0
        CollRadius: number = 15.0
        PickSphere: number = 32.0
        CostOre: number = 12
        CostRefinedOre: number = 3
        CostCrystal: number = 2
        PowerBuilding: boolean = true
        DamageCausesCallToArms: boolean = true
        EngineSound: string = 'SND_PowerBuildingHum'
        ShowHealthBar: boolean = true
    }

    OreRefinery = new class OreRefineryStats extends BuildingEntityStats {
        Levels: number = 4
        TrackDist: number = 60.0
        ProcessOre: boolean = true
        CollHeight: number = 16.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 20
        CostRefinedOre: number = 4
        CostCrystal: number = 3
        CrystalDrain: number[] = [1, 1, 1, 1]
        DamageCausesCallToArms: boolean = true
        MaxCarry: number[] = [5, 4, 3, 2]
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    TeleportPad = new class TeleportPadStats extends BuildingEntityStats {
        Levels: number = 3
        TrackDist: number = 60.0
        SmallTeleporter: boolean = true
        ManTeleporter: boolean = true
        CollHeight: number = 20.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 8
        CostRefinedOre: number = 2
        CrystalDrain: number[] = [1, 1, 1]
        DamageCausesCallToArms: boolean = true
        TrainPilot: boolean[] = [true, true, true]
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    TeleportBIG = new class TeleportBIGStats extends BuildingEntityStats {
        Levels: number = 2
        TrackDist: number = 50.0
        BigTeleporter: boolean = true
        CollHeight: number = 17.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 20
        CostRefinedOre: number = 4
        CostCrystal: number = 2
        CrystalDrain: number[] = [1, 1]
        DamageCausesCallToArms: boolean = true
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    Docks = new class DocksStats extends BuildingEntityStats {
        Levels: number = 1
        TrackDist: number = 60.0
        CollHeight: number = 20.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 8
        CostRefinedOre: number = 2
        CostCrystal: number = 1
        WaterEntrances: number = 1
        WaterTeleporter: boolean = true
        CrystalDrain: number = 1
        DamageCausesCallToArms: boolean = true
        TrainSailor: boolean = true
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    Toolstation = new class ToolstationStats extends BuildingEntityStats {
        Levels: number = 3
        TrackDist: number = 50.0
        ManTeleporter: boolean = true
        CollHeight: number = 16.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        ToolStore: boolean = true
        StoreObjects: boolean = true
        SelfPowered: boolean = true
        DamageCausesCallToArms: boolean = true
        TrainDynamite: boolean[] = [false, false, true]
        FunctionCoef: number[] = [1.0, 1.0, 1.0] // Function here is how long it takes to upgrade a minfigure
        ShowHealthBar: boolean = true
    }

    GunStation = new class GunStationStats extends BuildingEntityStats {
        Levels: number = 2
        TrackDist: number = 60.0
        CollHeight: number = 33.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 15
        CostRefinedOre: number = 3
        CostCrystal: number = 1
        Tracker: boolean = true
        CanDoubleSelect: boolean = true
        CrystalDrain: number[] = [1, 1]
        DamageCausesCallToArms: boolean = true
        FunctionCoef: number[] = [1.0, 0.5] // How much of a crystal it drains every time it fires...
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    Geodome = new class GeodomeStats extends BuildingEntityStats {
        Levels: number = 3
        TrackDist: number = 50.0
        CollHeight: number = 20.0
        CollRadius: number = 15.0
        PickSphere: number = 30.0
        CostOre: number = 15
        CostRefinedOre: number = 3
        CostCrystal: number = 3
        SurveyRadius: number[] = [6, 8, 12]
        CrystalDrain: number[] = [1, 1, 1]
        DamageCausesCallToArms: boolean = true
        TrainScanner: boolean[] = [true, true, true]
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    Upgrade = new class UpgradeStats extends BuildingEntityStats {
        Levels: number = 2
        TrackDist: number = 80.0
        CollHeight: number = 40.0
        CollRadius: number = 15.0
        PickSphere: number = 32.0
        CostOre: number = 20
        CostRefinedOre: number = 4
        CostCrystal: number = 3
        UpgradeBuilding: boolean = true
        CrystalDrain: number[] = [1, 1]
        DamageCausesCallToArms: boolean = true
        FunctionCoef: number[] = [0.8, 1.6] // Function is speed of upgrade animation.
        TrainRepair: boolean[] = [true, true]
        EngineSound: string = 'SND_BuildingHum'
        ShowHealthBar: boolean = true
    }

    PowerCrystal = new class PowerCrystalStats extends BaseConfig {
        Levels: number = 1
        TrackDist: number = 20.0
        CollHeight: number = 2.0
        PickSphere: number = 6.0
    }

    ProcessedOre = new class ProcessedOreStats extends BaseConfig {
        Levels: number = 1
        TrackDist: number = 20.0
        CollHeight: number = 2.0
        PickSphere: number = 8.0
    }

    Ore = new class OreStats extends BaseConfig {
        Levels: number = 1
        TrackDist: number = 20.0
        CollHeight: number = 2.0
        PickSphere: number = 6.0
    }

    Boulder = new class BoulderStats extends BaseConfig {
        Levels: number = 1
        CollRadius: number = 2.0
    }

    Pusher = new class PusherStats extends BaseConfig {
        Levels: number = 1
        CollRadius: number = 1.0
    }

    Freezer = new class FreezerStats extends BaseConfig {
        Levels: number = 1
        CollRadius: number = 1.0
    }

    LaserShot = new class LaserShotStats extends BaseConfig {
        Levels: number = 1
        ColRadius: number = 1.0
    }

    ElectricFence = new class ElectricFenceStats extends BaseConfig {
        Levels: number = 1
        TrackDist: number = 50.0
        CollRadius: number = 5.0
        CollHeight: number = 18.0
        PickSphere: number = 20.0
        DamageCausesCallToArms: boolean = true
    }

    Path = new class PathStats extends BaseConfig {
        Levels: number = 1
        CostOre: number = 2
        CostRefinedOre: number = 1
    }

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (objKey.toLowerCase() === lCfgKeyName) {
            BaseConfig.setFromCfg(this[objKey], cfgValue)
            return true
        }
    }

}

