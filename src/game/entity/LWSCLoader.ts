/**
 * @author Scarabol https://github.com/scarabol
 *
 * This loader loads LWSC files exported from LW
 */

import { AnimationClip } from './AnimationClip';
import { AnimSubObj } from './AnimSubObj';
import { LWOLoader } from './LWOLoader';
import { Group } from 'three';
import { ResourceManager } from '../engine/ResourceManager';
import { getFilename } from '../../core/Util';

export class LWSCLoader {

    resMgr: ResourceManager;

    constructor(resourceManager: ResourceManager) {
        this.resMgr = resourceManager;
    }

    parse(path, content): AnimationClip {
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
            } else {
                const [key, value] = line.split(' ').filter((l: string) => l !== '');
                if (key === 'FirstFrame') {
                    entity.firstFrame = parseInt(value);
                } else if (key === 'LastFrame') {
                    entity.lastFrame = parseInt(value);
                } else if (key === 'FrameStep') {
                    entity.frameStep = parseInt(value);
                } else if (key === 'FramesPerSecond') {
                    entity.framesPerSecond = parseInt(value);
                } else if (key === 'AddNullObject' || key === 'LoadObject') {
                    const subObj = new AnimSubObj();
                    if (line.startsWith('LoadObject')) {
                        const filename = getFilename(value);
                        subObj.name = filename.slice(0, filename.length - '.lwo'.length);
                        subObj.filename = path + filename;
                        const sharedPath = 'world/shared/' + filename;
                        // TODO do not parse twice, read from cache first
                        let lwoContent = null;
                        try {
                            lwoContent = this.resMgr.wadLoader.wad0File.getEntryBuffer(subObj.filename);
                        } catch (e) {
                            console.log('load failed for ' + subObj.filename + ' trying shared path at ' + sharedPath + '; error: ' + e); // TODO debug logging
                            lwoContent = this.resMgr.wadLoader.wad0File.getEntryBuffer(sharedPath);
                            path = 'world/shared/';
                        }
                        subObj.model = new LWOLoader(this.resMgr, path).parse(lwoContent.buffer);
                        line = lines[++c];
                    } else if (key === 'AddNullObject') {
                        subObj.name = value;
                        subObj.model = new Group();
                        // TODO iterate line here too???
                    } else {
                        console.warn('Unexpected line: ' + line);
                    }
                    while (line) {
                        if (line.startsWith('ObjectMotion')) {
                            line = lines[++c];
                            const lenInfos = parseInt(line);
                            const lenFrames = parseInt(lines[++c]);
                            line = lines[++c];
                            for (let x = 0; x < lenFrames && !line.startsWith('EndBehavior'); x++) {
                                line = lines[c + x * 2];
                                const infos = line.split(' ').map(Number);
                                if (infos.length !== lenInfos) console.warn('Number of infos (' + infos.length + ') does not match if specified count (' + lenInfos + ')');
                                line = lines[c + x * 2 + 1];
                                const animationFrameIndex = parseInt(line.split(' ')[0]); // other entries in line should be zeros
                                subObj.setFrameAndFollowing(animationFrameIndex, entity.lastFrame, infos);
                            }
                        } else if (line.startsWith('ParentObject')) {
                            subObj.parentObjInd = value;
                        } else {
                            // console.log("Unhandled line: "+line); // TODO debug logging, analyze remaining entries
                        }
                        line = lines[++c];
                    }
                    entity.bodies.push(subObj);
                } else {
                    // console.warn("Unexpected line: " + line); // TODO debug logging, analyze remaining entries
                }
            }
        }

        return entity;
    }
}
