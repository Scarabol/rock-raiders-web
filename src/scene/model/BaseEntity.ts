import { WorldManager } from '../WorldManager'
import { Euler, Group, Vector3 } from 'three'
import { EntityStatsCfg } from '../../cfg/EntityStatsCfg'
import { ResourceManager } from '../../resource/ResourceManager'

export class BaseEntity {

    worldMgr: WorldManager
    group: Group = new Group()
    sequenceIntervals = []
    level: number = 0
    stats: EntityStatsCfg

    constructor() {
        this.stats = new EntityStatsCfg(ResourceManager.cfg('Stats', 'Pilot') || {}) // TODO group all stats in single class
    }

    getPosition() {
        return new Vector3().copy(this.group.position)
    }

    getRotation() {
        return new Euler().copy(this.group.rotation)
    }

    onDiscover() {
        this.group.visible = true
    }

}
