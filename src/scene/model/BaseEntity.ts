import { WorldManager } from '../WorldManager';
import { Group, MeshPhongMaterial, Object3D, RGBAFormat } from 'three';
import { ResourceManager } from '../../resource/ResourceManager';
import { getFilename } from '../../core/Util';

export class BaseEntity {

    worldMgr: WorldManager;
    group: Group = new Group();
    sequenceIntervals = [];

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

    handleObject(obj) {
        if (obj && obj.material && Array.isArray(obj.material)) {
            obj.material.forEach((mat: MeshPhongMaterial) => {
                if (mat.userData && mat.userData['textureFilename']) {
                    const textureFilename = mat.userData['textureFilename'];
                    if (mat.userData && mat.userData['sequenceTexture']) {
                        const match = textureFilename.match(/(\D+)0+(\d+)\..+/);
                        const basename = match[1];
                        const seqStart = Number(match[2]);
                        let sequenceNames = ResourceManager.filterEntryNames(basename);
                        if (sequenceNames.length < 1) { // no match try shared path
                            sequenceNames = ResourceManager.filterEntryNames('world/shared/' + getFilename(basename));
                        }
                        const lastNum = sequenceNames.length - 1;
                        let seqNum = seqStart;
                        this.sequenceIntervals.push(setInterval(() => {
                            mat.map = ResourceManager.getTexture(sequenceNames[seqNum - seqStart]);
                            seqNum++;
                            if (seqNum > lastNum) seqNum = seqStart;
                        }, 1000 / 5)); // TODO 5? FPS for texture animations?
                    }
                    // console.log('lazy loading texture from ' + textureFilename);
                    mat.map = ResourceManager.getTexture(textureFilename);
                    mat.transparent = mat.map.format === RGBAFormat;
                    mat.color = null; // no need for color, when color map (texture) in use
                } else {
                    // console.log('no userdata set for material');
                }
            });
        } else {
            // console.log('not an object or no material');
        }
    }

}