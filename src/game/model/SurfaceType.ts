export class SurfaceType {

    name: string; // humand readable, maybe used as label lateron
    shaping: boolean;
    matIndex: string;

    selectable: boolean = false;
    drillable: boolean = false;
    hardDrillable: boolean = false;
    explodable: boolean = false;
    reinforcable: boolean = false;

    constructor(name, shaping = false, matIndex = '00') {
        this.name = name;
        this.shaping = shaping;
        this.matIndex = matIndex;
    }

}

export const GROUND = new SurfaceType('ground');
export const SOLID_ROCK = new SurfaceType('solid rock', true, '5');
export const HARD_ROCK = new SurfaceType('hard rock', true, '4');
export const LOOSE_ROCK = new SurfaceType('loose rock', true, '3');
export const DIRT = new SurfaceType('dirt', true, '1');
export const SLUG_HOLE = new SurfaceType('slug hole');
export const LAVA = new SurfaceType('lava');
export const ORE_SEAM = new SurfaceType('ore seam', false, '40');
export const WATER = new SurfaceType('water');
export const ENERGY_CRYSTAL_SEAM = new SurfaceType('energy crystal seam', false, '20');
export const RECHARGE_SEAM = new SurfaceType('recharge seam');

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
