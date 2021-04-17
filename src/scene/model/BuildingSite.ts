import { Vector2, Vector3 } from 'three'
import { Surface } from './map/Surface'
import { CollectableEntity, CollectableType } from './collect/CollectableEntity'
import { EventBus } from '../../event/EventBus'
import { JobCreateEvent } from '../../event/WorldEvents'
import { CompletePowerPathJob } from '../../game/model/job/SurfaceJob'
import { GameState } from '../../game/model/GameState'

export class BuildingSite {

    isPowerPath: boolean
    surfaces: Surface[] = []
    neededByType = {}
    assignedByType = {}
    onSiteByType = {}
    complete: boolean = false

    constructor(isPowerPath: boolean = false) {
        this.isPowerPath = isPowerPath
    }

    getPosition(): Vector3 {
        return this.surfaces[0].getCenterWorld() // TODO use combined center of all surfaces
    }

    getPosition2D(): Vector2 {
        return this.surfaces[0].getCenterWorld2D() // TODO use combined center of all surfaces
    }

    needs(collectableType: CollectableType): boolean {
        const needed = this.neededByType[collectableType] || 0
        const assigned = (this.assignedByType[collectableType] || []).length
        return needed > assigned
    }

    assign(item: CollectableEntity) {
        const collectableType = item.getCollectableType()
        this.assignedByType[collectableType] = this.assignedByType[collectableType] || []
        this.assignedByType[collectableType].push(item)
    }

    unAssign(item: CollectableEntity) {
        const collectableType = item.getCollectableType()
        this.assignedByType[collectableType] = (this.assignedByType[collectableType] || [])
        this.assignedByType[collectableType].splice(this.assignedByType[collectableType].indexOf(item), 1)
    }

    addItem(item: CollectableEntity) {
        const collectableType = item.getCollectableType()
        const needed = this.neededByType[collectableType] || 0
        this.onSiteByType[collectableType] = this.onSiteByType[collectableType] || []
        if (this.onSiteByType[collectableType].length < needed) {
            // item.group.position.copy(item.getTargetPos())
            item.group.position.copy(this.getPosition())
            item.worldMgr.sceneManager.scene.add(item.group)
            this.onSiteByType[collectableType].push(item)
            this.checkComplete()
        } else {
            item.resetTarget()
            // item.worldMgr.addCollectable(item, item.getTargetPos().x, item.getTargetPos().z)
            const pos = item.getPosition() // FIXME test this
            item.worldMgr.addCollectable(item, pos.x, pos.z)
        }
    }

    checkComplete() {
        if (this.complete) return
        let complete = true
        Object.keys(this.neededByType).some((neededType) => {
            const needed = this.neededByType[neededType] || 0
            const onSite = (this.onSiteByType[neededType] || []).length
            if (onSite < needed) {
                complete = false
                return true
            }
        })
        if (complete) {
            this.complete = complete
            GameState.buildingSites.splice(GameState.buildingSites.indexOf(this), 1)
            const items = []
            Object.keys(this.onSiteByType).forEach((collectableType) => items.push(...this.onSiteByType[collectableType]))
            if (this.isPowerPath) {
                EventBus.publishEvent(new JobCreateEvent(new CompletePowerPathJob(this.surfaces[0], items)))
            } else {
                // TODO implement building spawning
                console.log('Building site is complete')
            }
        }
    }

}
