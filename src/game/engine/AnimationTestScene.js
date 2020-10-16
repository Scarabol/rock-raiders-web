import { DebugHelper } from '../../core/DebugHelper';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AnimEntityLoader } from '../entity/AnimEntityLoader';

const MAX_FPS = 25;

const debugHelper = new DebugHelper();

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight); // TODO adjust render size on window resize
renderer.sortObjects = true;
renderer.setClearColor(0xa0a0a0); // TODO adjust clear color to black

const scene = new THREE.Scene();
// scene.fog = new THREE.FogExp2(0x6e6e9b, 0.05);

const amb = new THREE.AmbientLight(0x808080); // TODO use "cave" light setup
scene.add(amb);

const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(20, 20, 20); // TODO follow mouse cursor 3d position
scene.add(light);

// const axisHelper = new THREE.AxesHelper(20);
// scene.add(axisHelper);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 15; // TODO dynamically position camera on each level start
camera.position.y = 18;
camera.position.z = 18;
// camera.lookAt(new THREE.Vector3(0, 0, 0));

const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = false;
controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.PAN };
controls.maxPolarAngle = Math.PI * 0.45; // TODO dynamically adapt to terrain height at camera position

controls.target.set(0, camera.position.y / 2, 0); // TODO dynamically look at toolstation
controls.update();

new AnimEntityLoader().load('LegoRR0/mini-figures/pilot/pilot.ae', function (animFile) {

    const entity1 = animFile.createAnimationEntity();
    scene.add(entity1.group);

    function animRun() {
        entity1.setActivity('run');
        setTimeout(animWalk, 2000);
    }

    function animWalk() {
        entity1.setActivity('walk');
        setTimeout(animRun, 2000);
    }

    animRun();

    // const entity2 = animFile.createAnimationEntity();
    // entity2.group.position.set(-10, 0, 0);
    // scene.add(entity2.group);
    //
    // setTimeout(() => {
    //     entity2.setActivity('walk');
    // }, 3000);
    //
    // const entity3 = animFile.createAnimationEntity();
    // entity3.group.position.set(-20, 0, 0);
    // scene.add(entity3.group);
    //
    // setTimeout(() => {
    //     entity3.setActivity('run');
    // }, 3000);

});

new AnimEntityLoader().load('LegoRR0/creatures/rmonster/rmonster.ae', function (animFile) {

    const entity = animFile.createAnimationEntity();
    entity.group.position.set(-10, 0, -30);
    scene.add(entity.group);

    setTimeout(() => {
        entity.setActivity('walk');
    }, 3000);

});

setInterval(() => { // TODO cancel interval when not in game mode
    requestAnimationFrame(() => {
        debugHelper.renderStart();

        renderer.render(scene, camera);

        debugHelper.renderDone();
    });
}, 1000 / MAX_FPS);
