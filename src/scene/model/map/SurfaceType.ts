export class SurfaceType {

    name: string; // humand readable, maybe used as label lateron
    shaping: boolean = false;
    matIndex: string = '00';
    floor: boolean = false;
    selectable: boolean = false;
    drillable: boolean = false;
    explodable: boolean = false;
    reinforcable: boolean = false;

    constructor(options: Partial<SurfaceType> = {}) {
        Object.assign(this, options);
    }

    static getTypeByNum(typenum: number) {
        switch (typenum) {
            case 0:
                return GROUND;
            case 1:
                return SOLID_ROCK;
            case 2:
                return HARD_ROCK;
            case 3:
                return LOOSE_ROCK;
            case 4:
                return DIRT;
            case 5:
                return GROUND;
            case 6:
                return LAVA;
            case 8:
                return ORE_SEAM;
            case 9:
                return WATER;
            case 10:
                return ENERGY_CRYSTAL_SEAM;
            case 11:
                return RECHARGE_SEAM;
            case 30:
            case 40:
                return SLUG_HOLE;
            case 100:
                return RUBBLE4;
            case 101:
                return RUBBLE3;
            case 102:
                return RUBBLE2;
            case 103:
                return RUBBLE1;
            default:
                throw 'unknown surface type: ' + typenum;
        }
    }

}

export const GROUND = new SurfaceType({name: 'ground', floor: true, selectable: true});
export const SOLID_ROCK = new SurfaceType({name: 'solid rock', shaping: true, matIndex: '5'});
export const HARD_ROCK = new SurfaceType({name: 'hard rock', shaping: true, matIndex: '4', selectable: true, explodable: true, reinforcable: true});
export const LOOSE_ROCK = new SurfaceType({name: 'loose rock', shaping: true, matIndex: '3', selectable: true, drillable: true, explodable: true, reinforcable: true});
export const DIRT = new SurfaceType({name: 'dirt', shaping: true, matIndex: '1', selectable: true, drillable: true, explodable: true, reinforcable: true});
export const SLUG_HOLE = new SurfaceType({name: 'slug hole', floor: true, matIndex: '30'});
export const LAVA = new SurfaceType({name: 'lava', floor: true, matIndex: '46'});
export const ORE_SEAM = new SurfaceType({name: 'ore seam', matIndex: '40', selectable: true, drillable: true, explodable: true, reinforcable: true});
export const WATER = new SurfaceType({name: 'water', floor: true, matIndex: '45'});
export const ENERGY_CRYSTAL_SEAM = new SurfaceType({name: 'energy crystal seam', matIndex: '20', selectable: true, drillable: true, explodable: true, reinforcable: true});
export const RECHARGE_SEAM = new SurfaceType({name: 'recharge seam', matIndex: '67'});
export const ENERGY_PATH_BUILDING = new SurfaceType({name: 'energy path', floor: true, matIndex: '76'});
export const RUBBLE1 = new SurfaceType({name: 'rubble 1', floor: true, matIndex: '13', selectable: true});
export const RUBBLE2 = new SurfaceType({name: 'rubble 2', floor: true, matIndex: '12', selectable: true});
export const RUBBLE3 = new SurfaceType({name: 'rubble 3', floor: true, matIndex: '11', selectable: true});
export const RUBBLE4 = new SurfaceType({name: 'rubble 4', floor: true, matIndex: '10', selectable: true});
