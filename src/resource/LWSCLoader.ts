/**
 * @author Scarabol https://github.com/scarabol
 *
 * This loader loads LWSC files exported from LW
 *
 * File format description: http://www.martinreddy.net/gfx/3d/LWSC.txt
 */

import { Group } from 'three'
import { getFilename } from '../core/Util'
import { AnimClip } from '../game/model/anim/AnimClip'
import { AnimSubObj } from '../game/model/anim/AnimSubObj'
import { SceneManager } from '../game/SceneManager'
import { LWOLoader } from './LWOLoader'
import { ResourceManager } from './ResourceManager'

export class LWSCLoader {

    path: string = ''
    verbose: boolean = false
    animationClip: AnimClip = new AnimClip()
    lines: string[] = []
    lineIndex: number = 0

    constructor(path: string, verbose: boolean = false) {
        this.path = path
        this.verbose = verbose
        if (this.verbose) console.log('Using verbose mode')
    }

    parse(content): AnimClip {
        this.lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map(l => l.trim())

        if (this.lines[0] !== 'LWSC') {
            throw 'Invalid start of file! Expected \'LWSC\' in first line'
        }

        const sceneFileVersion = parseInt(this.lines[1], 10)
        if (sceneFileVersion !== 1) {
            console.warn('Unexpected scene file version: ' + sceneFileVersion)
        }

        for (this.lineIndex = 2; this.lineIndex < this.lines.length; this.lineIndex++) {
            let line = this.lines[this.lineIndex]
            if (!line) continue // empty line: object separator
            const key = line.split(' ')[0]
            if (key === 'FirstFrame') {
                this.parseFrameBlock()
            } else if (key === 'AddNullObject' || key === 'LoadObject') {
                this.parseObjectBlock()
                if (this.verbose) console.log(this.animationClip.bodies[this.animationClip.bodies.length - 1])
            } else if (line.startsWith('PreviewFirstFrame ') || line.startsWith('PreviewLastFrame ') || line.startsWith('PreviewFrameStep ')) {
                // only used in editor
            } else {
                // console.warn('Unexpected line: ' + line); // TODO analyze remaining entries
            }
        }

        if (this.verbose) console.log(this.animationClip)
        return this.animationClip
    }

    parseLine(line: string): string[] {
        return line.split(' ').filter((l: string) => l !== '')
    }

    parseFrameBlock() {
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            const line = this.lines[this.lineIndex]
            if (!line) return
            const [key, value] = this.parseLine(line)
            if (key === 'FirstFrame') {
                this.animationClip.firstFrame = parseInt(value)
            } else if (key === 'LastFrame') {
                this.animationClip.lastFrame = parseInt(value)
            } else if (key === 'FrameStep') {
                const frameStep = parseInt(value)
                if (frameStep !== 1) console.error('Animation frameStep has unexpected value: ' + frameStep)
            } else if (key === 'FramesPerSecond') {
                this.animationClip.framesPerSecond = parseInt(value)
            } else if (key === 'PreviewFirstFrame' || key === 'PreviewLastFrame' || key === 'PreviewFrameStep') {
                // only used in editor
            } else {
                console.warn('Unexpected key in frame block')
            }
        }
        console.error('Parsing block reached content end')
    }

    parseObjectBlock(): AnimSubObj {
        const subObj = new AnimSubObj()
        this.animationClip.bodies.push(subObj)
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            let line = this.lines[this.lineIndex]
            if (!line) return
            const [key, value] = this.parseLine(line)
            if (key === 'AddNullObject' || key === 'LoadObject') {
                if (key === 'LoadObject') {
                    const filename = getFilename(value)
                    subObj.name = filename.slice(0, filename.length - '.lwo'.length)
                    subObj.filename = this.path + filename
                    const lwoBuffer = ResourceManager.getResource(subObj.filename)
                    subObj.model = SceneManager.registerMesh(new LWOLoader(this.path).parse(lwoBuffer))
                } else if (key === 'AddNullObject') {
                    subObj.name = value
                    subObj.model = new Group()
                } else {
                    throw 'Unexpected line: ' + line
                }
            } else if (key === 'ObjectMotion') {
                let line = this.lines[++this.lineIndex]
                const lenInfos = parseInt(line)
                line = this.lines[++this.lineIndex]
                const lenFrames = parseInt(line)
                this.lineIndex++
                for (let c = 0; c < lenFrames; c++) {
                    let line = this.lines[this.lineIndex + c * 2]
                    if (line.startsWith('EndBehavior')) break
                    const infos = line.split(' ').map(Number)
                    if (infos.length !== lenInfos) console.warn('Number of infos (' + infos.length + ') does not match if specified count (' + lenInfos + ')')
                    line = this.lines[this.lineIndex + c * 2 + 1]
                    const animationFrameIndex = parseInt(line.split(' ')[0]) // other entries in line should be zeros
                    subObj.setFrameAndFollowing(animationFrameIndex, this.animationClip.lastFrame, infos)
                }
                this.lineIndex += lenFrames * 2
            } else if (key === 'ParentObject') {
                subObj.parentObjInd = Number(value) - 1 // index is 1 based
                if (this.verbose) console.log('parent obj ind is: ' + subObj.parentObjInd)
            } else if (key === 'ShowObject ' || key === 'LockedChannels') {
                // only used in editor
            } else if (key === 'ShadowOptions') { // TODO implement shadow options (bitwise)
                // 0 - Self Shadow
                // 1 - Cast Shadow
                // 2 - Receive Shadow
            } else if (key === 'ObjDissolve') {
                if (value == '(envelope)') {
                    let line = this.lines[++this.lineIndex]
                    const numOfInformationChannels = parseInt(line)
                    if (numOfInformationChannels !== 1) console.error('Number of information channels for opacity is not 1, but: ' + numOfInformationChannels)
                    line = this.lines[++this.lineIndex]
                    const numOfKeyframes = parseInt(line)
                    this.lineIndex++
                    for (let c = 0; c < numOfKeyframes; c++) {
                        let line = this.lines[this.lineIndex + c * 2]
                        if (line.startsWith('EndBehavior')) break
                        const opacity = 1 - Number(line)
                        line = this.lines[this.lineIndex + c * 2 + 1]
                        const frameNum = Number(line.split(' ')[0])
                        subObj.setOpacityAndFollowing(frameNum, this.animationClip.lastFrame, opacity)
                    }
                    this.lineIndex += numOfKeyframes * 2
                } else {
                    const opacity = 1 - Number(value)
                    subObj.setOpacityAndFollowing(0, this.animationClip.lastFrame, opacity)
                }
            } else {
                // console.log('Unhandled line in object block: ' + line); // TODO analyze unhandled lines
            }
        }
        console.error('Parsing block reached content end')
        return subObj
    }

}
