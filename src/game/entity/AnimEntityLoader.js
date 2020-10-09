import * as THREE from "three";
import { AnimationEntity } from "./AnimationEntity";
import { LWOLoader } from "./LWOLoader";
import { LWSCLoader } from "./LWSCLoader";

function AnimEntityLoader() {

}

AnimEntityLoader.prototype = {

    constructor: AnimEntityLoader,

    load: function (url, onLoad, onProgress, onError) {
        this.path = this.getPath(url);
        this.filename = this.getFilename(url);
        this.root = null;
        const scope = this;
        const loader = new THREE.FileLoader(scope.manager);
        loader.setResponseType('text');
        loader.load(this.path + this.filename, function (content) {
            onLoad(scope.parse(content));
        }, onProgress, onError);
    },

    getPath: function (url) {
        let saneUrl = url.replace(/\\/g, '/'); // convert backslashes to forward slashes and all lowercase
        if (!saneUrl.startsWith('/')) saneUrl = '/' + saneUrl;
        return saneUrl.substring(0, saneUrl.lastIndexOf('/') + 1);
    },

    getFilename: function (url) {
        let saneUrl = url.replace(/\\/g, '/').toLowerCase(); // convert backslashes to forward slashes and all lowercase
        if (!saneUrl.startsWith('/')) saneUrl = '/' + saneUrl;
        return saneUrl.substring(saneUrl.lastIndexOf('/') + 1);
    },

    parse: function (content) {
        // console.log(content);

        const lines = content.split('\n');
        lines.forEach((line, num) => {
            line = line.slice(-1) === '\r' ? line.slice(0, line.length - 1).trim() : line.trim();
            const comStart = line.indexOf(';');
            if (comStart > -1) line = line.slice(0, comStart).trim();
            line = line.replace('\t', ' ');
            line = line.split(' ').map(s => s.trim());
            lines[num] = line;
        });
        // console.log(lines);

        const file = {};
        const parents = [];
        let obj = file;
        for (let c = 0; c < lines.length; c++) {
            const name = lines[c][0]; // TODO preserve names with actual capital letters
            const key = name.toLowerCase();
            const val = lines[c][1] ? lines[c][1].toLowerCase() : lines[c][1];
            // console.log(key + ' ' + val);
            if (val === '{') {
                parents.push(obj);
                obj[key] = {};
                obj = obj[key];
            } else if (key === '}') {
                obj = parents.pop();
            } else if (key) {
                obj[key] = val;
            }
        }
        // console.log(file);
        this.root = file['lego*'];
        // console.log(this.root);

        Object.keys((this.root)['mediumpoly']).forEach((key) => {
            const polyname = (this.root)['mediumpoly'][key];
            const polykey = key.startsWith('!') ? key.slice(1) : key;
            const polyfile = this.path + polyname + '.lwo';
            new LWOLoader().load(polyfile, (model) => {
                (this.root)['mediumpoly'][polykey] = { polyname: polyname, polyfile: polyfile, model: model };
            }, undefined, () => {
                console.error('Could not load poly ' + polyname + ' from ' + polyfile);
            })
        });
        Object.keys((this.root)['mediumpoly']).filter((polykey) => polykey.startsWith('!')).forEach((polykey) => delete (this.root)['mediumpoly'][polykey]);

        Object.keys((this.root)['highpoly']).forEach((key) => {
            const polyname = (this.root)['highpoly'][key];
            const polykey = key.startsWith('!') ? key.slice(1) : key;
            const polyfile = this.path + polyname + '.lwo';
            new LWOLoader().load(polyfile, (model) => {
                (this.root)['highpoly'][polykey] = { polyname: polyname, polyfile: polyfile, model: model };
            }, undefined, () => {
                console.error('Could not load poly ' + polyname + ' from ' + polyfile);
            })
        });
        Object.keys((this.root)['highpoly']).filter((polykey) => polykey.startsWith('!')).forEach((polykey) => delete (this.root)['highpoly'][polykey]);

        if ((this.root)['fppoly']) {
            Object.keys((this.root)['fppoly']).forEach((camera) => {
                Object.keys((this.root)['fppoly'][camera]).forEach((key) => {
                    const polyname = (this.root)['fppoly'][camera][key];
                    const polykey = key.startsWith('!') ? key.slice(1) : key;
                    if (polyname !== 'null') {
                        const polyfile = this.path + polyname + '.lwo';
                        new LWOLoader().load(polyfile, (model) => {
                            (this.root)['fppoly'][camera][polykey] = { polyname: polyname, polyfile: polyfile, model: model };
                        }, undefined, () => {
                            console.error('Could not load poly ' + polyname + ' from ' + polyfile);
                        });
                    } else {
                        (this.root)['fppoly'][camera][key] = { polyname: polyname, polyfile: null, model: new THREE.Group() };
                    }
                });
                Object.keys((this.root)['fppoly'][camera]).filter((polykey) => polykey.startsWith('!')).forEach((polykey) => delete (this.root)['fppoly'][polykey][camera]);
            });
        }

        Object.keys((this.root)['activities']).forEach((activity) => {
            const keyname = (this.root)['activities'][activity];
            const act = (this.root)[keyname];
            (this.root)['activities'][keyname] = {
                activity: activity,
                lwsfile: act.lwsfile === 'true' ? this.path + act.file + '.lws' : null,
                file: act.file,
                transcoef: act.transcoef ? parseFloat(act.transcoef) : null,
                looping: act.looping !== 'false',
            };
            const activityObj = (this.root)['activities'][keyname];
            if (activityObj.lwsfile) {
                new LWSCLoader().load(activityObj.lwsfile, (animation) => activityObj.animation = animation);
            }
        });

        return this;
    },

    createAnimationEntity: function () {
        const entity = new AnimationEntity();
        entity.scale = this.root['scale']; // TODO apply scale
        entity.cameraNullName = this.root['cameranullname'];
        entity.cameraNullFrames = this.root['cameranullframes'];
        entity.cameraFlipDir = this.root['cameraflipdir'];
        entity.drillNullName = this.root['drillnullname'];
        entity.carryNullName = this.root['carrynullname'];
        entity.mediumPoly = this.root['mediumpoly']; // TODO deep copy
        entity.highPoly = this.root['highpoly']; // TODO deep copy
        entity.fPPoly = this.root['fppoly']; // TODO deep copy
        entity.activities = this.root['activities'];
        entity.poly = entity.highPoly;
        return entity;
    },
}

export { AnimEntityLoader }
