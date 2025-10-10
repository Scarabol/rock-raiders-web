/**
 * This loader loads LWSC files exported from LW
 *
 * File format description: http://www.martinreddy.net/gfx/3d/LWSC.txt
 */

import { Euler, KeyframeTrack, Matrix4, NumberKeyframeTrack, Quaternion, QuaternionKeyframeTrack, StringKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three'
import { degToRad } from 'three/src/math/MathUtils'
import { getFilename } from '../../core/Util'
import { VERBOSE } from '../../params'

export class LWSCData {
    filePath: string = ''
    framesPerSecond: number = 25
    durationSeconds: number = 0
    readonly objects: LWSCObject[] = []
}

export class LWSCObject {
    fileName: string = ''
    lowerName: string = ''
    isNull: boolean = false
    sfxName: string = ''
    parentObjInd: number = 0 // index is 1 based, 0 means no parent
    readonly pivot: Vector3 = new Vector3()
    readonly keyframeTracks: KeyframeTrack[] = []
    readonly opacityTracks: NumberKeyframeTrack[] = []
    castShadow: boolean = false
    receiveShadow: boolean = false
}

// noinspection PointlessArithmeticExpressionJS
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
        const sceneFileVersion = Number(this.lines[1])
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
        const key = lineParts.shift() || ''
        const value = lineParts.join(' ')
        return [key, value]
    }

    private parseFrameBlock() {
        for (; this.lineIndex < this.lines.length; this.lineIndex++) {
            const line = this.lines[this.lineIndex]
            if (!line) return
            const [key, value] = LWSCParser.parseLine(line)
            if (key === 'FirstFrame') {
                this.firstFrame = Number(value)
                this.numOfKeyframes = this.lastFrame + 1 - this.firstFrame
                this.lwscData.durationSeconds = this.numOfKeyframes / this.lwscData.framesPerSecond / this.frameStep
            } else if (key === 'LastFrame') {
                this.lastFrame = Number(value)
                this.numOfKeyframes = this.lastFrame + 1 - this.firstFrame
                this.lwscData.durationSeconds = this.numOfKeyframes / this.lwscData.framesPerSecond / this.frameStep
            } else if (key === 'FrameStep') {
                this.frameStep = Number(value)
                this.lwscData.durationSeconds = this.numOfKeyframes / this.lwscData.framesPerSecond / this.frameStep
            } else if (key === 'FramesPerSecond') {
                this.lwscData.framesPerSecond = Number(value)
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
                const positionTrack: KeyframeTrack | undefined = currentObject.keyframeTracks.find(({name}) => name === '.position')
                const rotationTrack: KeyframeTrack | undefined = currentObject.keyframeTracks.find(({name}) => name == '.quaternion')
                const scaleTrack: KeyframeTrack | undefined = currentObject.keyframeTracks.find(({name}) => name === '.scale')
                const invPivotMat = new Matrix4().makeTranslation(currentObject.pivot).invert()
                const positionMat = new Matrix4()
                const rotation = new Quaternion()
                const rotationMat = new Matrix4()
                const scaleMat = new Matrix4()
                const calcMat = new Matrix4()
                const newPosition = new Vector3()
                const newRotation = new Quaternion()
                const newScale = new Vector3()
                const minTimesLength = Math.min(positionTrack?.times.length ?? 0, rotationTrack?.times.length ?? 0, scaleTrack?.times.length ?? 0)
                if (positionTrack?.times.length !== minTimesLength || rotationTrack?.times.length !== minTimesLength || scaleTrack?.times.length !== minTimesLength) {
                    console.error(`track lengths don't match: positionTrack=${positionTrack?.times.length}, rotationTrack=${rotationTrack?.times.length}, scaleTrack=${scaleTrack?.times.length}`)
                }
                for (let i = 0; i < minTimesLength; i += 1) {
                    if (positionTrack) positionMat.makeTranslation(
                        positionTrack.values[i * positionTrack.getValueSize() + 0],
                        positionTrack.values[i * positionTrack.getValueSize() + 1],
                        positionTrack.values[i * positionTrack.getValueSize() + 2],
                    )
                    if (rotationTrack) rotationMat.makeRotationFromQuaternion(rotation.set(
                        rotationTrack.values[i * rotationTrack.getValueSize() + 0],
                        rotationTrack.values[i * rotationTrack.getValueSize() + 1],
                        rotationTrack.values[i * rotationTrack.getValueSize() + 2],
                        rotationTrack.values[i * rotationTrack.getValueSize() + 3],
                    ))
                    if (scaleTrack) scaleMat.makeScale(
                        scaleTrack.values[i * scaleTrack.getValueSize() + 0],
                        scaleTrack.values[i * scaleTrack.getValueSize() + 1],
                        scaleTrack.values[i * scaleTrack.getValueSize() + 2],
                    )
                    calcMat.identity().multiply(positionMat).multiply(rotationMat).multiply(scaleMat).multiply(invPivotMat).decompose(newPosition, newRotation, newScale)
                    if (positionTrack) {
                        positionTrack.values[i * positionTrack.getValueSize() + 0] = newPosition.x
                        positionTrack.values[i * positionTrack.getValueSize() + 1] = newPosition.y
                        positionTrack.values[i * positionTrack.getValueSize() + 2] = newPosition.z
                    }
                    if (rotationTrack) {
                        rotationTrack.values[i * rotationTrack.getValueSize() + 0] = newRotation.x
                        rotationTrack.values[i * rotationTrack.getValueSize() + 1] = newRotation.y
                        rotationTrack.values[i * rotationTrack.getValueSize() + 2] = newRotation.z
                        rotationTrack.values[i * rotationTrack.getValueSize() + 3] = newRotation.w
                    }
                    if (scaleTrack) {
                        scaleTrack.values[i * scaleTrack.getValueSize() + 0] = newScale.x
                        scaleTrack.values[i * scaleTrack.getValueSize() + 1] = newScale.y
                        scaleTrack.values[i * scaleTrack.getValueSize() + 2] = newScale.z
                    }
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
                    const sfxFrameStart = nameParts[2] ? Number(nameParts[2]) : 0
                    const sfxFrameEnd = nameParts[3] ? Number(nameParts[3]) : Math.min(sfxFrameStart + 3, this.numOfKeyframes)
                    const times: number[] = []
                    const sfxNames: string[] = []
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
                const lenInfos = Number(line)
                line = this.lines[++this.lineIndex]
                const lenFrames = Number(line)
                this.lineIndex++
                const times: number[] = []
                const relPos: number[] = []
                const relRot: number[] = []
                const relScale: number[] = []
                for (let c = 0; c < lenFrames; c++) {
                    let line = this.lines[this.lineIndex + c * 2]
                    if (line.startsWith('EndBehavior')) break
                    const infos = line.split(' ').map((n) => Number(n))
                    if (infos.length !== lenInfos) console.warn(`Number of infos (${infos.length}) does not match with specified count (${lenInfos})`)
                    line = this.lines[this.lineIndex + c * 2 + 1]
                    const keyframeIndex = Number(line.split(' ')[0]) // other entries in line should be zeros
                    let timeFromIndex = 0
                    if (this.numOfKeyframes > 1) {
                        timeFromIndex = (keyframeIndex - this.firstFrame) / (this.numOfKeyframes - 1) * this.lwscData.durationSeconds
                    }
                    times.push(timeFromIndex)
                    // LightWave coordinate system (left-handed) to three.js coordinate system (right-handed)
                    new Vector3(-infos[0], infos[1], infos[2]).toArray(relPos, relPos.length)
                    const heading = -degToRad(infos[3]) // heading aka. yaw -> y-axis
                    const pitch = degToRad(infos[4]) // pitch -> x-axis
                    const bank = -degToRad(infos[5]) // bank aka. roll -> z-axis
                    new Quaternion().setFromEuler(new Euler(pitch, heading, bank, 'YXZ'), true).toArray(relRot, relRot.length)
                    new Vector3(infos[6], infos[7], infos[8]).toArray(relScale, relScale.length)
                }
                currentObject.keyframeTracks.push(new VectorKeyframeTrack(`.position`, times, relPos))
                currentObject.keyframeTracks.push(new QuaternionKeyframeTrack(`.quaternion`, times, relRot))
                currentObject.keyframeTracks.push(new VectorKeyframeTrack(`.scale`, times, relScale))
                this.lineIndex += lenFrames * 2
            } else if (key === 'ParentObject') {
                currentObject.parentObjInd = Number(value) // index is 1 based
            } else if (key === 'ShowObject' || key === 'LockedChannels') {
                // only used in editor
            } else if (key === 'ShadowOptions') {
                const shadowBits = Number(value)
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
                    const numOfInformationChannels = Number(line)
                    if (numOfInformationChannels !== 1) console.error(`Number of information channels for opacity is not 1, but: ${numOfInformationChannels}`)
                    line = this.lines[++this.lineIndex]
                    const numOfKeyframes = Number(line)
                    this.lineIndex++
                    for (let c = 0; c < numOfKeyframes; c++) {
                        let line = this.lines[this.lineIndex + c * 2]
                        if (line.startsWith('EndBehavior')) break
                        const opacity = 1 - Number(line)
                        opacities.push(opacity)
                        line = this.lines[this.lineIndex + c * 2 + 1]
                        const keyframeIndex = Number(line.split(' ')[0]) // other entries in line should be zeros
                        const timeFromIndex = (keyframeIndex - this.firstFrame) / this.numOfKeyframes * this.lwscData.durationSeconds
                        times.push(timeFromIndex)
                    }
                    this.lineIndex += numOfKeyframes * 2
                } else {
                    times.push(0)
                    const opacity = 1 - Number(value)
                    opacities.push(opacity)
                }
                currentObject.opacityTracks.push(new NumberKeyframeTrack(`.opacity`, times, opacities))
            } else if (key === 'PivotPoint') {
                const pivotElements = value.split(' ').map((n) => Number(n))
                if (pivotElements.length === 3) {
                    currentObject.pivot.set(-pivotElements[0] /* flip x-axis */, pivotElements[1], pivotElements[2])
                } else {
                    console.error(`Number of elements for PivotPoint is not 3, but: ${pivotElements.length}`)
                }
            } else if (VERBOSE) {
                console.warn(`Unhandled line in object block: ${line}; key: ${key}; value: ${value}`) // XXX implement all LWS features
            }
        }
        console.error('Parsing block reached content end')
        return currentObject
    }
}
