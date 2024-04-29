import { Group } from 'three'
import { Updatable } from './model/Updateable'

export abstract class SceneEntity extends Group implements Updatable {
    abstract update(elapsedMs: number): void

    abstract dispose(): void
}
