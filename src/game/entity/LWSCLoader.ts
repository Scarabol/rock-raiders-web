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

    parse(path, content): AnimationClip {
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

        const entity = new AnimationClip();
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
                        // TODO do not parse twice, read from cache first
                        try { // TODO refactor extract method (also used in AnimEntityLoader)
                            const lwoContent = ResourceManager.wadLoader.wad0File.getEntryBuffer(subObj.filename);
                            subObj.model = new LWOLoader(path).parse(lwoContent.buffer);
                        } catch (e) {
                            const sharedPath = 'world/shared/';
                            // console.log('load failed for ' + subObj.filename + ' trying shared path at ' + sharedPath + filename + '; error: ' + e); // TODO debug logging
                            const lwoContent = ResourceManager.wadLoader.wad0File.getEntryBuffer(sharedPath + filename);
                            subObj.model = new LWOLoader(sharedPath).parse(lwoContent.buffer);
                        }
                        line = lines[++c];
                    } else if (key === 'AddNullObject') {
                        subObj.name = value;
                        subObj.model = new Group();
                        // TODO iterate line here too???
                    } else {
                        console.warn('Unexpected line: ' + line);
                    }
                    while (line) {
                        if (line.startsWith('ObjectMotion ')) {
                            line = lines[++c];
                            const lenInfos = parseInt(line);
                            const lenFrames = parseInt(lines[++c]);
                            line = lines[++c];
                            for (let x = 0; x < lenFrames && !line.startsWith('EndBehavior '); x++) {
                                line = lines[c + x * 2];
                                const infos = line.split(' ').map(Number);
                                if (infos.length !== lenInfos) console.warn('Number of infos (' + infos.length + ') does not match if specified count (' + lenInfos + ')');
                                line = lines[c + x * 2 + 1];
                                const animationFrameIndex = parseInt(line.split(' ')[0]); // other entries in line should be zeros
                                subObj.setFrameAndFollowing(animationFrameIndex, entity.lastFrame, infos);
                            }
                        } else if (line.startsWith('ParentObject ')) {
                            subObj.parentObjInd = Number(line.split(' ')[1]);
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
