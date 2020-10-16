import { AnimSubObj } from './AnimSubObj';

class AnimationClip {

    firstFrame: number = null;
    lastFrame: number = null;
    frameStep: number = null;
    framesPerSecond: number = null;
    bodies: AnimSubObj[] = [];
    animationTimeout: NodeJS.Timeout = null;

    animate(frameIndex) {
        this.bodies.forEach((subObj: AnimSubObj) => {
            subObj.model.position.copy(subObj.relPos[frameIndex]);
            subObj.model.rotation.copy(subObj.relRot[frameIndex]);
            subObj.model.scale.copy(subObj.relScale[frameIndex]);
        });
        const nextFrame = frameIndex + 1 > this.lastFrame ? this.firstFrame : frameIndex + 1;
        const that = this;
        this.animationTimeout = setTimeout(() => that.animate(nextFrame), 1000 / this.framesPerSecond); // TODO get this in sync with threejs
    }

    cancelAnimation() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    }

}

export { AnimationClip };
