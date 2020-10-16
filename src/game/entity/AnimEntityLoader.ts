import { ResourceManager } from '../engine/ResourceManager';
import { LWSCLoader } from './LWSCLoader';
import { AnimationEntity } from './AnimationEntity';
import { getPath, iGet } from '../../core/Util';

export class AnimEntityLoader {

    resMgr: ResourceManager;

    constructor(resourceManager: ResourceManager) {
        this.resMgr = resourceManager;
    }

    loadModels(url, root, resMgr: ResourceManager) {
        const path = getPath(url);

        // TODO load other poly quality models (if available)
        // let mediumPoly = (root)['mediumpoly'];
        // if (mediumPoly) {
        //     Object.keys(mediumPoly).forEach((key) => {
        //         const polyname = mediumPoly[key];
        //         const polykey = key.startsWith('!') ? key.slice(1) : key;
        //         const polyfile = path + polyname + '.lwo';
        //         console.log('polyfile');
        //         console.log(polyfile);
        //         // new LWOLoader().load(polyfile, (model) => {
        //         //     mediumPoly[polykey] = {polyname: polyname, polyfile: polyfile, model: model};
        //         // }, undefined, () => {
        //         //     console.error('Could not load poly ' + polyname + ' from ' + polyfile);
        //         // });
        //     });
        //     Object.keys(mediumPoly).filter((polykey) => polykey.startsWith('!')).forEach((polykey) => delete mediumPoly[polykey]);
        // }

        // let highPoly = (root)['highpoly'];
        // if (highPoly) {
        //     Object.keys(highPoly).forEach((key) => {
        //         const polyname = highPoly[key];
        //         const polykey = key.startsWith('!') ? key.slice(1) : key;
        //         const polyfile = path + polyname + '.lwo';
        //         new LWOLoader().load(polyfile, (model) => {
        //             highPoly[polykey] = {polyname: polyname, polyfile: polyfile, model: model};
        //         }, undefined, () => {
        //             console.error('Could not load poly ' + polyname + ' from ' + polyfile);
        //         });
        //     });
        //     Object.keys(highPoly).filter((polykey) => polykey.startsWith('!')).forEach((polykey) => delete highPoly[polykey]);
        // }

        // let fPoly = (root)['fppoly'];
        // if (fPoly) {
        //     Object.keys(fPoly).forEach((camera) => {
        //         Object.keys(fPoly[camera]).forEach((key) => {
        //             const polyname = fPoly[camera][key];
        //             const polykey = key.startsWith('!') ? key.slice(1) : key;
        //             if (polyname !== 'null') {
        //                 const polyfile = path + polyname + '.lwo';
        //                 new LWOLoader().load(polyfile, (model) => {
        //                     fPoly[camera][polykey] = {polyname: polyname, polyfile: polyfile, model: model};
        //                 }, undefined, () => {
        //                     console.error('Could not load poly ' + polyname + ' from ' + polyfile);
        //                 });
        //             } else {
        //                 fPoly[camera][key] = {polyname: polyname, polyfile: null, model: new Group()};
        //             }
        //         });
        //         Object.keys(fPoly[camera]).filter((polykey) => polykey.startsWith('!')).forEach((polykey) => delete fPoly[polykey][camera]);
        //     });
        // }

        const parsed = {};
        const activities = iGet(root, 'Activities');
        if (activities) {
            Object.keys(activities).forEach((activity) => {
                try {
                    let keyname = iGet(activities, activity);
                    const act = iGet(root, keyname);
                    const file = iGet(act, 'FILE');
                    const isLws = iGet(act, 'LWSFILE') === true;
                    if (!isLws) throw 'NOT AN LWS FILE'; // TODO error handling
                    const filepath = path + file + '.lws';
                    // TODO cache entities, do not parse twice
                    const content = resMgr.wadLoader.wad0File.getEntryText(filepath);
                    act.animation = new LWSCLoader(this.resMgr).parse(path, content);
                    parsed[keyname] = act;
                } catch (e) {
                    console.error(e);
                    console.log(root);
                    console.log(activities);
                    console.log(activity);
                }
            });
        }

        const entity = new AnimationEntity();
        // entity.scale = this.root['scale']; // TODO apply scale
        // entity.cameraNullName = this.root['cameranullname'];
        // entity.cameraNullFrames = this.root['cameranullframes'];
        // entity.cameraFlipDir = this.root['cameraflipdir'];
        // entity.drillNullName = this.root['drillnullname'];
        // entity.carryNullName = this.root['carrynullname'];
        // entity.mediumPoly = this.root['mediumpoly']; // TODO deep copy
        // entity.highPoly = this.root['highpoly']; // TODO deep copy
        // entity.fPPoly = this.root['fppoly']; // TODO deep copy
        entity.activities = parsed;
        entity.poly = entity.highPoly;
        // console.log(entity);
        return entity;
    }

}
