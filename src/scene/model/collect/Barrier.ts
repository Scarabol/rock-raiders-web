import { Vector2, Vector3 } from 'three'
import { PriorityIdentifier } from '../../../game/model/job/PriorityIdentifier'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BarrierActivity } from '../activities/BarrierActivity'
import { AnimEntity } from '../anim/AnimEntity'
import { BuildingSite } from '../BuildingSite'
import { CollectPathTarget } from '../CollectionTarget'
import { PathTarget } from '../PathTarget'
import { Carryable } from './Carryable'
import { CollectableEntity, CollectableType } from './CollectableEntity'

export class Barrier extends AnimEntity implements Carryable {

    targets: BarrierPathTarget[] = []
    targetSite: BuildingSite = null

    constructor() {
        super(ResourceManager.getAnimationEntityType('MiscAnims/Barrier/Barrier.ae'))
        this.changeActivity()
    }

    get stats() {
        return null
    }

    getCollectableType(): CollectableType {
        return CollectableType.BARRIER
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

    hasTarget(): boolean {
        return this.targets.length > 0
    }

    getDefaultActivity(): BarrierActivity {
        return BarrierActivity.Short
    }

    getCarryTargets(): PathTarget[] {
        return this.targets
    }

    setTargetSite(site: BuildingSite) { // FIXME refactor this, somewhat used by carryable/collectable
        this.targetSite = site
    }

}

export class BarrierPathTarget extends CollectPathTarget {

    heading: number

    constructor(location: BarrierLocation, site) {
        super(location.location, site, null)
        this.heading = location.heading
    }

    gatherItem(item: CollectableEntity) {
        const barrier = item as any as Barrier // FIXME refactor this
        barrier.targetSite.addItem(barrier as any as CollectableEntity) // FIXME refactor this
        barrier.group.position.copy(new Vector3(this.targetLocation.x, barrier.worldMgr.getFloorHeight(this.targetLocation.x, this.targetLocation.y), this.targetLocation.y))
        barrier.group.rotation.y = this.heading
        barrier.changeActivity(BarrierActivity.Expand, () => {
            barrier.changeActivity(BarrierActivity.Long)
        })
    }

    canGatherItem(): boolean {
        return true
    }

}

export class BarrierLocation {

    location: Vector2
    heading: number

    constructor(location: Vector2, surfaceCenter: Vector2) {
        this.location = location
        this.heading = location.clone().sub(surfaceCenter).angle()
        if (location.y === surfaceCenter.y) {
            this.heading -= Math.PI / 2
        } else {
            this.heading += Math.PI / 2
        }
    }

}
