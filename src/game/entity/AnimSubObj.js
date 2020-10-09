import * as THREE from "three";

function AnimSubObj() {
    this.name = null;
    this.filename = null;
    this.relPos = [];
    this.relRot = [];
    this.relScale = [];
    this.parentObjInd = null;
    this.model = null;
}

AnimSubObj.prototype = {

    degToRad: function (deg) {
        return deg / 180 * Math.PI;
    },

    radVec: function (degX, degY, degZ) {
        return new THREE.Euler(this.degToRad(degY), this.degToRad(degX), this.degToRad(degZ), 'YXZ');
    },

    setFrameAndFollowing: function (animationFrameIndex, lastFrame, infos) {
        this.relPos[animationFrameIndex] = new THREE.Vector3(infos[0], infos[1], infos[2]);
        this.relRot[animationFrameIndex] = this.radVec(infos[3], infos[4], infos[5]);
        this.relScale[animationFrameIndex] = new THREE.Vector3(infos[6], infos[7], infos[8]);
        for (let c = animationFrameIndex; c <= lastFrame; c++) {
            // console.log('copying animation from frame ' + animationFrameIndex + ' to ' + c);
            this.relPos[c] = this.relPos[animationFrameIndex];
            this.relRot[c] = this.relRot[animationFrameIndex];
            this.relScale[c] = this.relScale[animationFrameIndex];
        }
    }

}

export { AnimSubObj }
