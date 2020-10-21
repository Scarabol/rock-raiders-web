import * as THREE from 'three';
import { MathUtils, Object3D, Vector3 } from 'three';
import degToRad = MathUtils.degToRad;

export class AnimSubObj {

    name: string = '';
    filename: string = '';
    relPos: Vector3 = new Vector3(0, 0, 0);
    relRot: Vector3 = new Vector3(0, 0, 0);
    relScale: Vector3 = new Vector3(1, 1, 1);
    parentObjInd: number = null;
    model: Object3D = null;

    radVec(degX: number, degY: number, degZ: number) {
        return new THREE.Euler(degToRad(degY), degToRad(degX), degToRad(degZ), 'YXZ');
    }

    setFrameAndFollowing(animationFrameIndex: number, lastFrame: number, infos: number[]) {
        this.relPos[animationFrameIndex] = new THREE.Vector3(infos[0], infos[1], infos[2]);
        this.relRot[animationFrameIndex] = this.radVec(infos[3], infos[4], infos[5]);
        this.relScale[animationFrameIndex] = new THREE.Vector3(infos[6], infos[7], infos[8]);
        for (let c = animationFrameIndex; c <= lastFrame; c++) {
            this.relPos[c] = this.relPos[animationFrameIndex];
            this.relRot[c] = this.relRot[animationFrameIndex];
            this.relScale[c] = this.relScale[animationFrameIndex];
        }
    }

}
