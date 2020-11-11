export class Building {

    name: string;
    aeFile: string;
    dropPosAngleDeg: number = 0;
    dropPosDist: number = 0;

    constructor(name: string, dropPosAngleDeg: number = 0, dropPosDist: number = 0) {
        this.name = name;
        this.aeFile = name + '/' + name.slice(name.lastIndexOf('/') + 1) + '.ae';
        this.dropPosAngleDeg = dropPosAngleDeg;
        this.dropPosDist = dropPosDist;
    }

    static getByName(buildingType: string) {
        const typename = buildingType.slice(buildingType.lastIndexOf('/') + 1);
        switch (typename.toLowerCase()) {
            case 'toolstation':
                return TOOLSTATION;
            default:
                throw 'Unknown building type: ' + buildingType;
        }
    }

}

export const TOOLSTATION = new Building('Buildings/Toolstation', 130, 10);
