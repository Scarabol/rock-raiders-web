import { Cursor } from '../../cfg/PointersCfg'
import { GameConfig } from '../../cfg/GameConfig'

export class SurfaceType {
    name: string = '' // human-readable config name
    shaping: boolean = false
    matIndex: string = '00'
    floor: boolean = false
    selectable: boolean = false
    digable: boolean = false
    reinforcable: boolean = false
    hasRubble: boolean = false
    cursor: Cursor = 'standard'
    statsDrillName?: 'hardDrillTime' | 'looseDrillTime' | 'soilDrillTime' | 'seamDrillTime'
    statsLaserName?: 'wallDestroyTimeHard' | 'wallDestroyTimeMedium' | 'wallDestroyTimeLoose'
    canHaveFence: boolean = false
    connectsPath: boolean = false
    mapSurfaceColor: string = '#00FFFF'
    fallInAffected: boolean = false
    hasErosion: boolean = false

    constructor(options: Partial<SurfaceType> = {}) {
        Object.assign(this, options)
    }

    static readonly GROUND = new SurfaceType({
        name: 'surfaceTypeTunnel',
        floor: true,
        selectable: true,
        canHaveFence: true,
        mapSurfaceColor: '#280048',
        fallInAffected: true,
    })
    static readonly HIDDEN_CAVERN = new SurfaceType({
        name: 'surfaceTypeUndiscovered',
        mapSurfaceColor: '#6A0000',
    })
    static readonly HIDDEN_SLUG_HOLE = new SurfaceType({
        name: 'surfaceTypeUndiscovered',
        mapSurfaceColor: '#6A0000',
    })
    static readonly SOLID_ROCK = new SurfaceType({
        name: 'surfaceTypeImmovable',
        shaping: true,
        matIndex: '5',
        cursor: 'surfaceTypeImmovable',
        mapSurfaceColor: '#500090',
    })
    static readonly HARD_ROCK = new SurfaceType({
        name: 'surfaceTypeHard',
        shaping: true,
        matIndex: '4',
        selectable: true,
        digable: true,
        reinforcable: true,
        cursor: 'surfaceTypeHard',
        statsDrillName: 'hardDrillTime',
        statsLaserName: 'wallDestroyTimeHard',
        mapSurfaceColor: '#7000B0',
    })
    static readonly LOOSE_ROCK = new SurfaceType({
        name: 'surfaceTypeMedium',
        shaping: true,
        matIndex: '3',
        selectable: true,
        digable: true,
        reinforcable: true,
        cursor: 'surfaceTypeMedium',
        statsDrillName: 'looseDrillTime',
        statsLaserName: 'wallDestroyTimeMedium',
        mapSurfaceColor: '#9000D0',
    })
    static readonly DIRT = new SurfaceType({
        name: 'surfaceTypeLoose',
        shaping: true,
        matIndex: '2',
        selectable: true,
        digable: true,
        reinforcable: true,
        cursor: 'surfaceTypeLoose',
        statsDrillName: 'soilDrillTime',
        statsLaserName: 'wallDestroyTimeLoose',
        mapSurfaceColor: '#B000F0',
    })
    static readonly SLUG_HOLE = new SurfaceType({
        name: 'surfaceTypeSlugHole', floor: true, matIndex: '30', mapSurfaceColor: '#280048',
    })
    static readonly LAVA1 = new SurfaceType({
        name: 'lava 1', floor: true, matIndex: '06', selectable: true, mapSurfaceColor: '#280048', hasErosion: true,
    })
    static readonly LAVA2 = new SurfaceType({
        name: 'lava 2', floor: true, matIndex: '16', selectable: true, mapSurfaceColor: '#280048', hasErosion: true,
    })
    static readonly LAVA3 = new SurfaceType({
        name: 'lava 3', floor: true, matIndex: '26', selectable: true, mapSurfaceColor: '#280048', hasErosion: true,
    })
    static readonly LAVA4 = new SurfaceType({
        name: 'lava 4', floor: true, matIndex: '36', selectable: true, mapSurfaceColor: '#280048', hasErosion: true,
    })
    static readonly LAVA5 = new SurfaceType({
        name: 'surfaceTypeLava', floor: true, matIndex: '46', mapSurfaceColor: '#fa5700',
    })
    static readonly ORE_SEAM = new SurfaceType({
        name: 'surfaceTypeOreSeam',
        matIndex: '40',
        selectable: true,
        digable: true,
        reinforcable: true,
        cursor: 'surfaceTypeOreSeam',
        statsDrillName: 'seamDrillTime',
        mapSurfaceColor: '#963c00',
    })
    static readonly WATER = new SurfaceType({
        name: 'surfaceTypeLake', floor: true, matIndex: '45', mapSurfaceColor: '#000080',
    })
    static readonly CRYSTAL_SEAM = new SurfaceType({
        name: 'surfaceTypeCrystalSeam',
        matIndex: '20',
        selectable: true,
        digable: true,
        reinforcable: true,
        cursor: 'surfaceTypeCrystalSeam',
        statsDrillName: 'seamDrillTime',
        mapSurfaceColor: '#aafa00',
    })
    static readonly RECHARGE_SEAM = new SurfaceType({
        name: 'surfaceTypeRechargeSeam',
        matIndex: '67',
        cursor: 'surfaceTypeRechargeSeam',
        mapSurfaceColor: '#ffff00',
    })
    static readonly POWER_PATH = new SurfaceType({
        name: 'surfaceTypePath',
        floor: true,
        matIndex: '60',
        selectable: true,
        canHaveFence: true,
        connectsPath: true,
        mapSurfaceColor: '#ffff00',
        fallInAffected: true,
    })
    static readonly POWER_PATH_BUILDING_SITE = new SurfaceType({
        name: 'power path building site',
        floor: true,
        matIndex: '61',
        selectable: true,
        canHaveFence: true,
        mapSurfaceColor: '#280048',
    })
    static readonly POWER_PATH_BUILDING = new SurfaceType({
        name: 'surfaceTypePath',
        floor: true,
        matIndex: '76',
        connectsPath: true,
        mapSurfaceColor: '#B8BBB8',
    })
    static readonly RUBBLE1 = new SurfaceType({
        name: 'surfaceTypeRubble',
        floor: true,
        matIndex: '13',
        selectable: true,
        hasRubble: true,
        canHaveFence: true,
        mapSurfaceColor: '#280048',
        fallInAffected: true,
    })
    static readonly RUBBLE2 = new SurfaceType({
        name: 'surfaceTypeRubble',
        floor: true,
        matIndex: '12',
        selectable: true,
        hasRubble: true,
        canHaveFence: true,
        mapSurfaceColor: '#280048',
        fallInAffected: true,
    })
    static readonly RUBBLE3 = new SurfaceType({
        name: 'surfaceTypeRubble',
        floor: true,
        matIndex: '11',
        selectable: true,
        hasRubble: true,
        canHaveFence: true,
        mapSurfaceColor: '#280048',
        fallInAffected: true,
    })
    static readonly RUBBLE4 = new SurfaceType({
        name: 'surfaceTypeRubble',
        floor: true,
        matIndex: '10',
        selectable: true,
        hasRubble: true,
        canHaveFence: true,
        mapSurfaceColor: '#280048',
    })

