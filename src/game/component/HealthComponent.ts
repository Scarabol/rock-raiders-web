import { AbstractGameComponent } from '../ECS'

export class HealthComponent extends AbstractGameComponent {
    health: number = 1

    kill(): void {
        this.health = 0
        this.markDirty()
    }

    isDead(): boolean {
        return this.health <= 0
    }
}
