import { AnimationActivity, AnimEntityActivity } from '../../game/model/anim/AnimationActivity'
import { SceneManager } from '../../game/SceneManager'
import { LegacyAnimatedSceneEntity } from '../LegacyAnimatedSceneEntity'
import { SceneEntity } from '../SceneEntity'
import { Object3D } from 'three'

/**
 * @deprecated
 */
export class VehicleSceneEntity extends LegacyAnimatedSceneEntity {
    driver: Object3D
    speed: number

    constructor(sceneMgr: SceneManager, aeFilename: string) {
        super(sceneMgr, aeFilename)
        this.flipXAxis()
    }

    addDriver(driver: Object3D) {
        if (this.driver && this.driver !== driver) throw new Error('Cannot add two drivers to the same vehicle entity')
        this.driver = driver
        this.driver.position.set(0, 0, 0)
        this.driver.rotation.y = 0
        this.addDriverToJoint()
    }

    removeDriver() {
        if (!this.driver) return
        this.animation.driverJoint.remove(this.driver)
    }

    changeActivity(activity: AnimationActivity = this.getDefaultActivity(), onAnimationDone: () => any = null, durationTimeMs: number = null) {
        if ((this.activity === activity || this.animationEntityType === null) && !!onAnimationDone === !!this.animation.onAnimationDone) return
        super.changeActivity(activity, onAnimationDone, durationTimeMs)
        this.addDriverToJoint() // keep driver
    }

    private addDriverToJoint() {
        if (!this.driver) return
        this.animation.driverJoint.add(this.driver)
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        if (this.activity === AnimEntityActivity.Route) {
            const angle = elapsedMs / 1000 * 2 * Math.PI / this.animationEntityType.wheelRadius * this.speed
            this.animation.wheelJoints.forEach((w) => w.rotateX(angle))
        }
    }

    dropAllEntities(): SceneEntity[] {
        const dropped = super.dropAllEntities()
        dropped.forEach((d) => d.addToScene(d.position2D, null))
        return dropped
    }
}
