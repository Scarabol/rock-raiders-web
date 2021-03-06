import { AnimEntityActivity } from '../../game/model/activities/AnimEntityActivity'
import { SceneManager } from '../../game/SceneManager'
import { AnimatedSceneEntity } from '../AnimatedSceneEntity'
import { FulfillerSceneEntity } from './FulfillerSceneEntity'

export class VehicleSceneEntity extends FulfillerSceneEntity {

    driver: AnimatedSceneEntity

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
        if ((this.activity === activity || this.animationEntityType === null) && !!onAnimationDone === !!this.animation?.onAnimationDone && this.animation?.durationTimeMs === durationTimeMs) return
        super.changeActivity(activity, onAnimationDone, durationTimeMs)
        this.addDriverToJoint() // keep driver
    }

    private addDriverToJoint() {
        if (!this.driver) return
        this.animation.driverJoint.add(this.driver.group)
    }

}