    static getByNum(typeNum: number) {
        switch (typeNum) {
            case SURFACE_TYPE.ground:
                return SurfaceType.GROUND
            case SURFACE_TYPE.solidRock:
                return SurfaceType.SOLID_ROCK
            case SURFACE_TYPE.hardRock:
                return SurfaceType.HARD_ROCK
            case SURFACE_TYPE.looseRock:
                return SurfaceType.LOOSE_ROCK
            case SURFACE_TYPE.dirt:
            // fallthrough
            case 5: // soil(5) was removed pre-release, so replace it with dirt(4)
                return SurfaceType.DIRT
            case SURFACE_TYPE.lava5:
                return SurfaceType.LAVA5
            case SURFACE_TYPE.oreSeam:
                return SurfaceType.ORE_SEAM
            case SURFACE_TYPE.water:
                return SurfaceType.WATER
            case SURFACE_TYPE.crystalSeam:
                return SurfaceType.CRYSTAL_SEAM
            case SURFACE_TYPE.rechargeSeam:
                return SurfaceType.RECHARGE_SEAM
            case SURFACE_TYPE.slugHole: // XXX slug hole hidden/exposed?
            // fallthrough
            case 40: // XXX slug hole hidden/exposed?
                return SurfaceType.SLUG_HOLE
            case SURFACE_TYPE.rubble4:
                return SurfaceType.RUBBLE4
            case SURFACE_TYPE.rubble3:
                return SurfaceType.RUBBLE3
            case SURFACE_TYPE.rubble2:
                return SurfaceType.RUBBLE2
            case SURFACE_TYPE.rubble1:
                return SurfaceType.RUBBLE1
            default:
                console.error(`Unexpected surface type num: ${typeNum}`)
                return SurfaceType.SOLID_ROCK
        }
    }

    getObjectName(): string {
        return GameConfig.instance.surfaceTypeDescriptions[this.name.toLowerCase()]?.objectName || ''
    }

    getSfxKey(): string {
        return GameConfig.instance.surfaceTypeDescriptions[this.name.toLowerCase()]?.sfxKey || ''
    }
}

export const SURFACE_TYPE = {
    ground: 0,
    solidRock: 1,
    hardRock: 2,
    looseRock: 3,
    dirt: 4,
    lava5: 6,
    oreSeam: 8,
    water: 9,
    crystalSeam: 10,
    rechargeSeam: 11,
    slugHole: 30,
    rubble4: 100,
    rubble3: 101,
    rubble2: 102,
    rubble1: 103,
}
