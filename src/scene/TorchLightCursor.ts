import { Object3D, PointLight, SpotLight } from 'three'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { ToggleAlarmEvent } from '../event/WorldEvents'
import { TILESIZE } from '../params'

export class TorchLightCursor extends Object3D {
    alarmLights: SpotLight[] = []

    constructor() {
        super()
        const torchLight = new PointLight(0xffffff, 1.5, 4, 2)
        torchLight.distance *= TILESIZE
        torchLight.position.y = 2 * TILESIZE
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
            this.alarmLights.forEach((l) => l.visible = event.alarmState)
        })
    }

    update(elapsedMs: number) {
        const rotationRad = Math.PI / 1000 * elapsedMs
        this.alarmLights.forEach((l) => l.target.position.applyAxisAngle(Object3D.DEFAULT_UP, rotationRad))
    }
}
