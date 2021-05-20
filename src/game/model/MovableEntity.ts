import { Vector3 } from 'three'
import { JOB_ACTION_RANGE } from '../../params'
import { SceneManager } from '../SceneManager'
import { WorldManager } from '../WorldManager'
import { AnimEntityActivity } from './activities/AnimEntityActivity'
import { AnimEntity } from './anim/AnimEntity'
import { EntityStep } from './EntityStep'
import { EntityType } from './EntityType'
import { TerrainPath } from './map/TerrainPath'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'

export abstract class MovableEntity extends AnimEntity {

    currentPath: TerrainPath = null

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, entityType, aeFilename)
    }

    moveToClosestTarget(target: PathTarget[]): MoveState {
        if (!target?.length) {
            console.warn('No targets given')
            debugger
        }
        if (!this.currentPath || !target.some((t) => t.targetLocation.equals(this.currentPath.target.targetLocation))) {
            const paths = target.map((t) => this.findPathToTarget(t)).filter((p) => !!p)
                .sort((l, r) => l.lengthSq - r.lengthSq)
            this.currentPath = paths.length > 0 ? paths[0] : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const nextLocation = this.currentPath.firstLocation
        this.sceneEntity.lookAt(new Vector3(nextLocation.x, this.sceneEntity.position.y, nextLocation.y))
        const step = this.determineStep()
        if (step.targetReached) {
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.position.add(step.vec)
            this.changeActivity(this.getRouteActivity()) // only change when actually moving
            return MoveState.MOVED
        }
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return new TerrainPath(target, target.targetLocation)
    }

    determineStep(): EntityStep {
        const targetWorld = this.sceneMgr.getFloorPosition(this.currentPath.firstLocation)
        targetWorld.y += this.floorOffset
        const step = new EntityStep(targetWorld.sub(this.sceneEntity.position))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() // TODO use average speed between current and target position
        if (this.currentPath.locations.length > 1) {
            if (stepLengthSq < entitySpeed * entitySpeed) {
                this.currentPath.locations.shift()
                return this.determineStep()
            }
        } else if (stepLengthSq < JOB_ACTION_RANGE * JOB_ACTION_RANGE) {
            step.targetReached = true
        }
        step.vec.clampLength(0, entitySpeed)
        return step
    }

    abstract getRouteActivity(): AnimEntityActivity

}
