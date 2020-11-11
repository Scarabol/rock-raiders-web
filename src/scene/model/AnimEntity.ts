import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, Object3D, Sprite, SpriteMaterial } from 'three';
import { AnimClip } from './AnimClip';
import { iGet } from '../../core/Util';
import { AnimationEntityType } from './AnimationEntityType';
import { BaseEntity } from './BaseEntity';

export class AnimEntity extends BaseEntity {

    entityType: AnimationEntityType = null;
    poly: Object3D[] = [];
    animation: AnimClip = null;
    selectionFrame: Sprite = null;

    constructor(entityType: AnimationEntityType) {
        super();
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
        // FIXME this fails for carried items, load textures somewhere else!
        this.loadTextures(); // TODO this step should be done at the end of the loading process (postLoading)
    }

}
