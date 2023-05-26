import { Object3D, PointLight, SpotLight, Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { ToggleAlarmEvent } from '../event/WorldEvents'
import { ALARM_LIGHT_ROTATION_SPEED, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { clearIntervalSafe } from '../core/Util'

export class TorchLightCursor extends Object3D {
    alarmLights: SpotLight[] = []
    alarmLightInterval: NodeJS.Timeout

    constructor() {
        super()
        const torchLight = new PointLight(0xffffff, 1.5, 4, 1)
        torchLight.distance *= TILESIZE
        torchLight.position.y = 2 * TILESIZE // XXX actually show torchlight at TILESIZE / 2?
        this.add(torchLight)

        this.alarmLights = [-1, 1].map((c) => {
            const alarmLight = new SpotLight(0xff0000, 0.5, 0, Math.PI / 4, 0.25)
            alarmLight.position.set(0, TILESIZE / 2, 0)
            alarmLight.target = new Object3D()
            alarmLight.target.position.set(c * TILESIZE / 8, 0, 0)
            alarmLight.add(alarmLight.target)
            alarmLight.visible = false
            this.add(alarmLight)
            return alarmLight
        })

        EventBus.registerEventListener(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => {
            if (event.alarmState) {
                this.alarmLights.forEach((l) => l.visible = true)
                this.alarmLightInterval = setInterval(() => {
                    this.alarmLights.forEach((l) => {
                        l.target.position.applyAxisAngle(new Vector3(0, 1, 0), ALARM_LIGHT_ROTATION_SPEED)
                    })
                }, NATIVE_UPDATE_INTERVAL)
            } else if (this.alarmLightInterval) {
                this.alarmLights.forEach((l) => l.visible = false)
                this.alarmLightInterval = clearIntervalSafe(this.alarmLightInterval)
            }
        })
    }

    dispose() {
        this.alarmLightInterval = clearIntervalSafe(this.alarmLightInterval)
    }
}
