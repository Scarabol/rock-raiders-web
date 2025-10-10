import { ScreenLayer } from '../screen/layer/ScreenLayer'
import { SoundManager } from '../audio/SoundManager'
import { AmbientLight, BufferGeometry, DepthTexture, DirectionalLight, Float32BufferAttribute, Mesh, OrthographicCamera, PerspectiveCamera, Scene, ShaderMaterial, ShaderMaterialParameters, Texture, UniformsUtils, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three'
import { degToRad } from 'three/src/math/MathUtils'
import { clearIntervalSafe } from '../core/Util'
import { NATIVE_UPDATE_INTERVAL } from '../params'
import { AnimationGroup } from '../scene/AnimationGroup'
import { BaseRenderer } from '../screen/BaseRenderer'

class FullScreenShader extends ShaderMaterial {
    private static camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    private readonly mesh: Mesh

    constructor(parameters?: ShaderMaterialParameters) {
        super(parameters)
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3))
        geometry.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2))
        this.mesh = new Mesh(geometry, this)
    }

    dispose() {
        this.mesh.geometry.dispose()
        super.dispose()
    }

    render(renderer: WebGLRenderer) {
        renderer.render(this.mesh, FullScreenShader.camera)
    }
}

const TransparentBackgroundShader = {
    name: 'TransparentBackgroundShader',
    uniforms: {
        'tDiffuse': {value: null as Texture | null},
        'tDepth': {value: null as Texture | null},
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform highp sampler2D tDepth;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D(tDiffuse, vUv);
            if (texture2D(tDepth, vUv).x == 1.0) gl_FragColor.a = 0.0;
            gl_FragColor = sRGBTransferOETF(gl_FragColor);
        }
    `,
}

class TransparentBackgroundRenderer extends BaseRenderer {
    renderTarget?: WebGLRenderTarget
    fsShader?: FullScreenShader

    render() {
        if (!this.renderTarget) {
            this.renderTarget = new WebGLRenderTarget(0, 0, {depthTexture: new DepthTexture(0, 0)})
        }
        if (!this.fsShader) {
            const uniforms = UniformsUtils.clone(TransparentBackgroundShader.uniforms)
            uniforms.tDiffuse.value = this.renderTarget.texture
            uniforms.tDepth.value = this.renderTarget.depthTexture
            this.fsShader = new FullScreenShader({...TransparentBackgroundShader, uniforms})
        }
        if (!this.renderer) return
        const size = this.renderer.getSize(new Vector2())
        this.renderTarget.setSize(size.width, size.height)
        this.renderer.setRenderTarget(this.renderTarget)
        this.renderer.outputColorSpace
        try {
            super.render()
        } finally {
            this.renderer.setRenderTarget(null)
        }
        this.fsShader.render(this.renderer)
    }

    dispose() {
        this.fsShader?.dispose()
        this.renderTarget?.dispose()
        super.dispose()
    }
}

export class RockWipeLayer extends ScreenLayer {
    readonly renderer: TransparentBackgroundRenderer
    readonly scene: Scene
    readonly group: AnimationGroup
    readonly camera: PerspectiveCamera
    groupUpdateInterval?: NodeJS.Timeout

    constructor() {
        super()
        this.renderer = new TransparentBackgroundRenderer(NATIVE_UPDATE_INTERVAL, this.canvas, {alpha: true})
        // Camera
        const aspect = this.canvas.width / this.canvas.height
        this.camera = new PerspectiveCamera(45, aspect, 1, 100)
        this.camera.rotateY(Math.PI)
        this.camera.zoom = 2
        this.camera.position.add(new Vector3(0, 0, -5))
        this.camera.updateProjectionMatrix()
        this.renderer.camera = this.camera
        this.scene = new Scene()
        // Lights
        this.scene.add(new AmbientLight(0xffffff, 0.25))
        const light = new DirectionalLight(0xffffff, 1)
        light.position.set(2, 2, -2)
        light.rotation.set(degToRad(35), -degToRad(45), -degToRad(0), 'YXZ')
        this.scene.add(light)
        this.group = new AnimationGroup('Interface/FrontEnd/Rock_Wipe/RockWipe.lws', () => {
            this.hide()
        }).setup()
        this.scene.add(this.group)
    }

    show() {
        super.show()
        this.group.resetAnimation()
        SoundManager.playSfxSound('SFX_RockWipe')
        this.renderer.startRendering(this.scene).then()
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.groupUpdateInterval = setInterval(() => {
            this.group.update(NATIVE_UPDATE_INTERVAL)
        }, NATIVE_UPDATE_INTERVAL) // XXX Use FPS from LWS data
        return this.group.maxDurationMs
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.renderer.setSize(width, height)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
    }

    hide() {
        super.hide()
        this.groupUpdateInterval = clearIntervalSafe(this.groupUpdateInterval)
        this.group.resetAnimation()
        this.renderer.stopRendering()
    }

    dispose() {
        this.hide()
        this.scene.clear()
        this.renderer.dispose()
    }
}
