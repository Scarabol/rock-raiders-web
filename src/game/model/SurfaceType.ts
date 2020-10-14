export class SurfaceType {

    name: string; // humand readable, maybe used as label lateron

    selectable: boolean = false;
    drillable: boolean = false;
    hardDrillable: boolean = false;
    explodable: boolean = false;
    reinforcable: boolean = false;

    constructor(name) {
        this.name = name;
    }

}

// TODO complete this list
export const GROUND = new SurfaceType('ground');
export const SOLID_ROCK = new SurfaceType('solid rock');
export const HARD_ROCK = new SurfaceType('hard rock');
export const LOOSE_ROCK = new SurfaceType('loose rock');
export const DIRT = new SurfaceType('dirt');
export const SLUG_HOLE = new SurfaceType('slug hole');
export const LAVA = new SurfaceType('lava');
export const ORE_SEAM = new SurfaceType('ore seam');
export const WATER = new SurfaceType('water');
export const ENERGY_CRYSTAL_SEAM = new SurfaceType('energy crystal seam');
export const RECHARGE_SEAM = new SurfaceType('recharge seam');

export const SURF_TO_TYPE = []; // TODO complete this list
SURF_TO_TYPE[0] = GROUND;
SURF_TO_TYPE[5] = GROUND;
