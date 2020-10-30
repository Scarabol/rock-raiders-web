export class Building {

    name: string;
    aeFile: string;

    constructor(name: string) {
        this.name = name;
        this.aeFile = name + '/' + name.slice(name.lastIndexOf('/') + 1) + '.ae';
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

export const TOOLSTATION = new Building('Buildings/Toolstation');
