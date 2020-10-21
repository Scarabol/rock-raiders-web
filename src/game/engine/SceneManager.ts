import { AmbientLight, MOUSE, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from 'three';
import { DebugHelper } from '../../core/DebugHelper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class SceneManager {

    maxFps: number = 30; // most animations use 25 fps so this should be enough
    renderer: WebGLRenderer;
    debugHelper: DebugHelper = new DebugHelper();
    renderInterval;
    animRequest;
    scene: Scene;
    camera: PerspectiveCamera;
    amb: AmbientLight;
    light: PointLight;
    axisHelper;
    controls: OrbitControls;
    cursorTorchlight: PointLight;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new WebGLRenderer({antialias: true, canvas: canvas});
        this.renderer.setClearColor(0x000000);

        this.scene = new Scene();
        // this.scene.fog = new FogExp2(0x6e6e9b, 0.05); // TODO derive from level config

        this.amb = new AmbientLight(0x808080); // TODO use "cave" light setup
        this.scene.add(this.amb);

        this.cursorTorchlight = new PointLight(0xffffff, 1, 7, 2);
        this.scene.add(this.cursorTorchlight);

        this.camera = new PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 5000); // TODO make these params configurable

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.screenSpacePanning = false;
        this.controls.mouseButtons = {LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN};
        // this.controls.maxPolarAngle = Math.PI * 0.45; // TODO dynamically adapt to terrain height at camera position
    }

    startRendering() {
        this.debugHelper.show();
        this.renderInterval = setInterval(() => { // TODO cancel interval when not in game mode
            this.animRequest = requestAnimationFrame(() => {
                this.debugHelper.renderStart();
                this.renderer.render(this.scene, this.camera);
                this.debugHelper.renderDone();
            });
        }, 1000 / this.maxFps);
    }

    stopRendering() {
        this.debugHelper.hide();
        if (this.renderInterval) {
            clearInterval(this.renderInterval);
            this.renderInterval = null;
        }
        if (this.animRequest) {
            cancelAnimationFrame(this.animRequest);
            this.animRequest = null;
        }
    }

}

export { SceneManager };
