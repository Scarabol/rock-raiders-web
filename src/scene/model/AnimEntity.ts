import { CanvasTexture, ClampToEdgeWrapping, Group, LinearFilter, MeshPhongMaterial, Object3D, RGBAFormat, Sprite, SpriteMaterial } from 'three';
import { AnimClip } from './AnimClip';
import { iGet } from '../../core/Util';
import { ResourceManager } from '../../resource/ResourceManager';
import { AnimationEntityType } from './AnimationEntityType';

export class AnimEntity {

    entityType: AnimationEntityType = null;
    poly: Object3D[] = [];
    group: Group = new Group();
    animation: AnimClip = null;
    selectionFrame: Sprite = null;

    constructor(entityType: AnimationEntityType) {
        this.entityType = entityType;

        // TODO render selection frame on billboard layer or handle this in layer itself?
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
        const activity = iGet(this.entityType.activities, keyname);
        if (!activity) {
            console.error('Activity \'' + keyname + '\' unknown');
            console.log(this.entityType.activities);
            return;
        }
        if (activity.animation) {
            this.animation = activity.animation;
            this.group.remove(...this.poly);
            this.poly = [];
            // bodies are defined in animation and second in high/medium/low poly groups
            this.animation.bodies.forEach((body) => {
                let model = iGet(this.entityType.highPoly, body.name);
                if (!model) model = iGet(this.entityType.mediumPoly, body.name);
                if (!model) model = body.model;
                this.poly.push(model.clone(true));
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
            this.animation.animate(this.poly, 0, onAnimationDone);
        } else {
            console.warn('Activity ' + keyname + ' has no animation defined yet');
        }
        this.loadTextures(); // TODO this step should be done at the end of the loading process (postLoading)
    }

    loadTextures(grp: Object3D[] = [this.group]) {
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
                    const textureFilename = mat.userData['textureFilename'];
                    if (mat.userData && mat.userData['sequenceTexture']) {
                        // FIXME reimplement sequence textures
                        // const match = textureFilename.match(/(\D+)0+(\d+)\..+/);
                        // const basename = match[1];
                        // const seqStart = Number(match[2]);
                        // const sequenceNames = ResourceManager.wadLoader.wad0File.filterEntryNames(basename);
                        // const lastNum = sequenceNames.length - 1;
                        // let seqNum = seqStart;
                        // setInterval(() => {
                        //     mat.map = ResourceManager.getTexture(sequenceNames[seqNum - seqStart]);
                        //     seqNum++;
                        //     if (seqNum > lastNum) seqNum = seqStart;
                        // }, 1000 / 5); // TODO 5? FPS for texture animations?
                    }
                    // console.log('lazy loading texture from ' + textureFilename);
                    mat.map = ResourceManager.getTexture(textureFilename);
                    mat.transparent = mat.map.format === RGBAFormat;
                    mat.color = null; // no need for color, when color map (texture) in use
                } else {
                    // console.log('no userdata set for material');
                }
            });
        } else {
            // console.log('not an object or no material');
        }
    }

}
