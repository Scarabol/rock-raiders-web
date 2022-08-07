/**
 * @author Scarabol https://github.com/scarabol
 *
 * This loader loads LWSC files exported from LW
 *
 * File format description: http://www.martinreddy.net/gfx/3d/LWSC.txt
 */

import { Vector3 } from 'three'
import { Sample } from '../audio/Sample'
import { getFilename, getPath } from '../core/Util'
import { AnimClip } from '../game/model/anim/AnimClip'
import { AnimSubObj } from '../game/model/anim/AnimSubObj'
import { SceneMesh } from '../scene/SceneMesh'
import { ResourceManager } from './ResourceManager'

/**
 * @deprecated
 */
export class LWSCLoader {
    animationClip: AnimClip
    verbose: boolean = false
    lines: string[] = []
    lineIndex: number = 0

    constructor(verbose: boolean = false) {
        this.verbose = verbose
        if (this.verbose) console.log('Using verbose mode')
    }

    parse(filepath: string): AnimClip {
        const content: string = ResourceManager.getResource(filepath)
        if (!content) throw new Error(`Cannot parse LWS, no content given for: ${filepath}`)
        this.animationClip = new AnimClip(filepath)
        this.lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim())

        if (this.lines[0] !== 'LWSC') {
            throw new Error('Invalid start of file! Expected \'LWSC\' in first line')
        }

        const sceneFileVersion = parseInt(this.lines[1], 10)
        if (sceneFileVersion !== 1) {
            console.warn(`Unexpected scene file version: ${sceneFileVersion}`)
        }

        for (this.lineIndex = 2; this.lineIndex < this.lines.length; this.lineIndex++) {
            let line = this.lines[this.lineIndex]
            if (!line) continue // empty line: object separator
            const key = line.split(' ')[0]
            if (key === 'FirstFrame') {
                this.parseFrameBlock()
            } else if (key === 'AddNullObject' || key === 'LoadObject') {
                const subObj = this.parseObjectBlock()
                if (this.verbose) console.log(subObj)
            } else if (line.startsWith('PreviewFirstFrame ') || line.startsWith('PreviewLastFrame ') || line.startsWith('PreviewFrameStep ')) {
                // only used in editor
            } else {
                // console.warn(`Unexpected line: ${line}`); // TODO implement all LWS features
            }
        }

        if (this.verbose) console.log(this.animationClip)
        return this.animationClip
    }

    private static parseLine(line: string): string[] {
        const lineParts = line.split(' ').filter((l: string) => l !== '')
        const key = lineParts.shift()
        const value = lineParts.join(' ')
        return [key, value]
    }

    private parseFrameBlock() {
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            const line = this.lines[this.lineIndex]
            if (!line) return
            const [key, value] = LWSCLoader.parseLine(line)
            if (key === 'FirstFrame') {
                this.animationClip.firstFrame = parseInt(value)
            } else if (key === 'LastFrame') {
                this.animationClip.lastFrame = parseInt(value)
            } else if (key === 'FrameStep') {
                const frameStep = parseInt(value)
                if (frameStep !== 1) console.error(`Animation frameStep has unexpected value: ${frameStep}`)
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

    private parseObjectBlock(): AnimSubObj {
        const subObj = new AnimSubObj()
        this.animationClip.animatedPolys.push(subObj)
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            let line = this.lines[this.lineIndex]
            if (!line) return subObj
            const [key, value] = LWSCLoader.parseLine(line)
            if (key === 'LoadObject') {
                const filename = getFilename(value)
                subObj.lowerName = filename.slice(0, filename.length - '.lwo'.length).toLowerCase()
                const lwoFilename = getPath(this.animationClip.lwsFilepath) + subObj.lowerName
                subObj.model = ResourceManager.getLwoModel(lwoFilename)
                subObj.model.name = subObj.lowerName
            } else if (key === 'AddNullObject') {
                const nameParts = value.split(',')
                subObj.lowerName = nameParts[0].toLowerCase()
                if (subObj.lowerName === 'sfx') {
                    subObj.sfxName = nameParts[1] || null
                    subObj.sfxFrames = nameParts.slice(2).map((n) => Number(n))
                } else if (subObj.lowerName === 'snd' && nameParts[1].equalsIgnoreCase('SFX_LANDSLIDE')) {
                    subObj.sfxName = Sample[Sample.SFX_FallIn]
                    subObj.sfxFrames = nameParts.slice(2).map((n) => Number(n))
                }
                subObj.model = new SceneMesh()
                subObj.model.name = value
                subObj.isNull = true
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
                    if (infos.length !== lenInfos) console.warn(`Number of infos (${infos.length}) does not match if specified count (${lenInfos})`)
                    line = this.lines[this.lineIndex + c * 2 + 1]
                    const animationFrameIndex = parseInt(line.split(' ')[0]) // other entries in line should be zeros
                    subObj.setFrameAndFollowing(animationFrameIndex, this.animationClip.lastFrame, infos)
                }
                this.lineIndex += lenFrames * 2
            } else if (key === 'ParentObject') {
                subObj.parentObjInd = Number(value) - 1 // index is 1 based
                if (this.verbose) console.log(`parent obj ind is: ${subObj.parentObjInd}`)
            } else if (key === 'ShowObject' || key === 'LockedChannels') {
                // only used in editor
            } else if (key === 'ShadowOptions') { // TODO implement shadow options (bitwise)
                // 0 - Self Shadow
                // 1 - Cast Shadow
                // 2 - Receive Shadow
            } else if (key === 'ObjDissolve') {
                if (value == '(envelope)') {
                    let line = this.lines[++this.lineIndex]
                    const numOfInformationChannels = parseInt(line)
                    if (numOfInformationChannels !== 1) console.error(`Number of information channels for opacity is not 1, but: ${numOfInformationChannels}`)
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
            } else if (key === 'PivotPoint') {
                subObj.pivot = new Vector3().fromArray(value.split(' ').map((n) => Number(n)))
            } else if (this.verbose) {
                console.warn(`Unhandled line in object block: ${line}; key: ${key}; value: ${value}`) // TODO implement all LWS features
            }
        }
        console.error('Parsing block reached content end')
        return subObj
    }
}
