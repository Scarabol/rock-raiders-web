import { Camera, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from 'three'
import { cancelAnimationFrameSafe, clearIntervalSafe } from '../core/Util'
import { TILESIZE } from '../params'
import { EventKey } from '../event/EventKeyEnum'
import { FollowerSetCanvasEvent, FollowerSetLookAtEvent } from '../event/LocalEvents'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { GreenScaleShader } from './GreenScaleShader'
import { ECS, GameEntity } from '../game/ECS'
import { AnimatedSceneEntityComponent } from '../game/component/AnimatedSceneEntityComponent'
import { BeamUpComponent } from '../game/component/BeamUpComponent'
import { EventBroker } from '../event/EventBroker'
import { SpriteImage } from '../core/Sprite'

export class FollowerRenderer extends WebGLRenderer {
    static readonly MAX_FPS = 30
    readonly camera: Camera
    readonly composer: EffectComposer
    trackEntity: GameEntity
    started: boolean = false
    renderInterval: NodeJS.Timeout
    lastAnimationRequest: number
    angle: number = 0

    constructor(readonly canvas: SpriteImage, readonly scene: Scene, readonly ecs: ECS) {
        super({antialias: true, canvas: canvas, powerPreference: 'high-performance'})
        this.camera = new PerspectiveCamera(45, 1, 0.1, 200)
        this.composer = new EffectComposer(this)
        this.composer.addPass(new RenderPass(scene, this.camera))
        this.composer.addPass(new ShaderPass(GreenScaleShader))
        this.composer.addPass(new OutputPass())
        EventBroker.subscribe(EventKey.FOLLOWER_RENDER_START, () => {
            this.started = true
            this.startRendering()
        })
        EventBroker.subscribe(EventKey.FOLLOWER_RENDER_STOP, () => {
            this.started = false
            this.renderInterval = clearIntervalSafe(this.renderInterval)
        })
        EventBroker.subscribe(EventKey.PAUSE_GAME, () => {
            this.renderInterval = clearIntervalSafe(this.renderInterval)
        })
        EventBroker.subscribe(EventKey.UNPAUSE_GAME, () => {
            if (this.started) this.startRendering()
        })
        EventBroker.subscribe(EventKey.FOLLOWER_SET_LOOK_AT, (event: FollowerSetLookAtEvent) => {
            this.trackEntity = event.entity
        })
    }

    startRendering() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        if (!this.trackEntity) return
        this.renderInterval = setInterval(() => {
            const components = this.ecs.getComponents(this.trackEntity)
            const lookAtPosition = components?.get(AnimatedSceneEntityComponent)?.sceneEntity?.getWorldPosition(new Vector3())
            if (components?.has(BeamUpComponent) || !lookAtPosition) {
                this.trackEntity = null
                this.clear()
                this.renderInterval = clearIntervalSafe(this.renderInterval)
                EventBroker.publish(new FollowerSetCanvasEvent(null))
                return
            }
            this.angle += Math.PI / 180 / FollowerRenderer.MAX_FPS * 5
            const off = new Vector2(TILESIZE, 0).rotateAround(new Vector2(0, 0), this.angle)
            this.camera.position.set(lookAtPosition.x + off.x, lookAtPosition.y + TILESIZE * 1.333, lookAtPosition.z + off.y)
            this.camera.lookAt(lookAtPosition)
            this.lastAnimationRequest = cancelAnimationFrameSafe(this.lastAnimationRequest)
            this.lastAnimationRequest = requestAnimationFrame(() => this.composer.render())
        }, 1000 / FollowerRenderer.MAX_FPS)
        EventBroker.publish(new FollowerSetCanvasEvent(this.canvas))
    }

    dispose() {
        this.renderInterval = clearIntervalSafe(this.renderInterval)
        super.dispose()
    }
}
