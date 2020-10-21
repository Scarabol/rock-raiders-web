import { AxesHelper, CanvasTexture, ClampToEdgeWrapping, Group, LinearFilter, MeshPhongMaterial, Object3D, RGBAFormat, Sprite, SpriteMaterial } from 'three';
import { AnimationClip } from './AnimationClip';
import { iGet } from '../../core/Util';
import { ResourceManager } from '../engine/ResourceManager';
import { Selectable } from '../model/Selectable';

export class AnimationEntity implements Selectable {

    poly: Object3D[] = [];
    group: Group = new Group();
    animation: AnimationClip = null;
    mediumPoly: {} = null; // TODO move to ResourceManager#getPoly
    highPoly: {} = null; // TODO move to ResourceManager#getPoly
    fPPoly: {} = null; // TODO move to ResourceManager#getPoly
    activities = {};
    selectionFrame: Sprite = null;

    constructor() {
        this.group.userData = {'selectable': this};
        this.group.add(new AxesHelper(40));

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
        this.selectionFrame.position.y = 40 / 4; // TODO position with bounding box
        this.selectionFrame.scale.set(40, 40, 40).multiplyScalar(0.5); // TODO scale with bounding box
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
            this.poly = []; // TODO need dispose old ones?
            // bodies are primarily defined in animation and second in high/medium/low poly groups
            this.animation.bodies.forEach((body) => {
                let model;
                model = body.model.clone(true); // FIXME pick meshes from high/medium poly
                this.poly.push(model);
            });
            this.animation.bodies.forEach((body, index) => { // not all bodies may have been added in first iteration
                const polyPart = this.poly[index];
                const parentInd = body.parentObjInd;
                if (parentInd !== undefined && parentInd !== null) { // can be 0
                    this.poly[parentInd].add(polyPart);
                } else {
                    this.group.add(polyPart);
                }
            });
            this.animation.animate(this.poly,0, onAnimationDone);
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
