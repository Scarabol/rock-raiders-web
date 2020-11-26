export class Building {

    static readonly TOOLSTATION = new Building('Buildings/Toolstation', 130, 10, true);
    static readonly TELEPORT_PAD = new Building('Buildings/Teleports'); // TODO test with level 25
    static readonly POWER_STATION = new Building('Buildings/Powerstation'); // TODO test with level 09
    static readonly SUPPORT = new Building('Buildings/Support');
    static readonly UPGRADE = new Building('Buildings/Upgrade'); // TODO test with level 09
    static readonly REFINERY = new Building('Buildings/Refinery');
    static readonly GEODOME = new Building('Buildings/Geo-dome'); // TODO test with level 25

    name: string;
    aeFile: string;
    dropPosAngleDeg: number = 0;
    dropPosDist: number = 0;
    selfPowered: boolean = false;

    constructor(name: string, dropPosAngleDeg: number = 0, dropPosDist: number = 0, selfPowered: boolean = false) {
        this.name = name;
        this.aeFile = name + '/' + name.slice(name.lastIndexOf('/') + 1) + '.ae';
        this.dropPosAngleDeg = dropPosAngleDeg;
        this.dropPosDist = dropPosDist;
        this.selfPowered = selfPowered;
    }

    static getByName(buildingType: string) {
        const typename = buildingType.slice(buildingType.lastIndexOf('/') + 1).toLowerCase();
        switch (typename) {
            case 'toolstation':
                return this.TOOLSTATION;
            case 'teleports':
                return this.TELEPORT_PAD;
            case 'upgrade':
                return this.UPGRADE;
            case 'powerstation':
                return this.POWER_STATION;
            case 'support':
                return this.SUPPORT;
            case 'refinery':
                return this.REFINERY;
            case 'geo-dome':
                return this.GEODOME;
            default:
                throw 'Unknown building type: ' + buildingType;
        }
    }

}
