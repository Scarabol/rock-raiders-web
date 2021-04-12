import { CollectableEntity, CollectableType, CollectTargetType } from '../../../scene/model/collect/CollectableEntity'
import { Vector3 } from 'three'
import { JOB_ACTION_RANGE } from '../../../main'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { Building } from '../entity/building/Building'
import { GameState } from '../GameState'
import { EventBus } from '../../../event/EventBus'
import { CollectEvent } from '../../../event/WorldEvents'
import { JobType, PublicJob } from './Job'

export class CollectJob extends PublicJob {

    item: CollectableEntity

    constructor(item: CollectableEntity) {
        super(JobType.CARRY)
        this.item = item
    }

    getPosition(): Vector3 {
        return this.item.getPosition()
    }

    isInArea(x: number, z: number): boolean {
        const pos = this.getPosition()
        return pos.sub(new Vector3(x, pos.y, z)).length() < JOB_ACTION_RANGE
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.carries === null && !!this.item.getTargetPos()
    }

    onJobComplete() {
        super.onJobComplete()
        if (this.item.getTargetType() === Building.TOOLSTATION) {
            switch (this.item.getCollectableType()) {
                case CollectableType.CRYSTAL:
                    GameState.numCrystal++
                    EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()))
                    break
                case CollectableType.ORE:
                    GameState.numOre++
                    EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()))
                    break
            }
        } else if (this.item.getTargetType() === CollectTargetType.BUILDING_SITE) {
            this.item.targetSite.addItem(this.item)
        } else {
            console.error('target type not yet implemented: ' + this.item.getTargetType())
        }
    }

    getPriorityIdentifier(): string {
        return this.item.getCollectableType() === CollectableType.CRYSTAL ? 'aiPriorityCrystal' : 'aiPriorityOre'
    }

}
