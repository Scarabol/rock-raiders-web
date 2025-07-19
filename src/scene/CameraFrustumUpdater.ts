import { Camera, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { MapRendererCameraRect } from '../worker/MapRendererWorker'
import { EventBroker } from '../event/EventBroker'
import { UpdateRadarCamera } from '../event/LocalEvents'
import { MAP_MAX_UPDATE_INTERVAL } from '../params'

export class CameraFrustumUpdater {
    readonly raycaster = new Raycaster()
    readonly groundPlane = new Plane(new Vector3(0, 1, 0), 0)
    readonly topLeft = new Vector2(-1, 1)
    readonly topRight = new Vector2(1, 1)
    readonly bottomRight = new Vector2(1, -1)
    readonly bottomLeft = new Vector2(-1, -1)
    readonly tmpVec = new Vector3()
    lastTime: number = 0
    timer: number = 0

    constructor(readonly camera: Camera) {
    }

    onCameraMoved() {
        const now = window.performance.now()
        if (this.timer > 0 && this.lastTime) this.timer -= (now - this.lastTime)
        this.lastTime = now
        if (this.timer > 0) return
        this.timer = MAP_MAX_UPDATE_INTERVAL
        const rect: MapRendererCameraRect = {
            topLeft: {x: 0, z: 0},
            topRight: {x: 0, z: 0},
            bottomRight: {x: 0, z: 0},
            bottomLeft: {x: 0, z: 0},
        }
        this.raycaster.setFromCamera(this.topLeft, this.camera)
        if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.tmpVec)) return
        rect.topLeft.x = this.tmpVec.x
        rect.topLeft.z = this.tmpVec.z
        this.raycaster.setFromCamera(this.topRight, this.camera)
        if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.tmpVec)) return
        rect.topRight.x = this.tmpVec.x
        rect.topRight.z = this.tmpVec.z
        this.raycaster.setFromCamera(this.bottomRight, this.camera)
        if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.tmpVec)) return
        rect.bottomRight.x = this.tmpVec.x
        rect.bottomRight.z = this.tmpVec.z
        this.raycaster.setFromCamera(this.bottomLeft, this.camera)
        if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.tmpVec)) return
        rect.bottomLeft.x = this.tmpVec.x
        rect.bottomLeft.z = this.tmpVec.z
        EventBroker.publish(new UpdateRadarCamera(rect))
    }
}
