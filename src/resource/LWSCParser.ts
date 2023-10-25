/**
 * This loader loads LWSC files exported from LW
 *
 * File format description: http://www.martinreddy.net/gfx/3d/LWSC.txt
 */

import { Euler, KeyframeTrack, NumberKeyframeTrack, Quaternion, QuaternionKeyframeTrack, StringKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three'
import { degToRad } from 'three/src/math/MathUtils'
import { Sample } from '../audio/Sample'
import { getFilename } from '../core/Util'
import { VERBOSE } from '../params'

export class LWSCData {
    durationSeconds: number = null
    readonly objects: LWSCObject[] = []
}

export class LWSCObject {
    lowerName: string = null
    isNull: boolean = false
    sfxName: string = null
    sfxFrames: number[] = []
    parentObjInd: number = 0 // index is 1 based, 0 means no parent
    pivot: Vector3 = new Vector3(0, 0, 0)
    readonly keyframeTracks: KeyframeTrack[] = []
    readonly opacityTracks: NumberKeyframeTrack[] = []
    castShadow: boolean = false
    receiveShadow: boolean = false
}

export class LWSCParser {
    readonly lwscData: LWSCData = new LWSCData()
    lines: string[] = []
    lineIndex: number = 0
    firstFrame: number = 0
    lastFrame: number = 0
    frameStep: number = 1
    framesPerSecond: number = 25
    numOfKeyframes: number = 0

    constructor(content: string, readonly verbose: boolean = false) {
        if (this.verbose) console.log('Using verbose mode')
        this.lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim())
    }

    parse(): LWSCData {
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
                // console.warn(`Unexpected line: ${line}`); // XXX implement all LWS features
            }
        }

        if (this.verbose) console.log(this.lwscData)
        return this.lwscData
    }

    private static parseLine(line: string): string[] {
        const lineParts = line.split(' ').filter((l) => l !== '')
        const key = lineParts.shift()
        const value = lineParts.join(' ')
        return [key, value]
    }

    private parseFrameBlock() {
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            const line = this.lines[this.lineIndex]
            if (!line) return
            const [key, value] = LWSCParser.parseLine(line)
            if (key === 'FirstFrame') {
                this.firstFrame = parseInt(value, 10)
                this.numOfKeyframes = this.lastFrame + 1 - this.firstFrame
                this.lwscData.durationSeconds = this.numOfKeyframes / this.framesPerSecond / this.frameStep
            } else if (key === 'LastFrame') {
                this.lastFrame = parseInt(value, 10)
                this.numOfKeyframes = this.lastFrame + 1 - this.firstFrame
                this.lwscData.durationSeconds = this.numOfKeyframes / this.framesPerSecond / this.frameStep
            } else if (key === 'FrameStep') {
                this.frameStep = parseInt(value, 10)
                this.lwscData.durationSeconds = this.numOfKeyframes / this.framesPerSecond / this.frameStep
            } else if (key === 'FramesPerSecond') {
                this.framesPerSecond = parseInt(value, 10)
            } else if (key === 'PreviewFirstFrame' || key === 'PreviewLastFrame' || key === 'PreviewFrameStep') {
                // only used in editor
            } else {
                console.warn(`Unexpected key "${key}" in frame block`)
            }
        }
        console.error('Parsing block reached content end')
    }

    private parseObjectBlock(): LWSCObject {
        const currentObject = new LWSCObject()
        this.lwscData.objects.push(currentObject)
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            let line = this.lines[this.lineIndex]
            if (!line) return currentObject
            const [key, value] = LWSCParser.parseLine(line)
            if (key === 'LoadObject') {
                const filename = getFilename(value)
                currentObject.lowerName = filename.slice(0, filename.length - '.lwo'.length).toLowerCase()
            } else if (key === 'AddNullObject') {
                const nameParts = value.split(',')
                currentObject.lowerName = nameParts[0].toLowerCase()
                if (currentObject.lowerName === 'sfx') {
                    currentObject.sfxName = nameParts[1] || null
                    currentObject.sfxFrames = nameParts.slice(2).map((n) => parseInt(n, 10))
                    const times = []
                    const sfxNames = []
                    for (let c = 0; c < this.numOfKeyframes; c++) {
                        times[c] = c / this.numOfKeyframes * this.lwscData.durationSeconds
                        sfxNames[c] = currentObject.sfxFrames.includes(c) ? currentObject.sfxName : ''
                    }
                    currentObject.keyframeTracks.push(new StringKeyframeTrack('.userData[sfxName]', times, sfxNames))
                } else if (currentObject.lowerName === 'snd' && nameParts[1].equalsIgnoreCase('SFX_LANDSLIDE')) {
                    currentObject.sfxName = Sample[Sample.SFX_FallIn]
                    currentObject.sfxFrames = nameParts.slice(2).map((n) => parseInt(n, 10))
                    // TODO what about keyframe tracks here for SND?
                } else if (currentObject.lowerName.startsWith('*') || currentObject.lowerName.startsWith(';')) {
                    if (VERBOSE) console.warn(`Unexpected null object name ${currentObject.lowerName}`)
                }
                currentObject.isNull = true
            } else if (key === 'ObjectMotion') {
                let line = this.lines[++this.lineIndex]
                const lenInfos = parseInt(line, 10)
                line = this.lines[++this.lineIndex]
                const lenFrames = parseInt(line, 10)
                this.lineIndex++
                const times = []
                const relPos = []
                const relRot = []
                const relScale = []
                for (let c = 0; c < lenFrames; c++) {
                    let line = this.lines[this.lineIndex + c * 2]
                    if (line.startsWith('EndBehavior')) break
                    const infos = line.split(' ').map((n) => parseFloat(n))
                    if (infos.length !== lenInfos) console.warn(`Number of infos (${infos.length}) does not match with specified count (${lenInfos})`)
                    line = this.lines[this.lineIndex + c * 2 + 1]
                    const keyframeIndex = parseInt(line.split(' ')[0], 10) // other entries in line should be zeros
                    const timeFromIndex = (keyframeIndex - this.firstFrame) / (this.numOfKeyframes - 1) * this.lwscData.durationSeconds
                    times.push(timeFromIndex)
                    if (currentObject.lowerName === 'lpgunpivot') {
                        infos[1] = -42 // TODO Remove workaround
                    } else if (currentObject.lowerName === 'lpcranetop') {
                        infos[1] = 0 // TODO Remove workaround
                    }
                    new Vector3(infos[0], infos[1], infos[2]).toArray(relPos, relPos.length)
                    new Quaternion().setFromEuler(new Euler(degToRad(infos[4]), degToRad(infos[3]), degToRad(infos[5]), 'YXZ'), true).toArray(relRot, relRot.length) // Heading (Y), Pitch (X), Bank (Z)
                    new Vector3(infos[6], infos[7], infos[8]).toArray(relScale, relScale.length)
                }
                currentObject.keyframeTracks.push(new VectorKeyframeTrack(`.position`, times, relPos))
                currentObject.keyframeTracks.push(new QuaternionKeyframeTrack(`.quaternion`, times, relRot))
                currentObject.keyframeTracks.push(new VectorKeyframeTrack(`.scale`, times, relScale))
                this.lineIndex += lenFrames * 2
            } else if (key === 'ParentObject') {
                currentObject.parentObjInd = parseInt(value, 10) // index is 1 based
            } else if (key === 'ShowObject' || key === 'LockedChannels') {
                // only used in editor
            } else if (key === 'ShadowOptions') {
                const shadowBits = parseInt(value)
                if (isNaN(shadowBits)) {
                    console.warn('Could not parse shadow options', value)
                } else {
                    const selfShadow = !!(shadowBits & 0b001)
                    const castShadow = !!(shadowBits & 0b010)
                    const receiveShadow = !!(shadowBits & 0b100)
                    currentObject.castShadow = selfShadow || castShadow
                    currentObject.receiveShadow = selfShadow || receiveShadow
                }
            } else if (key === 'ObjDissolve') {
                const times = []
                const opacities = []
                if (value == '(envelope)') {
                    let line = this.lines[++this.lineIndex]
                    const numOfInformationChannels = parseInt(line, 10)
                    if (numOfInformationChannels !== 1) console.error(`Number of information channels for opacity is not 1, but: ${numOfInformationChannels}`)
                    line = this.lines[++this.lineIndex]
                    const numOfKeyframes = parseInt(line, 10)
                    this.lineIndex++
                    for (let c = 0; c < numOfKeyframes; c++) {
                        let line = this.lines[this.lineIndex + c * 2]
                        if (line.startsWith('EndBehavior')) break
                        const opacity = 1 - parseInt(line, 10)
                        opacities.push(opacity)
                        line = this.lines[this.lineIndex + c * 2 + 1]
                        const keyframeIndex = parseInt(line.split(' ')[0], 10) // other entries in line should be zeros
                        const timeFromIndex = (keyframeIndex - this.firstFrame) / this.numOfKeyframes * this.lwscData.durationSeconds
                        times.push(timeFromIndex)
                    }
                    this.lineIndex += numOfKeyframes * 2
                } else {
                    times.push(0)
                    const opacity = 1 - parseInt(value, 10)
                    opacities.push(opacity)
                }
                currentObject.opacityTracks.push(new NumberKeyframeTrack(`.opacity`, times, opacities))
            } else if (key === 'PivotPoint') {
                currentObject.pivot = new Vector3().fromArray(value.split(' ').map((n) => parseInt(n, 10)))
            } else if (this.verbose) {
                console.warn(`Unhandled line in object block: ${line}; key: ${key}; value: ${value}`) // XXX implement all LWS features
            }
        }
        console.error('Parsing block reached content end')
        return currentObject
    }
}
