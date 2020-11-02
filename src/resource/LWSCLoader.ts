/**
 * @author Scarabol https://github.com/scarabol
 *
 * This loader loads LWSC files exported from LW
 *
 * File format description: http://www.martinreddy.net/gfx/3d/LWSC.txt
 */

import { AnimClip } from '../scene/model/AnimClip';
import { AnimSubObj } from '../scene/model/AnimSubObj';
import { Group } from 'three';
import { getFilename } from '../core/Util';
import { ResourceManager } from './ResourceManager';
import { LWOLoader } from './LWOLoader';

export class LWSCLoader {

    static parse(path, content): AnimClip {
        const lines: string[] = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim());

        if (lines[0] !== 'LWSC') {
            throw 'Invalid start of file! Expected \'LWSC\' in first line';
        }

        const numOfModels = parseInt(lines[1], 10); // TODO is this correct? May be something else
        if (numOfModels !== 1) {
            console.warn('Number of models has unexpected value: ' + numOfModels);
        }

        const animationClip = new AnimClip();
        for (let c = 2; c < lines.length; c++) {
            let line = lines[c];
            if (!line) continue; // empty line: object separator
            const [key, value] = line.split(' ').filter((l: string) => l !== '');
            if (key === 'FirstFrame') {
                animationClip.firstFrame = parseInt(value);
            } else if (key === 'LastFrame') {
                animationClip.lastFrame = parseInt(value);
            } else if (key === 'FrameStep') {
                const frameStep = parseInt(value);
                if (frameStep !== 1) console.error('Animation frameStep has unexpected value: ' + frameStep);
            } else if (key === 'FramesPerSecond') {
                animationClip.framesPerSecond = parseInt(value);
            } else if (key === 'AddNullObject' || key === 'LoadObject') {
                const subObj = new AnimSubObj();
                if (key === 'LoadObject') {
                    const filename = getFilename(value);
                    subObj.name = filename.slice(0, filename.length - '.lwo'.length);
                    subObj.filename = path + filename;
                    // TODO do not parse twice, read from cache first
                    const lwoBuffer = ResourceManager.getResource(subObj.filename);
                    subObj.model = new LWOLoader(path).parse(lwoBuffer);
                } else if (key === 'AddNullObject') {
                    subObj.name = value;
                    subObj.model = new Group();
                } else {
                    throw 'Unexpected line: ' + line;
                }
                line = lines[++c];
                while (line) {
                    if (line.startsWith('ObjectMotion ')) {
                        line = lines[++c];
                        const lenInfos = parseInt(line);
                        line = lines[++c];
                        const lenFrames = parseInt(line);
                        for (let x = 0; x < lenFrames && !line.startsWith('EndBehavior '); x++) {
                            line = lines[++c];
                            const infos = line.split(' ').map(Number);
                            if (infos.length !== lenInfos) console.warn('Number of infos (' + infos.length + ') does not match if specified count (' + lenInfos + ')');
                            line = lines[++c];
                            const animationFrameIndex = parseInt(line.split(' ')[0]); // other entries in line should be zeros
                            subObj.setFrameAndFollowing(animationFrameIndex, animationClip.lastFrame, infos);
                        }
                        line = lines[++c];
                    } else if (line.startsWith('ParentObject ')) {
                        subObj.parentObjInd = Number(line.split(' ')[1]) - 1; // index is 1 based
                    } else if (line.startsWith('ShowObject ') || line.startsWith('LockedChannels ')) {
                        // only used in editor
                    } else if (line.startsWith('ShadowOptions ')) { // TODO implement shadow options (bitwise)
                        // 0 - Self Shadow
                        // 1 - Cast Shadow
                        // 2 - Receive Shadow
                    } else if (line.startsWith('ObjDissolve ')) {
                        line = lines[++c];
                        // const numOfInformationChannels = Number(line);
                        line = lines[++c];
                        const numOfKeyframes = Number(line);
                        line = lines[++c];
                        for (let x = 0; x < numOfKeyframes && !line.startsWith('EndBehavior '); x++) {
                            const opacity = 1 - Number(line);
                            line = lines[++c];
                            const frameNum = Number(line.split(' ')[0]);
                            subObj.setOpacityAndFollowing(frameNum, animationClip.lastFrame, opacity);
                            line = lines[++c];
                        }
                    } else {
                        // console.log('Unhandled line: ' + line); // TODO debug logging, analyze remaining entries
                    }
                    line = lines[++c];
                }
                animationClip.bodies.push(subObj);
            } else if (line.startsWith('PreviewFirstFrame ') || line.startsWith('PreviewLastFrame ') || line.startsWith('PreviewFrameStep ')) {
                // only used in editor
            } else {
                // console.warn('Unexpected line: ' + line); // TODO debug logging, analyze remaining entries
            }
        }

        return animationClip;
    }
}
