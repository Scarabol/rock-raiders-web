import { LWSCLoader } from './LWSCLoader';
import { ResourceManager } from '../engine/ResourceManager';

export class AnimEntityLoader {

    getPath(url) {
        let saneUrl = url.replace(/\\/g, '/').toLowerCase(); // convert backslashes to forward slashes and all lowercase
        if (!saneUrl.startsWith('/')) saneUrl = '/' + saneUrl;
        return saneUrl.substring(0, saneUrl.lastIndexOf('/') + 1);
    }

    getFilename(url) {
        let saneUrl = url.replace(/\\/g, '/').toLowerCase(); // convert backslashes to forward slashes and all lowercase
        if (!saneUrl.startsWith('/')) saneUrl = '/' + saneUrl;
        return saneUrl.substring(saneUrl.lastIndexOf('/') + 1);
    }

    parse(url, content) {
        let lines = content.split('\n');
        lines.forEach((line, num) => {
            line = line.slice(-1) === '\r' ? line.slice(0, line.length - 1).trim() : line.trim();
            const comStart = line.indexOf(';');
            if (comStart > -1) line = line.slice(0, comStart).trim();
            line = line.replace('\t', ' ');
            line = line.split(' ').map(s => s.trim()).filter(s => s !== '');
            lines[num] = line;
        });
        lines = lines.filter(l => l.length > 0);

        function parseObj(obj: {}, lines, start): number {
            for (let c = start; c < lines.length; c++) {
                const [key, val] = lines[c];
                if (val === '{') {
                    obj[key] = {};
                    c = parseObj(obj[key], lines, c + 1);
                } else if (key === '}') {
                    return c;
                } else if (key) {
                    obj[key] = val;
                }
            }
            return lines.length;
        }

        const cfgRoot = {};
        parseObj(cfgRoot, lines, 0);
        return cfgRoot;
    }

    loadModels(url, root, resMgr: ResourceManager) {
        let path = this.getPath(url);
        if (path.startsWith('/')) path = path.substring(1);
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

        const activities = (root)['activities'];
        if (activities) {
            Object.keys(activities).forEach((activity) => {
                const keyname = activities[activity];
                const act: any = (root)[keyname];
                const isLws = act.hasOwnProperty('lwsfile') && act['lwsfile'] === 'true';
                activities[keyname] = {
                    activity: activity,
                    lwsfile: isLws ? path + act.file + '.lws' : null,
                    file: act.file,
                    transcoef: act.transcoef ? parseFloat(act.transcoef) : null,
                    looping: act.looping !== 'false',
                };
                const activityObj = activities[keyname];
                if (activityObj.lwsfile) {
                    // console.log('load lws file: ' + activityObj.lwsfile);
                    const content = resMgr.wadLoader.wad0File.getEntryText(activityObj.lwsfile);
                    // console.log(content);
                    activityObj.animation = new LWSCLoader().parse(activityObj.lwsfile, content);
                }
            });
        }

        return this; // FIXME return models
    }

    createAnimationEntity() {
        // const entity = new AnimationEntity();
        // entity.scale = this.root['scale']; // TODO apply scale
        // entity.cameraNullName = this.root['cameranullname'];
        // entity.cameraNullFrames = this.root['cameranullframes'];
        // entity.cameraFlipDir = this.root['cameraflipdir'];
        // entity.drillNullName = this.root['drillnullname'];
        // entity.carryNullName = this.root['carrynullname'];
        // entity.mediumPoly = this.root['mediumpoly']; // TODO deep copy
        // entity.highPoly = this.root['highpoly']; // TODO deep copy
        // entity.fPPoly = this.root['fppoly']; // TODO deep copy
        // entity.activities = this.root['activities'];
        // entity.poly = entity.highPoly;
        // return entity;
    }
}
