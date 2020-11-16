import { Box3, CanvasTexture, Mesh, MeshBasicMaterial, MeshPhongMaterial, Object3D, SphereGeometry, Sprite, SpriteMaterial, Vector3 } from 'three';
import { AnimClip } from './AnimClip';
import { iGet } from '../../../core/Util';
import { AnimationEntityType } from './AnimationEntityType';
import { BaseEntity } from '../BaseEntity';
import { AnimSubObj } from './AnimSubObj';

export abstract class AnimEntity extends BaseEntity {

    entityType: AnimationEntityType = null;
    poly: Object3D[] = [];
    animation: AnimClip = null;
    animationTimeout: NodeJS.Timeout = null;
    selectionFrame: Sprite = null;
    pickSphere: Mesh = null;
    pickSphereRadius: number = 10;
    selectionFrameSize: number = 10;

    protected constructor(entityType: AnimationEntityType) {
        super();
        this.entityType = entityType;
    }

    setActivity(keyname, onAnimationDone = null, iterations = 1) {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
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
            this.animate(0, onAnimationDone, iterations);
        } else {
            console.warn('Activity ' + keyname + ' has no animation defined yet');
        }
        this.createPickSphere();
    }

    animate(frameIndex, onAnimationDone, iterations) {
        if (this.poly.length !== this.animation.bodies.length) throw 'Cannot animate poly. Length differs from bodies length';
        this.animation.bodies.forEach((body: AnimSubObj, index) => {
            const p = this.poly[index];
            p.position.copy(body.relPos[frameIndex]);
            p.rotation.copy(body.relRot[frameIndex]);
            p.scale.copy(body.relScale[frameIndex]);
            if (p.hasOwnProperty('material')) {
                const material = p['material'];
                const opacity = body.opacity[frameIndex];
                if (material && opacity !== undefined) {
                    const matArr = Array.isArray(material) ? material : [material];
                    matArr.forEach((mat: MeshPhongMaterial) => {
                        mat.opacity = opacity;
                        mat.transparent = true;
                        mat.alphaTest = 0;
                    });
                }
            }
        });
        this.animationTimeout = null;
        if (!(frameIndex + 1 > this.animation.lastFrame) || (this.animation.looping && (!onAnimationDone || iterations > 1))) {
            let nextFrame = frameIndex + 1;
            if (nextFrame > this.animation.lastFrame) {
                nextFrame = this.animation.firstFrame;
                iterations--;
            }
            const that = this;
            this.animationTimeout = setTimeout(() => that.animate(nextFrame, onAnimationDone, iterations), 1000 / this.animation.framesPerSecond * this.animation.transcoef); // TODO get this in sync with threejs
        } else if (onAnimationDone) {
            onAnimationDone();
        }
    }

    createPickSphere() {
        if (this.pickSphere) return;
        const center = new Vector3();
        new Box3().setFromObject(this.group).getCenter(center);
        center.sub(this.group.position);
        const geometry = new SphereGeometry(this.pickSphereRadius, this.pickSphereRadius, this.pickSphereRadius);
        const material = new MeshBasicMaterial({color: 0xffff00, visible: false}); // change to true for debugging
        this.pickSphere = new Mesh(geometry, material);
        this.pickSphere.userData = {selectable: this};
        this.pickSphere.position.copy(center);
        this.group.add(this.pickSphere);

        const ctx = document.createElement('canvas').getContext('2d');
        const size = 128;
        ctx.canvas.width = size; // TODO read from cfg?
        ctx.canvas.height = size;
        ctx.fillStyle = '#0f0';
        const strength = 50 / this.selectionFrameSize;
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
        const selectionMaterial = new SpriteMaterial({map: texture, depthTest: false});
        this.selectionFrame = new Sprite(selectionMaterial);
        this.selectionFrame.position.copy(center);
        this.selectionFrame.scale.set(this.selectionFrameSize, this.selectionFrameSize, this.selectionFrameSize);
        this.selectionFrame.visible = false;
        this.group.add(this.selectionFrame);
    }

}
