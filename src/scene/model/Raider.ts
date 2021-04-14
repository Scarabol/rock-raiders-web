import { SelectionType } from '../../game/model/Selectable'
import { EventBus } from '../../event/EventBus'
import { RaiderSelected, SelectionEvent } from '../../event/LocalEvents'
import { FulfillerActivity, FulfillerEntity } from './FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { Vector3 } from 'three'
import { EntityAddedEvent, EntityType } from '../../event/WorldEvents'
import { RaiderDiscoveredEvent } from '../../event/WorldLocationEvent'

export class RaiderSkills {

    static DRIVER = 'driver'
    static ENGINEER = 'engineer'
    static GEOLOGIST = 'geologist'
    static PILOT = 'pilot'
    static SAILOR = 'sailor'
    static DEMOLITION = 'demolition'

}

export class RaiderTools {

    static DRILL = 'drill'
    static HAMMER = 'hammer'
    static SHOVEL = 'shovel'
    static SPANNER = 'SPANNER'
    static FREEZERGUN = 'freezergun'
    static LASER = 'laser'
    static PUSHERGUN = 'pushergun'
    static BIRDSCARER = 'birdscarer'

}

export class Raider extends FulfillerEntity {

    constructor() {
        super(SelectionType.PILOT, 'mini-figures/pilot/pilot.ae')
        this.tools = [RaiderTools.DRILL]
        this.skills = []
        this.pickSphereRadius = this.stats.pickSphere / 2
    }

    getSpeed(): number {
        let speed = this.stats.routeSpeed[this.level]
        if (this.animation && !isNaN(this.animation.transcoef)) speed *= this.animation.transcoef
        if (this.isOnPath()) speed *= this.stats.pathCoef
        return speed
    }

    isOnRubble() {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).hasRubble()
    }

    isOnPath(): boolean {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).isPath()
    }

    findPathToTarget(target: Vector3): Vector3[] {
        return this.worldMgr.sceneManager.terrain.findPath(this.getPosition(), target)
    }

    changeActivity(activity: FulfillerActivity, onChangeDone = null, durationTimeMs: number = null) {
        if (onChangeDone) onChangeDone.bind(this)
        if (this.activity !== activity) {
            this.activity = activity
            this.setActivity(this.activity.getValue(!!this.carries), onChangeDone, durationTimeMs)
            this.animation.looping = true
        }
    }

    onDiscover() {
        super.onDiscover()
        const index = GameState.raidersUndiscovered.indexOf(this)
        if (index !== -1) GameState.raidersUndiscovered.splice(index, 1)
        GameState.raiders.push(this)
        EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, this))
        EventBus.publishEvent(new RaiderDiscoveredEvent(this.getPosition()))
    }

    select(): SelectionEvent {
        this.selectionFrame.visible = true
        if (!this.selected) {
            this.selected = true
            this.changeActivity(FulfillerActivity.STANDING)
            return new RaiderSelected(this)
        }
        return null
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null
    }

    isDriving(): boolean {
        return false // TODO implement vehicles
    }

}
