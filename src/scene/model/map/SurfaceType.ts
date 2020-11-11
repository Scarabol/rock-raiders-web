export class SurfaceType {

    name: string; // humand readable, maybe used as label lateron
    shaping: boolean = false;
    matIndex: string = '00';
    matIndexPowered: string = null;
    floor: boolean = false;
    selectable: boolean = false;
    drillable: boolean = false;
    explodable: boolean = false;
    reinforcable: boolean = false;

    constructor(options: Partial<SurfaceType> = {}) {
        Object.assign(this, options);
    }

    static readonly GROUND = new SurfaceType({name: 'ground', floor: true, selectable: true});
    static readonly SOLID_ROCK = new SurfaceType({name: 'solid rock', shaping: true, matIndex: '5'});
    static readonly HARD_ROCK = new SurfaceType({name: 'hard rock', shaping: true, matIndex: '4', selectable: true, explodable: true, reinforcable: true});
    static readonly LOOSE_ROCK = new SurfaceType({name: 'loose rock', shaping: true, matIndex: '3', selectable: true, drillable: true, explodable: true, reinforcable: true});
    static readonly DIRT = new SurfaceType({name: 'dirt', shaping: true, matIndex: '1', selectable: true, drillable: true, explodable: true, reinforcable: true});
    static readonly SLUG_HOLE = new SurfaceType({name: 'slug hole', floor: true, matIndex: '30'});
    static readonly LAVA = new SurfaceType({name: 'lava', floor: true, matIndex: '46'});
    static readonly ORE_SEAM = new SurfaceType({name: 'ore seam', matIndex: '40', selectable: true, drillable: true, explodable: true, reinforcable: true});
    static readonly WATER = new SurfaceType({name: 'water', floor: true, matIndex: '45'});
    static readonly ENERGY_CRYSTAL_SEAM = new SurfaceType({name: 'energy crystal seam', matIndex: '20', selectable: true, drillable: true, explodable: true, reinforcable: true});
    static readonly RECHARGE_SEAM = new SurfaceType({name: 'recharge seam', matIndex: '67'});
    static readonly POWER_PATH_ALL = new SurfaceType({name: 'power path all', floor: true, matIndex: '60', matIndexPowered: '71'});
    static readonly POWER_PATH_SITE = new SurfaceType({name: 'power path site', floor: true, matIndex: '61'});
    static readonly POWER_PATH_STRAIGHT = new SurfaceType({name: 'power path straight', floor: true, matIndex: '62', matIndexPowered: '72'});
    static readonly POWER_PATH_CORNER = new SurfaceType({name: 'power path corner', floor: true, matIndex: '63', matIndexPowered: '73'});
    static readonly POWER_PATH_TCROSSING = new SurfaceType({name: 'power path t crossing', floor: true, matIndex: '64', matIndexPowered: '74'});
    static readonly POWER_PATH_END = new SurfaceType({name: 'power path end', floor: true, matIndex: '65', matIndexPowered: '75'});
    static readonly POWER_PATH_BUILDING = new SurfaceType({name: 'power path', floor: true, matIndex: '76', matIndexPowered: '66'});
    static readonly RUBBLE1 = new SurfaceType({name: 'rubble 1', floor: true, matIndex: '13', selectable: true});
    static readonly RUBBLE2 = new SurfaceType({name: 'rubble 2', floor: true, matIndex: '12', selectable: true});
    static readonly RUBBLE3 = new SurfaceType({name: 'rubble 3', floor: true, matIndex: '11', selectable: true});
    static readonly RUBBLE4 = new SurfaceType({name: 'rubble 4', floor: true, matIndex: '10', selectable: true});

    static getByNum(typeNum: number) {
        switch (typeNum) {
            case 0:
                return SurfaceType.POWER_PATH_BUILDING;
            case 1:
                return SurfaceType.SOLID_ROCK;
            case 2:
                return SurfaceType.HARD_ROCK;
            case 3:
                return SurfaceType.LOOSE_ROCK;
            case 4:
            case 5: // soil(5) was removed pre-release, so replace it with dirt(4)
                return SurfaceType.DIRT;
            case 6:
                return SurfaceType.LAVA;
            case 8:
                return SurfaceType.ORE_SEAM;
            case 9:
                return SurfaceType.WATER;
            case 10:
                return SurfaceType.ENERGY_CRYSTAL_SEAM;
            case 11:
                return SurfaceType.RECHARGE_SEAM;
            case 30:
            case 40:
                return SurfaceType.SLUG_HOLE;
            case 100:
                return SurfaceType.RUBBLE4;
            case 101:
                return SurfaceType.RUBBLE3;
            case 102:
                return SurfaceType.RUBBLE2;
            case 103:
                return SurfaceType.RUBBLE1;
            default:
                console.error('Unexpected surface type num: ' + typeNum);
                return SurfaceType.SOLID_ROCK;
        }
    }
}
