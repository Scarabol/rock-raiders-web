/**
 * @author Scarabol https://github.com/scarabol
 *
 * This loader loads LWSC files exported from LW
 */

import { AnimationClip } from './AnimationClip';
import { AnimSubObj } from './AnimSubObj';

export class LWSCLoader {

    getFilename(url) {
        let saneUrl = url.replace(/\\/g, '/').toLowerCase(); // convert backslashes to forward slashes and all lowercase
        if (!saneUrl.startsWith('/')) saneUrl = '/' + saneUrl;
        return saneUrl.substring(saneUrl.lastIndexOf('/') + 1);
    }

    parse(url, content) { // FIXME cache entities, do not parse twice
        const entity = new AnimationClip();

        const lines = content.split('\n');
        lines.forEach((line, num) => {
            lines[num] = line.slice(-1) === '\r' ? line.slice(0, line.length - 1).trim() : line.trim();
        });

        if (lines[0] !== 'LWSC') {
            console.error('Invalid start of file! Expected \'LWSC\' in first line');
            return;
        }

        const numOfModels = parseInt(lines[1], 10); // TODO is this correct? May be something else
        if (numOfModels !== 1) {
            console.warn('Number of models has unexpected value: ' + numOfModels);
        }

        for (let c = 2; c < lines.length; c++) {
            let line = lines[c];
            if (!line) {
                // object separator
            } else if (line.startsWith('FirstFrame')) {
                entity.firstFrame = parseInt(line.split(' ')[1]);
            } else if (line.startsWith('LastFrame')) {
                entity.lastFrame = parseInt(line.split(' ')[1]);
            } else if (line.startsWith('FrameStep')) {
                entity.frameStep = parseInt(line.split(' ')[1]);
            } else if (line.startsWith('FramesPerSecond')) {
                entity.framesPerSecond = parseInt(line.split(' ')[1]);
            } else if (line.startsWith('AddNullObject ') || line.startsWith('LoadObject ')) {
                // console.log("Anim Sub Object Start");
                let subObj = new AnimSubObj();
                if (line.startsWith('LoadObject ')) {
                    const filename = this.getFilename(line.split(' ')[1]);
                    subObj.name = filename.slice(0, filename.length - '.lwo'.length);
                    line = lines[++c];
                } else if (line.startsWith('AddNullObject ')) {
                    subObj.name = line.split(' ')[1];
                } else {
                    console.warn('Unexpected line: ' + line);
                }
                while (line) {
                    // console.log("Objectline: " + line);
                    if (line.startsWith('ObjectMotion')) {
                        line = lines[++c];
                        // console.log("START");
                        const lenInfos = parseInt(line);
                        // console.log(lenInfos);
                        const lenFrames = parseInt(lines[++c]);
                        // console.log(lenFrames);
                        line = lines[++c];
                        for (let x = 0; x < lenFrames && !line.startsWith('EndBehavior'); x++) {
                            line = lines[c + x * 2];
                            // console.log("motion 1: " + line);
                            const infos = line.split(' ').map(Number);
                            if (infos.length !== lenInfos) console.warn('Number of infos (' + infos.length + ') does not match if specified count (' + lenInfos + ')');
                            // console.log(infos);
                            line = lines[c + x * 2 + 1];
                            // console.log("motion 2: " + line);
                            const animationFrameIndex = parseInt(line.split(' ')[0]); // other entries in line should be zeros
                            // console.log('animationFrameIndex: ' + animationFrameIndex);
                            subObj.setFrameAndFollowing(animationFrameIndex, entity.lastFrame, infos);
                        }
                        // console.log("END");
                    } else if (line.startsWith('ParentObject')) {
                        subObj.parentObjInd = line.split(' ')[1];
                    } else {
                        // console.log("Unhandled line: "+line); // TODO analyze remaining entries
                    }
                    line = lines[++c];
                }
                entity.bodies.push(subObj);
                // console.log("Object End");
            } else {
                // console.warn("Unexpected line: " + line);
            }
        }

        return entity;
    }
}
