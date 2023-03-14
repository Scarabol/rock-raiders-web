import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'

export class HealthComponent implements GameComponent {
    readonly onDeathListener: (() => unknown)[] = []
    readonly onChangeListener: ((health: number) => unknown)[] = []
    entity: AbstractGameEntity
    health: number = 1

    setupComponent(entity: AbstractGameEntity) {
        this.entity = entity
    }

    disposeComponent() {
    }

    addOnDeathListener(callback: () => unknown): this {
        this.onDeathListener.add(callback)
        return this
    }

    addOnChangeListener(callback: (health: number) => unknown): this {
        this.onChangeListener.add(callback)
        return this
    }

    changeHealth(health: number): void {
        if (this.health === health) return
        this.health = health
        if (this.health <= 0) {
            this.onDeathListener.forEach((listener) => listener())
        }
    }
}
