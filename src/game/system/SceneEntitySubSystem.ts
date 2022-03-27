import { AbstractSubSystem } from './AbstractSubSystem'
import { AnimatedSceneEntityComponent } from '../component/common/AnimatedSceneEntityComponent'

export class SceneEntitySubSystem extends AbstractSubSystem<AnimatedSceneEntityComponent> {
    constructor() {
        super(AnimatedSceneEntityComponent)
    }

    update(elapsedMs: number) {
        this.components.forEach((c) => c.update(elapsedMs))
    }
}
