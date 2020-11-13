import { AnimationEntityType } from '../scene/model/anim/AnimationEntityType';
import { getPath, iGet } from './wadworker/WadUtil';
import { ResourceManager } from './ResourceManager';
import { LWOLoader } from './LWOLoader';
import { LWSCLoader } from './LWSCLoader';

export class AnimEntityLoader {

    static loadModels(url, root): AnimationEntityType {
        const path = getPath(url);

        const entityType = new AnimationEntityType();

        // TODO load other poly quality models (if available)
        // let mediumPoly = iGet(root, 'MediumPoly');
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

        const highPoly = iGet(root, 'highpoly');
        if (highPoly) {
            entityType.highPoly = {};
            Object.keys(highPoly).forEach((key) => {
                const polyname = highPoly[key] + '.lwo';
                const polykey = key.startsWith('!') ? key.slice(1) : key;
                // console.log(path + polyname);
                // TODO do not parse twice, read from cache first
                const lwoBuffer = ResourceManager.getResource(path + polyname);
                entityType.highPoly[polykey] = new LWOLoader(path).parse(lwoBuffer);
            });
        }

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

        const activities = iGet(root, 'Activities');
        if (activities) {
            Object.keys(activities).forEach((activity) => {
                try {
                    let keyname = iGet(activities, activity);
                    const act = iGet(root, keyname);
                    const file = iGet(act, 'FILE');
                    const isLws = iGet(act, 'LWSFILE') === true;
                    const transcoef = iGet(act, 'TRANSCOEF');
                    const looping = iGet(act, 'LOOPING') === true;
                    if (isLws) {
                        const content = ResourceManager.getResource(path + file + '.lws');
                        act.animation = new LWSCLoader(path).parse(content);
                        act.animation.looping = looping;
                        act.animation.transcoef = transcoef ? Number(transcoef) : 1;
                        (entityType.activities)[keyname] = act;
                    } else {
                        console.error('Found activity which is not an LWS file');
                    }
                } catch (e) {
                    console.error(e);
                    console.log(root);
                    console.log(activities);
                    console.log(activity);
                }
            });
        }

        return entityType;
    }

}
