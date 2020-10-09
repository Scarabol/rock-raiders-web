function AnimationClip() {
    this.firstFrame = null;
    this.lastFrame = null;
    this.frameStep = null;
    this.framesPerSecond = null;
    this.bodies = [];
    this.animationTimeout = null;
}

AnimationClip.prototype = {

    animate: function (frameIndex) {
        // console.log('Animating frame '+frameIndex);
        this.bodies.forEach((subObj) => {
            // console.log(subObj.relPos);
            subObj.model.position.copy(subObj.relPos[frameIndex]);
            subObj.model.rotation.copy(subObj.relRot[frameIndex]);
            subObj.model.scale.copy(subObj.relScale[frameIndex]);
        });
        const nextFrame = frameIndex + 1 > this.lastFrame ? this.firstFrame : frameIndex + 1;
        const that = this;
        this.animationTimeout = setTimeout(() => that.animate(nextFrame), 1000 / this.framesPerSecond); // TODO get this in sync with threejs
    },

    cancelAnimation: function () {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
        }
    },

}

export { AnimationClip }
