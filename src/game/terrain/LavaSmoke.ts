import { Object3D, SpriteMaterial, Vector3, Vector3Like } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { PRNG } from '../factory/PRNG'
import { Surface } from '../terrain/Surface'
import { SceneManager } from '../SceneManager'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { BaseSpriteParticle, ParticleEmitterComponent } from '../component/ParticleEmitterComponent'

export class LavaSmoke extends BaseSpriteParticle {
    velocity: Vector3

    constructor(
        sceneMgr: SceneManager,
        parent: Object3D,
        position: Vector3Like,
    ) {
        const material = new SpriteMaterial({
            alphaMap: ResourceManager.getTexture(`MiscAnims/Smoke/SMOKE${PRNG.animation.randInt(2)}.BMP`),
            rotation: 2 * Math.PI * PRNG.animation.random(),
            color: 0xf7bb0b,
        })
        super(sceneMgr, parent, position, 10000, material)
        this.velocity = new Vector3(PRNG.animation.random() * 0.04, 0.15, PRNG.animation.random() * 0.04)
    }

    updateParticle(elapsedMs: number, lifePortion: number): void {
        this.position.addScaledVector(this.velocity, elapsedMs / NATIVE_UPDATE_INTERVAL)
        const lifePortionSqrt = Math.sqrt(lifePortion)
        const scale = 20 * lifePortionSqrt
        this.scale.set(scale, scale, 1)
        this.material.opacity = 0.5 * (1 - lifePortionSqrt)
    }

    static addToSurface(surface: Surface, prerun: boolean = false) {
        if (PRNG.terrain.random() >= 0.3) {
            return
        }
        const worldMgr = surface.worldMgr
        const position = surface.getRandomPosition()
        const particleEmitter = new ParticleEmitterComponent(() => new this(
            worldMgr.sceneMgr,
            worldMgr.sceneMgr.scene,
            worldMgr.sceneMgr.getFloorPosition(position),
        ), 1000, prerun ? 10000 : 0)
        worldMgr.ecs.addComponent(surface.entity, particleEmitter)
    }
}
