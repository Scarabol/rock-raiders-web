import { Group, MeshPhongMaterial, Object3D, RGBAFormat } from 'three';
import { AnimationClip } from './AnimationClip';
import { iGet } from '../../core/Util';
import { ResourceManager } from '../engine/ResourceManager';

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
    activities = {};

    setPoly() {
        this.poly = this.highPoly || this.mediumPoly || this.group || this.poly;
    }

    setActivity(keyname, onAnimationDone = null) {
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
                this.animation.bodies.filter((body) => body.name.toLowerCase() !== 'null')
                    .forEach((body) => body.model = iGet(this.poly, body.name) || new Group());
            }
            this.animation.bodies.forEach((subObj) => {
                if (subObj.parentObjInd) {
                    this.animation.bodies[subObj.parentObjInd - 1].model.add(subObj.model);
                } else {
                    this.group.add(subObj.model);
                }
            });
            this.animation.animate(0, onAnimationDone);
        } else {
            console.warn('Activity ' + keyname + ' has no animation defined yet');
        }
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

    handleObject(obj) { // TODO this step should be done at the end of the loading process (postLoading)
        if (obj && obj.material) {
            obj.material.forEach((mat: MeshPhongMaterial) => {
                if (mat.userData && mat.userData['textureFilename']) {
                    let textureFilename = mat.userData['textureFilename'];
                    // console.log('lazy loading texture from ' + textureFilename);
                    mat.map = ResourceManager.getTexture(textureFilename);
                    mat.transparent = mat.map.format === RGBAFormat;
                    if (mat.color) mat.color = null; // no need for color, when color map (texture) in use
                } else {
                    // console.log('no userdata set for material');
                }
            });
        } else {
            // console.log('not an object or no material');
        }
    }

}
