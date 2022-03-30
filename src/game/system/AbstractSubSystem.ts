import { Generic } from '../../core/Util'
import { GameComponent } from '../model/GameComponent'
import { Updatable } from '../model/Updateable'

export abstract class AbstractSubSystem<T extends GameComponent> implements Updatable {
    protected readonly components: T[] = []

    protected constructor(readonly type: Generic<T>) {
    }

    reset() {
        this.components.forEach((c) => c.disposeComponent())
        this.components.length = 0
    }

    abstract update(elapsedMs: number)

    registerComponent(component: GameComponent) {
        if (!(component instanceof this.type)) return
        this.components.push(component)
    }

    unregisterComponent(component: GameComponent) {
        if (!(component instanceof this.type)) return
        this.components.remove(component)
    }
}
