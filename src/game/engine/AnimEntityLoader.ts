import { ResourceManager } from './ResourceManager';
import { LWSCLoader } from '../../core/wad/LWSCLoader';
import { getPath, iGet } from '../../core/Util';
import { LWOLoader } from '../../core/wad/LWOLoader';
import { AnimationEntityType } from '../model/entity/AnimEntity';

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
                try {
                    const lwoContent = ResourceManager.wadLoader.wad0File.getEntryBuffer(path + polyname);
                    entityType.highPoly[polykey] = new LWOLoader(path).parse(lwoContent.buffer);
                } catch (e) {
                    const sharedPath = 'world/shared/';
                    // console.log('load failed for ' + subObj.filename + ' trying shared path at ' + sharedPath + filename + '; error: ' + e); // TODO debug logging
                    const lwoContent = ResourceManager.wadLoader.wad0File.getEntryBuffer(sharedPath + polyname);
                    entityType.highPoly[polykey] = new LWOLoader(sharedPath).parse(lwoContent.buffer);
                }
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
                    const looping = iGet(act, 'LOOPING') === true;
                    if (isLws) {
                        const filepath = path + file + '.lws';
                        // TODO cache entities, do not parse twice
                        const content = ResourceManager.wadLoader.wad0File.getEntryText(filepath);
                        act.animation = LWSCLoader.parse(path, content);
                        act.animation.looping = looping;
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
