import { Object3D, PointLight, SpotLight, Vector3 } from 'three'
import { EventKey } from '../event/EventKeyEnum'
import { ToggleAlarmEvent } from '../event/WorldEvents'
import { TILESIZE } from '../params'
import { EventBroker } from '../event/EventBroker'

export class TorchLightCursor extends Object3D {
    readonly changeListener: (event: { target: { target: Vector3 } }) => void = (e) => {
        this.position.copy(e.target.target)
    }

    alarmLights: SpotLight[] = []

    constructor() {
        super()
        const torchLight = new PointLight(0xffffff, 9000, 4, 2)
        torchLight.distance *= TILESIZE
        torchLight.position.y = 2 * TILESIZE
        torchLight.castShadow = true
        this.add(torchLight)

        this.alarmLights = [-1, 1].map((c) => {
            const alarmLight = new SpotLight(0xff0000, 3000, 0, Math.PI / 4, 0.25)
            alarmLight.position.set(0, TILESIZE / 2, 0)
            alarmLight.target = new Object3D()
            alarmLight.target.position.set(c * TILESIZE / 8, 0, 0)
            alarmLight.add(alarmLight.target)
            alarmLight.visible = false
            this.add(alarmLight)
            return alarmLight
        })

        EventBroker.subscribe(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => {
            this.alarmLights.forEach((l) => l.visible = event.alarmState)
        })
    }

    update(elapsedMs: number) {
        const rotationRad = Math.PI / 1000 * elapsedMs
        this.alarmLights.forEach((l) => l.target.position.applyAxisAngle(Object3D.DEFAULT_UP, rotationRad))
    }
}
