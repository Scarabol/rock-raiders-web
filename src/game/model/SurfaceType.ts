export class SurfaceType {

    name: string; // humand readable, maybe used as label lateron
    shaping: boolean = false;
    matIndex: string = '00';
    floor: boolean = false;
    selectable: boolean = false;
    drillable: boolean = false;
    hardDrillable: boolean = false;
    explodable: boolean = false;
    reinforcable: boolean = false;

    constructor(options: Partial<SurfaceType> = {}) {
        Object.assign(this, options);
    }

}

export const GROUND = new SurfaceType({name: 'ground', floor: true, selectable: true});
export const SOLID_ROCK = new SurfaceType({name: 'solid rock', shaping: true, matIndex: '5'});
export const HARD_ROCK = new SurfaceType({name: 'hard rock', shaping: true, matIndex: '4', selectable: true});
export const LOOSE_ROCK = new SurfaceType({name: 'loose rock', shaping: true, matIndex: '3', selectable: true});
export const DIRT = new SurfaceType({name: 'dirt', shaping: true, matIndex: '1', selectable: true});
export const SLUG_HOLE = new SurfaceType({name: 'slug hole', floor: true});
export const LAVA = new SurfaceType({name: 'lava', floor: true});
export const ORE_SEAM = new SurfaceType({name: 'ore seam', matIndex: '40', selectable: true});
export const WATER = new SurfaceType({name: 'water', floor: true});
export const ENERGY_CRYSTAL_SEAM = new SurfaceType({name: 'energy crystal seam', matIndex: '20', selectable: true});
export const RECHARGE_SEAM = new SurfaceType({name: 'recharge seam'});

export const SURF_TO_TYPE = [];
SURF_TO_TYPE[0] = GROUND;
SURF_TO_TYPE[1] = SOLID_ROCK;
SURF_TO_TYPE[2] = HARD_ROCK;
SURF_TO_TYPE[3] = LOOSE_ROCK;
SURF_TO_TYPE[4] = DIRT;
SURF_TO_TYPE[5] = GROUND;
SURF_TO_TYPE[6] = LAVA;
SURF_TO_TYPE[8] = ORE_SEAM;
SURF_TO_TYPE[9] = WATER;
SURF_TO_TYPE[10] = ENERGY_CRYSTAL_SEAM;
SURF_TO_TYPE[11] = RECHARGE_SEAM;
SURF_TO_TYPE[30] = SLUG_HOLE;
SURF_TO_TYPE[40] = SLUG_HOLE;
