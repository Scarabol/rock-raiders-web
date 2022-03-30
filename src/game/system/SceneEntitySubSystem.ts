import { AnimatedSceneEntityComponent } from '../component/common/AnimatedSceneEntityComponent'
import { AbstractSubSystem } from './AbstractSubSystem'

export class SceneEntitySubSystem extends AbstractSubSystem<AnimatedSceneEntityComponent> {
    constructor() {
        super(AnimatedSceneEntityComponent)
    }

    update(elapsedMs: number) {
        this.components.forEach((c) => c.update(elapsedMs))
    }
}
