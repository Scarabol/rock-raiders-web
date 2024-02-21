/**
 * This loader loads LWSC files exported from LW
 *
 * File format description: http://www.martinreddy.net/gfx/3d/LWSC.txt
 */

import { Euler, KeyframeTrack, NumberKeyframeTrack, Quaternion, QuaternionKeyframeTrack, StringKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three'
import { degToRad } from 'three/src/math/MathUtils'
import { getFilename } from '../../core/Util'
import { VERBOSE } from '../../params'

export class LWSCData {
    filePath: string = null
    framesPerSecond: number = 25
    durationSeconds: number = null
    readonly objects: LWSCObject[] = []
}

export class LWSCObject {
    fileName: string = null
    lowerName: string = null
    isNull: boolean = false
    sfxName: string = null
    parentObjInd: number = 0 // index is 1 based, 0 means no parent
    pivot: number[] = null
    readonly keyframeTracks: KeyframeTrack[] = []
    readonly positionTracks: VectorKeyframeTrack[] = []
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
    numOfKeyframes: number = 0

    constructor(filePath: string, content: string) {
        this.lwscData.filePath = filePath
        this.lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim())
        if (this.lines[0] !== 'LWSC') {
            throw new Error(`Invalid start of file! Got "${this.lines[0]}" expected 'LWSC' in first line`)
        }
    }

    parse(): LWSCData {
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
                this.parseObjectBlock()
            } else if (line.startsWith('PreviewFirstFrame ') || line.startsWith('PreviewLastFrame ') || line.startsWith('PreviewFrameStep ')) {
                // only used in editor
            } else if (VERBOSE) {
                console.warn(`Unexpected line: ${line}`) // XXX implement all LWS features
            }
        }

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
                this.lwscData.durationSeconds = this.numOfKeyframes / this.lwscData.framesPerSecond / this.frameStep
            } else if (key === 'LastFrame') {
                this.lastFrame = parseInt(value, 10)
                this.numOfKeyframes = this.lastFrame + 1 - this.firstFrame
                this.lwscData.durationSeconds = this.numOfKeyframes / this.lwscData.framesPerSecond / this.frameStep
            } else if (key === 'FrameStep') {
                this.frameStep = parseInt(value, 10)
                this.lwscData.durationSeconds = this.numOfKeyframes / this.lwscData.framesPerSecond / this.frameStep
            } else if (key === 'FramesPerSecond') {
                this.lwscData.framesPerSecond = parseInt(value, 10)
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
            if (!line) {
                if (currentObject.pivot?.some((v) => v > 0)) {
                    const translatedPositionTracks = currentObject.positionTracks.map((t) => {
                        const mappedValues = t.values.map((v, c) => {
                            // TODO Remove workaround of doom, otherwise telepthings.lwo which uses pivot point for rotation has offset from model
                            if ((c % 3) === 0) {
                                v += 0.08
                            } else if ((c % 3) === 2) {
                                v += 0.17
                            }
                            v -= currentObject.pivot[(c % 3)]
                            return v
                        })
                        t.values.set(mappedValues)
                        return t
                    })
                    currentObject.keyframeTracks.push(...translatedPositionTracks)
                } else {
                    currentObject.keyframeTracks.push(...currentObject.positionTracks)
                }
                return currentObject
            }
            const [key, value] = LWSCParser.parseLine(line)
            if (key === 'LoadObject') {
                currentObject.lowerName = currentObject.fileName = getFilename(value).toLowerCase()
                if (currentObject.lowerName.endsWith('.lwo')) {
                    currentObject.lowerName = currentObject.lowerName.slice(0, -'.lwo'.length)
                } else {
                    console.warn(`Unexpected object file name "${currentObject.fileName}"`)
                }
            } else if (key === 'AddNullObject') {
                const nameParts = value.split(',')
                currentObject.lowerName = nameParts[0].toLowerCase()
                if (currentObject.lowerName === 'sfx' || currentObject.lowerName === 'snd') {
                    currentObject.sfxName = nameParts[1]
                    if (currentObject.lowerName === 'snd') currentObject.sfxName = currentObject.sfxName.toLowerCase().replace('sfx_', 'snd_')
                    const sfxFrameStart = nameParts[2] ? parseInt(nameParts[2], 10) : 0
                    const sfxFrameEnd = nameParts[3] ? parseInt(nameParts[3], 10) : this.numOfKeyframes
                    const times = []
                    const sfxNames = []
                    for (let c = 0; c < this.numOfKeyframes; c++) {
                        times[c] = c / this.numOfKeyframes * this.lwscData.durationSeconds
                        sfxNames[c] = (sfxFrameStart <= c && c < sfxFrameEnd) ? currentObject.sfxName : ''
                    }
                    currentObject.keyframeTracks.push(new StringKeyframeTrack('.userData[sfxNameAnimation]', times, sfxNames))
                } else if (currentObject.lowerName.startsWith('*') || currentObject.lowerName.startsWith(';')) {
                    if (VERBOSE) console.warn(`Unexpected sfx object name ${currentObject.lowerName}`)
                }
                currentObject.isNull = true
            } else if (key === 'ObjectMotion') {
                let line = this.lines[++this.lineIndex]
                const lenInfos = parseInt(line, 10)
                line = this.lines[++this.lineIndex]
                const lenFrames = parseInt(line, 10)
                this.lineIndex++
                const times: number[] = []
                const relPos: number[] = []
                const relRot: number[] = []
                const relScale: number[] = []
                for (let c = 0; c < lenFrames; c++) {
                    let line = this.lines[this.lineIndex + c * 2]
                    if (line.startsWith('EndBehavior')) break
                    const infos = line.split(' ').map((n) => parseFloat(n))
                    if (infos.length !== lenInfos) console.warn(`Number of infos (${infos.length}) does not match with specified count (${lenInfos})`)
                    line = this.lines[this.lineIndex + c * 2 + 1]
                    const keyframeIndex = parseInt(line.split(' ')[0], 10) // other entries in line should be zeros
                    const timeFromIndex = (keyframeIndex - this.firstFrame) / (this.numOfKeyframes - 1) * this.lwscData.durationSeconds
                    times.push(timeFromIndex)
                    // LightWave coordinate system (left-handed) to three.js coordinate system (right-handed)
                    new Vector3(-infos[0], infos[1], infos[2]).toArray(relPos, relPos.length)
                    const heading = -degToRad(infos[3]) // heading aka. yaw -> y-axis
                    const pitch = degToRad(infos[4]) // pitch -> x-axis
                    const bank = -degToRad(infos[5]) // bank aka. roll -> z-axis
                    new Quaternion().setFromEuler(new Euler(pitch, heading, bank, 'YXZ'), true).toArray(relRot, relRot.length)
                    new Vector3(infos[6], infos[7], infos[8]).toArray(relScale, relScale.length)
                }
                currentObject.positionTracks.push(new VectorKeyframeTrack(`.position`, times, relPos))
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
                currentObject.pivot = value.split(' ').map((n) => parseFloat(n))
                if (currentObject.pivot?.[0]) currentObject.pivot[0] *= -1 // flip x-axis
            } else if (VERBOSE) {
                console.warn(`Unhandled line in object block: ${line}; key: ${key}; value: ${value}`) // XXX implement all LWS features
            }
        }
        console.error('Parsing block reached content end')
        return currentObject
    }
}
