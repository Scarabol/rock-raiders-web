import * as THREE from 'three';

function AnimationEntity() {

    this.poly = null;
    this.group = new THREE.Group();
    this.animation = null;
    this.scale = null;
    this.cameraNullName = null;
    this.cameraNullFrames = null;
    this.cameraFlipDir = null;
    this.drillNullName = null;
    this.carryNullName = null;
    this.mediumPoly = null;
    this.highPoly = null;
    this.fPPoly = null;
    this.activities = null;

}

AnimationEntity.prototype = {

    setActivity: function (keyname) {
        if (this.animation) this.animation.cancelAnimation();
        const activity = this.activities[keyname];
        if (!activity) {
            console.error("Activity '" + keyname + "' unknown");
            return;
        }
        if (activity.animation) {
            this.animation = activity.animation;
            // console.log(this.animation);
            this.animation.bodies.forEach((subObj) => {
                const poly = this.poly[subObj.name];
                subObj.model = poly && poly.model ? poly.model : new THREE.Group();
            });
            this.animation.bodies.forEach((subObj) => {
                if (subObj.parentObjInd) {
                    // console.log('Adding object to parent id ' + subObj.parentObjInd);
                    this.animation.bodies[subObj.parentObjInd - 1].model.add(subObj.model);
                } else {
                    // console.log('Object has no parent, adding to root group');
                    this.group.add(subObj.model);
                }
            });
            this.animation.animate(0);
        } else {
            console.warn('Activity ' + keyname + ' has no animation defined yet');
        }
    },

}

export { AnimationEntity }
