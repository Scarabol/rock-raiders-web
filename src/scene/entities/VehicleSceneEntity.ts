import { Vector2, Vector3 } from 'three'
import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { SceneManager } from '../../game/SceneManager'
import { TILESIZE } from '../../params'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'

export class VehicleSceneEntity extends AnimatedSceneEntity {

    driver: AnimatedSceneEntity
    carriedByIndex: Map<number, SceneEntity> = new Map()
    speed: number

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr, aeFilename)
        this.flipXAxis()
    }

    addDriver(driver: AnimatedSceneEntity) {
        if (this.driver && this.driver !== driver) throw new Error('Cannot add two drivers to the same vehicle entity')
        this.driver = driver
        this.driver.position.set(0, 0, 0)
        this.driver.setHeading(0)
        this.addDriverToJoint()
    }

    removeDriver() {
        if (!this.driver) return
        this.animation.driverJoint.remove(this.driver.group)
    }

    changeActivity(activity: AnimEntityActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if ((this.activity === activity || this.animationEntityType === null) && !!onAnimationDone === !!this.animation.onAnimationDone) return
        super.changeActivity(activity, onAnimationDone, durationTimeMs)
        this.addDriverToJoint() // keep driver
        this.addCarriedToJoints() // keep carried items
    }

    private addDriverToJoint() {
        if (!this.driver) return
        this.animation.driverJoint.add(this.driver.group)
    }

    private addCarriedToJoints() {
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.animation.carryJoints[index]
            if (carryJoint) {
                carryJoint.add(item.group)
            } else {
                console.warn(`Could not find carry joint with index ${index} in ${this.animation.carryJoints}`)
            }
        })
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        if (this.activity === AnimEntityActivity.Route) {
            const angle = elapsedMs / 1000 * 2 * Math.PI / this.animationEntityType.wheelRadius * this.speed
            this.animation.wheelJoints.forEach((w) => w.rotateX(angle))
        }
    }

    pickupEntity(entity: SceneEntity) {
        const foundCarryJoint = this.animation.carryJoints.some((carryJoint, index) => {
            if (carryJoint.children.length < 1) {
                this.carriedByIndex.set(index, entity)
                carryJoint.add(entity.group)
                return true
            }
        })
        if (!foundCarryJoint) {
            console.warn('Could not find empty carry joint to attach carried entity')
        }
        entity.position.set(0, 0, 0)
    }

    dropAllCarriedItems() {
        const position = this.position.clone().add(new Vector3().random().multiplyScalar(TILESIZE / 4))
        this.carriedByIndex.forEach((item, index) => {
            const carryJoint = this.animation.carryJoints[index]
            if (carryJoint) {
                carryJoint.remove(item.group)
                carryJoint.getWorldPosition(position)
            }
            item.addToScene(new Vector2(position.x, position.z), null)
        })
        this.carriedByIndex.clear()
    }

}
