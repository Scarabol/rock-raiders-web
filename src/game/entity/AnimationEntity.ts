import { CanvasTexture, ClampToEdgeWrapping, Group, LinearFilter, MeshPhongMaterial, Object3D, RGBAFormat, Sprite, SpriteMaterial } from 'three';
import { AnimationClip } from './AnimationClip';
import { iGet } from '../../core/Util';
import { ResourceManager } from '../engine/ResourceManager';
import { Selectable } from '../model/Selectable';

export class AnimationEntity implements Selectable {

    poly = null;
    group: Group = new Group();
    animation: AnimationClip = null;
    scale: number = null;
    cameraNullName = null;
    cameraNullFrames = null;
    cameraFlipDir = null;
    drillNullName = null;
    carryNullName = null;
    mediumPoly = null;
    highPoly = null;
    fPPoly = null;
    activities = {};
    selectionFrame: Sprite = null;

    constructor() {
        this.group.userData = {'selectable': this};

        const ctx = document.createElement('canvas').getContext('2d');
        const size = 128;
        ctx.canvas.width = size; // TODO read from cfg?
        ctx.canvas.height = size;
        ctx.fillStyle = '#0f0';
        const strength = size / 20;
        const length = size / 3;
        ctx.fillRect(0, 0, length, strength);
        ctx.fillRect(0, 0, strength, length);
        ctx.fillRect(size - length, 0, length, strength);
        ctx.fillRect(size - strength, 0, strength, length);
        ctx.fillRect(size - strength, size - length, strength, length);
        ctx.fillRect(size - length, size - strength, length, strength);
        ctx.fillRect(0, size - strength, length, strength);
        ctx.fillRect(0, size - length, strength, length);
        const texture = new CanvasTexture(ctx.canvas);
        // because our canvas is likely not a power of 2
        // in both dimensions set the filtering appropriately.
        texture.minFilter = LinearFilter;
        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = ClampToEdgeWrapping;
        const selectionMaterial = new SpriteMaterial({map: texture, transparent: true});
        this.selectionFrame = new Sprite(selectionMaterial);
        this.selectionFrame.position.y = 40 / 4; // TODO scale with tile size and bounding box
        this.selectionFrame.scale.set(40, 40, 40).multiplyScalar(0.5); // TODO scale with tile size
        this.selectionFrame.visible = false;
        this.group.add(this.selectionFrame);
    }

    setActivity(keyname, onAnimationDone = null) {
        if (this.animation) this.animation.cancelAnimation();
        const activity = iGet(this.activities, keyname);
        if (!activity) {
            console.error('Activity \'' + keyname + '\' unknown');
            console.log(this.activities);
            return;
        }
        if (activity.animation) {
            this.animation = activity.animation;
            if (this.poly) {
                this.animation.bodies.filter((body) => body.name.toLowerCase() !== 'null')
                    .forEach((body) => body.model = iGet(this.poly, body.name) || new Group());
            }
            this.animation.bodies.forEach((subObj) => {
                if (subObj.parentObjInd) {
                    this.animation.bodies[subObj.parentObjInd - 1].model.add(subObj.model);
                } else {
                    this.group.add(subObj.model);
                }
            });
            this.animation.animate(0, onAnimationDone);
        } else {
            console.warn('Activity ' + keyname + ' has no animation defined yet');
        }
    }

    loadTextures(grp: Object3D[] = [this.group]) { // TODO this step should be done at the end of the loading process (postLoading)
        const that = this;
        if (grp) {
            grp.forEach((obj) => {
                that.handleObject(obj);
                that.loadTextures(obj.children);
            });
        } else {
            console.log('not a group');
        }
    }

    handleObject(obj) {
        if (obj && obj.material && Array.isArray(obj.material)) {
            obj.material.forEach((mat: MeshPhongMaterial) => {
                if (mat.userData && mat.userData['textureFilename']) {
                    let textureFilename = mat.userData['textureFilename'];
                    // console.log('lazy loading texture from ' + textureFilename);
                    mat.map = ResourceManager.getTexture(textureFilename);
                    mat.transparent = mat.map.format === RGBAFormat;
                    if (mat.color) mat.color = null; // no need for color, when color map (texture) in use
                } else {
                    // console.log('no userdata set for material');
                }
            });
        } else {
            // console.log('not an object or no material');
        }
    }

    select(): Selectable {
        this.selectionFrame.visible = true;
        return this;
    }

    deselect() {
        this.selectionFrame.visible = false;
    }

}
