export class Space {

    type: number;
    x: number;
    y: number;
    height: any;
    containedOre: number = 0;
    containedCrystals: number = 0;

    constructor(type, x, y, height) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.height = height;
    }

}
