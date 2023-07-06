import { AbstractGameComponent } from '../ECS'

export class HealthComponent extends AbstractGameComponent {
    health: number = 100
    maxHealth: number = 100

    constructor(readonly triggerAlarm: boolean) {
        super()
    }
}
