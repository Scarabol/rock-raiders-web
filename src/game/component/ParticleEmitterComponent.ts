import { Object3D, Sprite, Vector3Like } from 'three'
import { AbstractGameComponent } from '../ECS'
import { PositionComponent } from './PositionComponent'
import { Updatable } from '../model/Updateable'
import { SceneManager } from '../SceneManager'

export abstract class BaseSpriteParticle extends Sprite implements Updatable {
    totalElapsedMs: number = 0
 
    constructor(
        public sceneMgr: SceneManager,
        parent: Object3D,
        position: Vector3Like,
        public lifetimeMs: number,
        ...args: ConstructorParameters<typeof Sprite>
    ) {
        super(...args)
        this.sceneMgr.addSprite(this)
        parent.add(this)
        this.position.copy(position)
    }

    update(elapsedMs: number) {
        this.totalElapsedMs += elapsedMs
        if (this.totalElapsedMs > this.lifetimeMs) {
            this.removeFromParent()
            this.sceneMgr.removeSprite(this)
            this.material.dispose()
            return
        }
        this.updateParticle(elapsedMs, this.totalElapsedMs / this.lifetimeMs)
    }

    abstract updateParticle(elapsedMs: number, lifePortion: number): void
}

export class ParticleEmitterComponent extends AbstractGameComponent {

    constructor(
        public spawnParticle: (positionComponent?: PositionComponent) => Updatable,
        public spawnIntervalMs: number,
        public remainingSpawnMs: number = 0
    ) {
        super()
    }

    update(elapsedMs: number, positionComponent?: PositionComponent) {
        for (
            this.remainingSpawnMs += elapsedMs;
            this.remainingSpawnMs >= this.spawnIntervalMs;
        ) {
            this.remainingSpawnMs -= this.spawnIntervalMs
            try {
                const particle = this.spawnParticle(positionComponent)
                particle.update(this.remainingSpawnMs)
            } catch (e) {
                console.error(e)
            }
            if (this.spawnIntervalMs <= 0) break
        }
    }
}
