import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AnimEntityLoader } from "./game/entity/AnimEntityLoader";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = true;
renderer.setClearColor(0xa0a0a0, 1);

document.body.appendChild(renderer.domElement);

const amb = new THREE.AmbientLight(0x808080); // soft white light
scene.add(amb);

const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(20, 20, 20);
scene.add(light);

const axisHelper = new THREE.AxesHelper(20);
scene.add(axisHelper);

camera.position.x = 12;
camera.position.y = 15;
camera.position.z = 15;
camera.lookAt(new THREE.Vector3(0, 0, 0));

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, camera.position.y / 2, 0);
controls.update();

const render = function () {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};

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

render();
