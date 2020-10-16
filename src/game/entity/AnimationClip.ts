import { AnimSubObj } from './AnimSubObj';

class AnimationClip {

    looping: boolean = false;
    firstFrame: number = null;
    lastFrame: number = null;
    frameStep: number = null;
    framesPerSecond: number = null;
    bodies: AnimSubObj[] = [];
    animationTimeout: NodeJS.Timeout = null;

    animate(frameIndex, onAnimationDone) {
        this.bodies.forEach((subObj: AnimSubObj) => {
            subObj.model.position.copy(subObj.relPos[frameIndex]);
            subObj.model.rotation.copy(subObj.relRot[frameIndex]);
            subObj.model.scale.copy(subObj.relScale[frameIndex]);
        });
        if (!(frameIndex + 1 > this.lastFrame) || this.looping) {
            const nextFrame = frameIndex + 1 > this.lastFrame ? this.firstFrame : frameIndex + 1;
            const that = this;
            this.animationTimeout = setTimeout(() => that.animate(nextFrame, onAnimationDone), 1000 / this.framesPerSecond); // TODO get this in sync with threejs
        } else if (onAnimationDone) {
            onAnimationDone();
        }
    }

    cancelAnimation() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    }

}

export { AnimationClip };
