import { AnimSubObj } from './AnimSubObj';
import { GameState } from '../../game/model/GameState';

export class AnimClip {

    looping: boolean = false;
    transcoef: number = 1;
    firstFrame: number = null;
    lastFrame: number = null;
    framesPerSecond: number = null;
    bodies: AnimSubObj[] = [];
    animationTimeout: NodeJS.Timeout = null;

    animate(poly, frameIndex, onAnimationDone) {
        if (poly.length !== this.bodies.length) throw 'Cannot animate poly. Length differs from bodies length';
        this.bodies.forEach((body: AnimSubObj, index) => {
            poly[index].position.copy(body.relPos[frameIndex]);
            poly[index].rotation.copy(body.relRot[frameIndex]);
            poly[index].scale.copy(body.relScale[frameIndex]);
            const material = poly[index].material;
            const opacity = body.opacity[frameIndex];
            if (material && opacity !== undefined) material.opacity = opacity;
        });
        this.animationTimeout = null;
        if (!(frameIndex + 1 > this.lastFrame) || (this.looping && !onAnimationDone)) {
            const nextFrame = frameIndex + 1 > this.lastFrame ? this.firstFrame : frameIndex + 1;
            const that = this;
            this.animationTimeout = setTimeout(() => that.animate(poly, nextFrame, onAnimationDone), 1000 / this.framesPerSecond * this.transcoef / GameState.gameSpeedMultiplier); // TODO get this in sync with threejs
        } else if (onAnimationDone) {
            onAnimationDone();
        }
    }

    cancelAnimation() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
    }

}
