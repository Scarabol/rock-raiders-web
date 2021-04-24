export class Building {

    // XXX dynamically read building types from cfg at BuildingTypes
    static readonly TOOLSTATION = new Building('Toolstation', 'Buildings/Toolstation', false)
    static readonly TELEPORT_PAD = new Building('TeleportPad', 'Buildings/Teleports')
    static readonly DOCKS = new Building('Docks', 'Buildings/Docks', true,
        null, null, true, {x: 0, y: 1})
    static readonly POWER_STATION = new Building('Powerstation', 'Buildings/Powerstation', true,
        {x: 1, y: 0})
    static readonly BARRACKS = new Building('Barracks', 'Buildings/Barracks')
    static readonly UPGRADE = new Building('Upgrade', 'Buildings/Upgrade')
    static readonly GEODOME = new Building('Geo-dome', 'Buildings/Geo-dome', true,
        {x: 0, y: -1}, null, false)
    static readonly ORE_REFINERY = new Building('OreRefinery', 'Buildings/OreRefinery', true,
        {x: 0, y: 1})
    static readonly GUNSTATION = new Building('Gunstation', 'Buildings/gunstation', true,
        null, null, false)
    static readonly TELEPORT_BIG = new Building('TeleportBIG', 'Buildings/BIGTeleport', true,
        {x: -1, y: 0}, {x: -1, y: -1})

    name: string
    aeFile: string
    blocksPathSurface: boolean
    secondaryBuildingPart: { x: number, y: number }
    secondaryPowerPath: { x: number, y: number }
    hasPrimaryPowerPath: boolean
    waterPathSurface: { x: number, y: number }

    constructor(name: string, folder: string, blocksPathSurface: boolean = true, secondaryBuildingPart: { x: number, y: number } = null, secondaryPowerPath: { x: number, y: number } = null, hasPrimaryPowerPath: boolean = true, waterPathSurface: { x: number, y: number } = null) {
        this.name = name
        this.aeFile = folder + '/' + folder.slice(folder.lastIndexOf('/') + 1) + '.ae'
        this.blocksPathSurface = blocksPathSurface
        this.secondaryBuildingPart = secondaryBuildingPart
        this.secondaryPowerPath = secondaryPowerPath
        this.hasPrimaryPowerPath = hasPrimaryPowerPath
        this.waterPathSurface = waterPathSurface
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
