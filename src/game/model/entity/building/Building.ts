import { BuildingStatsCfg } from '../../../../cfg/BuildingStatsCfg'
import { ResourceManager } from '../../../../resource/ResourceManager'

export class Building {

    static readonly TOOLSTATION = new Building('Toolstation', 130, 10)
    static readonly TELEPORT_PAD = new Building('Teleports') // TODO test with level 25
    static readonly POWER_STATION = new Building('Powerstation') // TODO test with level 09
    static readonly SUPPORT = new Building('Support')
    static readonly UPGRADE = new Building('Upgrade') // TODO test with level 09
    static readonly REFINERY = new Building('Refinery')
    static readonly GEODOME = new Building('Geo-dome') // TODO test with level 25

    name: string
    aeFile: string
    dropPosAngleDeg: number = 0
    dropPosDist: number = 0
    statsCache: BuildingStatsCfg

    constructor(name: string, dropPosAngleDeg: number = 0, dropPosDist: number = 0) {
        this.name = name
        this.aeFile = 'Buildings/' + name + '/' + name + '.ae'
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
            case 'upgrade':
                return this.UPGRADE
            case 'powerstation':
                return this.POWER_STATION
            case 'support':
                return this.SUPPORT
            case 'refinery':
                return this.REFINERY
            case 'geo-dome':
                return this.GEODOME
            default:
                throw 'Unknown building type: ' + buildingType
        }
    }

    get stats() {
        this.statsCache = this.statsCache || new BuildingStatsCfg(ResourceManager.cfg('Stats', this.name))
        return this.statsCache
    }

}
