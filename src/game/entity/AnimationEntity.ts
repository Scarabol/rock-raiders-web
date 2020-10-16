import * as THREE from 'three';
import { Group } from 'three';
import { AnimationClip } from './AnimationClip';
import { iGet } from '../../core/Util';

export class AnimationEntity {

    poly = null;
    group: Group = new Group();
    animation: AnimationClip = null;
    scale: number = null;
    cameraNullName = null;
    cameraNullFrames = null;
    cameraFlipDir = null;
    drillNullName = null;
    carryNullName = null;
    mediumPoly = null;
    highPoly = null;
    fPPoly = null;
    activities = null;

    setActivity(keyname) {
        if (this.animation) this.animation.cancelAnimation();
        const activity = iGet(this.activities, keyname);
        if (!activity) {
            console.error('Activity \'' + keyname + '\' unknown');
            console.log(this.activities);
            return;
        }
        if (activity.animation) {
            this.animation = activity.animation;
            if (this.poly) {
                this.animation.bodies.forEach((subObj) => {
                    const poly = this.poly[subObj.name];
                    subObj.model = poly && poly.model ? poly.model : new THREE.Group();
                });
            }
            this.animation.bodies.forEach((subObj) => {
                if (subObj.parentObjInd) {
                    this.animation.bodies[subObj.parentObjInd - 1].model.add(subObj.model);
                } else {
                    this.group.add(subObj.model);
                }
            });
            this.animation.animate(0);
        } else {
            console.warn('Activity ' + keyname + ' has no animation defined yet');
        }
    }

}
