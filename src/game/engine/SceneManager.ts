import * as THREE from 'three';
import { DebugHelper } from '../../core/DebugHelper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class SceneManager {

    maxFps: number = 30; // most animations use 25 fps so this should be enough
    renderer: THREE.WebGLRenderer;
    debugHelper: DebugHelper = new DebugHelper();
    renderInterval;
    animRequest;
    scene;
    camera;
    amb;
    light;
    axisHelper;
    controls: OrbitControls;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
        this.renderer.setClearColor(0xa0a0a0); // TODO adjust clear color to black (or level???)

        this.scene = new THREE.Scene();
        // this.scene.fog = new THREE.FogExp2(0x6e6e9b, 0.05); // TODO derive from level config

        this.amb = new THREE.AmbientLight(0x808080); // TODO use "cave" light setup
        this.scene.add(this.amb);

        this.light = new THREE.PointLight(0xffffff, 1, 1000);
        this.light.position.set(20, 20, 20); // TODO follow mouse cursor 3d position
        this.scene.add(this.light);

        this.axisHelper = new THREE.AxesHelper(20);
        this.scene.add(this.axisHelper);

        this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.x = 15; // TODO dynamically position camera on each level start
        this.camera.position.y = 18;
        this.camera.position.z = 18;
        // this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.screenSpacePanning = false;
        this.controls.mouseButtons = {LEFT: null, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.PAN};
        this.controls.maxPolarAngle = Math.PI * 0.45; // TODO dynamically adapt to terrain height at camera position

        this.controls.target.set(0, this.camera.position.y / 2, 0); // TODO dynamically look at toolstation
        this.controls.update();
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
