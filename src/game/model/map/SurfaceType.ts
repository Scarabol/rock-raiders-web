import { Cursor } from '../../../screen/Cursor'

export class SurfaceType {

    name: string // human readable, maybe used as label later on
    shaping: boolean = false
    matIndex: string = '00'
    floor: boolean = false
    selectable: boolean = false
    drillable: boolean = false
    drillableHard: boolean = false
    explodable: boolean = false
    reinforcable: boolean = false
    cursor: Cursor = Cursor.Pointer_Standard
    statsDrillName: string = null
    canCarryFence: boolean = false

    constructor(options: Partial<SurfaceType> = {}) {
        Object.assign(this, options)
    }

    static readonly GROUND = new SurfaceType({
        name: 'ground',
        floor: true,
        selectable: true,
        canCarryFence: true,
    })
    static readonly SOLID_ROCK = new SurfaceType({
        name: 'solid rock',
        shaping: true,
        matIndex: '5',
        cursor: Cursor.Pointer_SurfaceType_Immovable,
    })
    static readonly HARD_ROCK = new SurfaceType({
        name: 'hard rock',
        shaping: true,
        matIndex: '4',
        selectable: true,
        drillableHard: true,
        explodable: true,
        reinforcable: true,
        cursor: Cursor.Pointer_SurfaceType_Hard,
        statsDrillName: 'HardDrillTime',
    })
    static readonly LOOSE_ROCK = new SurfaceType({
        name: 'loose rock',
        shaping: true,
        matIndex: '3',
        selectable: true,
        drillable: true,
        drillableHard: true,
        explodable: true,
        reinforcable: true,
        cursor: Cursor.Pointer_SurfaceType_Medium,
        statsDrillName: 'LooseDrillTime',
    })
    static readonly DIRT = new SurfaceType({
        name: 'dirt',
        shaping: true,
        matIndex: '2',
        selectable: true,
        drillable: true,
        drillableHard: true,
        explodable: true,
        reinforcable: true,
        cursor: Cursor.Pointer_SurfaceType_Loose,
        statsDrillName: 'SoilDrillTime',
    })
    static readonly SLUG_HOLE = new SurfaceType({name: 'slug hole', floor: true, matIndex: '30'})
    static readonly LAVA = new SurfaceType({name: 'lava', floor: true, matIndex: '46'})
    static readonly ORE_SEAM = new SurfaceType({
        name: 'ore seam',
        matIndex: '40',
        selectable: true,
        drillable: true,
        drillableHard: true,
        explodable: true,
        reinforcable: true,
        cursor: Cursor.Pointer_SurfaceType_OreSeam,
        statsDrillName: 'SeamDrillTime',
    })
    static readonly WATER = new SurfaceType({name: 'water', floor: true, matIndex: '45'})
    static readonly CRYSTAL_SEAM = new SurfaceType({
        name: 'energy crystal seam',
        matIndex: '20',
        selectable: true,
        drillable: true,
        drillableHard: true,
        explodable: true,
        reinforcable: true,
        cursor: Cursor.Pointer_SurfaceType_CrystalSeam,
        statsDrillName: 'SeamDrillTime',
    })
    static readonly RECHARGE_SEAM = new SurfaceType({
        name: 'recharge seam',
        matIndex: '67',
        cursor: Cursor.Pointer_SurfaceType_RechargeSeam,
    })
    static readonly POWER_PATH = new SurfaceType({
        name: 'power path all',
        floor: true,
        matIndex: '60',
        selectable: true,
        canCarryFence: true,
    })
    static readonly POWER_PATH_BUILDING_SITE = new SurfaceType({
        name: 'power path building site',
        floor: true,
        matIndex: '61',
        selectable: true,
        canCarryFence: true,
    })
    static readonly POWER_PATH_BUILDING = new SurfaceType({
        name: 'power path building',
        floor: true,
        matIndex: '76',
    })
    static readonly POWER_PATH_CONSTRUCTION = new SurfaceType({
        name: 'power path construction',
        floor: true,
        matIndex: '76',
        selectable: true
    })
    static readonly RUBBLE1 = new SurfaceType({
        name: 'rubble 1',
        floor: true,
        matIndex: '13',
        selectable: true,
        canCarryFence: true,
    })
    static readonly RUBBLE2 = new SurfaceType({
        name: 'rubble 2',
        floor: true,
        matIndex: '12',
        selectable: true,
        canCarryFence: true,
    })
    static readonly RUBBLE3 = new SurfaceType({
        name: 'rubble 3',
        floor: true,
        matIndex: '11',
        selectable: true,
        canCarryFence: true,
    })
    static readonly RUBBLE4 = new SurfaceType({
        name: 'rubble 4',
        floor: true,
        matIndex: '10',
        selectable: true,
        canCarryFence: true,
    })

    static getByNum(typeNum: number) {
        switch (typeNum) {
            case 0:
                return SurfaceType.POWER_PATH_BUILDING
            case 1:
                return SurfaceType.SOLID_ROCK
            case 2:
                return SurfaceType.HARD_ROCK
            case 3:
                return SurfaceType.LOOSE_ROCK
            case 4:
            case 5: // soil(5) was removed pre-release, so replace it with dirt(4)
                return SurfaceType.DIRT
            case 6:
                return SurfaceType.LAVA
            case 8:
                return SurfaceType.ORE_SEAM
            case 9:
                return SurfaceType.WATER
            case 10:
                return SurfaceType.CRYSTAL_SEAM
            case 11:
                return SurfaceType.RECHARGE_SEAM
            case 30:
            case 40:
                return SurfaceType.SLUG_HOLE
            case 100:
                return SurfaceType.RUBBLE4
            case 101:
                return SurfaceType.RUBBLE3
            case 102:
                return SurfaceType.RUBBLE2
            case 103:
                return SurfaceType.RUBBLE1
            default:
                console.error('Unexpected surface type num: ' + typeNum)
                return SurfaceType.SOLID_ROCK
        }
    }
}
