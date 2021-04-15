export class Building {

    // XXX dynamically read building types from cfg at BuildingTypes
    static readonly TOOLSTATION = new Building('Toolstation', 'Buildings/Toolstation', 130, 10)
    static readonly TELEPORT_PAD = new Building('TeleportPad', 'Buildings/Teleports')
    static readonly DOCKS = new Building('Docks', 'Buildings/Docks')
    static readonly POWER_STATION = new Building('Powerstation', 'Buildings/Powerstation')
    static readonly BARRACKS = new Building('Barracks', 'Buildings/Barracks')
    static readonly UPGRADE = new Building('Upgrade', 'Buildings/Upgrade')
    static readonly GEODOME = new Building('Geo-dome', 'Buildings/Geo-dome')
    static readonly ORE_REFINERY = new Building('OreRefinery', 'Buildings/OreRefinery')
    static readonly GUNSTATION = new Building('Gunstation', 'Buildings/gunstation')
    static readonly TELEPORT_BIG = new Building('TeleportBIG', 'Buildings/BIGTeleport')

    name: string
    aeFile: string
    dropPosAngleDeg: number = 0
    dropPosDist: number = 0

    constructor(name: string, folder: string, dropPosAngleDeg: number = 0, dropPosDist: number = 0) {
        this.name = name
        this.aeFile = folder + '/' + folder.slice(folder.lastIndexOf('/') + 1) + '.ae'
        this.dropPosAngleDeg = dropPosAngleDeg
        this.dropPosDist = dropPosDist
    }

    static getByName(buildingType: string) {
        const typename = buildingType.slice(buildingType.lastIndexOf('/') + 1).toLowerCase()
        switch (typename) {
            case 'toolstation':
                return this.TOOLSTATION
            case 'teleports':
                return this.TELEPORT_PAD
            case 'docks':
                return this.DOCKS
            case 'powerstation':
                return this.POWER_STATION
            case 'barracks':
                return this.BARRACKS
            case 'upgrade':
                return this.UPGRADE
            case 'geo-dome':
                return this.GEODOME
            case 'orerefinery':
                return this.ORE_REFINERY
            case 'gunstation':
                return this.GUNSTATION
            case 'teleportbig':
                return this.TELEPORT_BIG
            default:
                throw 'Unknown building type: ' + buildingType
        }
    }

}
