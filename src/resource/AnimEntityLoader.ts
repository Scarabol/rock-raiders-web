import { AudioListener, PositionalAudio } from 'three'
import { SoundManager } from '../audio/SoundManager'
import { getPath, iGet } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimationEntityUpgrade } from '../game/model/anim/AnimationEntityUpgrade'
import { AnimClip } from '../game/model/anim/AnimClip'
import { TILESIZE } from '../params'
import { LWSCLoader } from './LWSCLoader'
import { ResourceManager } from './ResourceManager'

export class AnimEntityLoader {

    static loadModels(aeFilename: string, cfgRoot: any, audioListener: AudioListener, verbose: boolean = false): AnimationEntityType {
        const path = getPath(aeFilename)
        const entityType = new AnimationEntityType()
        Object.keys(cfgRoot).forEach((rootKey: string) => {
            const value = cfgRoot[rootKey]
            if (rootKey.equalsIgnoreCase('Scale')) {
                entityType.scale = Number(value)
            } else if (rootKey.equalsIgnoreCase('CarryNullName')) {
                entityType.carryNullName = value
            } else if (rootKey.equalsIgnoreCase('CarryNullFrames')) {
                entityType.carryNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('Shape')) {
                if (verbose) console.warn('TODO Derive buildings shape from this value') // XXX derive buildings surfaces shape from this value
            } else if (rootKey.equalsIgnoreCase('DepositNullName')) {
                entityType.depositNullName = value
            } else if (rootKey.equalsIgnoreCase('ToolNullName')) {
                entityType.toolNullName = value
            } else if (rootKey.equalsIgnoreCase('WheelMesh')) {
                if (!'NULL_OBJECT'.equalsIgnoreCase(value)) {
                    const lwoFilename = path + value + '.lwo'
                    entityType.wheelMesh = ResourceManager.getLwoModel(lwoFilename)
                    if (!entityType.wheelMesh) console.error('Could not load wheel mesh from: ' + lwoFilename)
                }
            } else if (rootKey.equalsIgnoreCase('WheelRadius')) {
                entityType.wheelRadius = Number(value)
            } else if (rootKey.equalsIgnoreCase('WheelNullName')) {
                entityType.wheelNullName = value
            } else if (rootKey.equalsIgnoreCase('DrillNullName')) {
                entityType.drillNullName = value
            } else if (rootKey.equalsIgnoreCase('DriverNullName')) {
                entityType.driverNullName = value
            } else if (rootKey.equalsIgnoreCase('CameraNullName')) {
                entityType.cameraNullName = value
            } else if (rootKey.equalsIgnoreCase('CameraNullFrames')) {
                entityType.cameraNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('CameraFlipDir')) {
                // XXX what is this? flip upside down when hanging from rm?
            } else if (rootKey.equalsIgnoreCase('HighPoly')) {
                Object.keys(value).forEach((key) => {
                    const polyKey = key.startsWith('!') ? key.slice(1) : key
                    const mesh = ResourceManager.getLwoModel(path + value[key] + '.lwo')
                    entityType.highPolyBodies.set(polyKey.toLowerCase(), mesh)
                })
            } else if (rootKey.equalsIgnoreCase('MediumPoly')) {
                // TODO implement medium poly parsing
            } else if (rootKey.equalsIgnoreCase('LowPoly')) {
                // TODO implement low poly parsing
            } else if (rootKey.equalsIgnoreCase('FPPoly')) {
                // TODO implement first person poly parsing
            } else if (rootKey.equalsIgnoreCase('Activities')) {
                entityType.animations = this.parseAnimations(value, cfgRoot, path, verbose)
            } else if (rootKey.equalsIgnoreCase('Upgrades')) {
                entityType.upgradesByLevel = this.parseUpgrades(value)
            } else if (rootKey.match(/level\d\d\d\d/i)) {
                // TODO geo dome has upgrade defined at root level without Upgrades group
            } else if (verbose && !value['lwsfile']) {
                console.warn('Unhandled animated entity key found: ' + rootKey, value)
            }
        })

        entityType.animations.forEach((animation) => {
            animation.bodies.forEach((body) => {
                let model = entityType.highPolyBodies.get(body.lowerName)
                if (!model) model = entityType.mediumPolyBodies.get(body.lowerName)
                if (!model) model = body.model
                const polyModel = model.clone()
                animation.polyList.push(polyModel)
                if (body.lowerName) {
                    if (body.lowerName.equalsIgnoreCase(entityType.carryNullName)) {
                        animation.carryJoint = polyModel
                    } else if (body.lowerName.equalsIgnoreCase(entityType.depositNullName)) {
                        animation.depositJoint = polyModel
                    } else if (body.lowerName.equalsIgnoreCase(entityType.toolNullName)) {
                        animation.getToolJoint = polyModel
                    } else if (body.lowerName.equalsIgnoreCase(entityType.wheelNullName)) {
                        animation.wheelJoints.push(polyModel)
                    } else if (body.lowerName.equalsIgnoreCase(entityType.drillNullName)) {
                        animation.drillJoint = polyModel
                    } else if (body.lowerName.equalsIgnoreCase(entityType.driverNullName)) {
                        animation.driverJoint = polyModel
                    } else if (body.isNull) {
                        animation.nullJoints.getOrUpdate(body.lowerName.toLowerCase(), () => []).push(polyModel)
                    }
                }
                if (body.sfxName) {
                    const audio = new PositionalAudio(audioListener)
                    audio.setRefDistance(TILESIZE * 6) // TODO optimize ref distance for SFX sounds
                    audio.loop = false
                    polyModel.add(audio)
                    SoundManager.getSoundBuffer(body.sfxName).then((audioBuffer) => {
                        audio.setBuffer(audioBuffer)
                    })
                    body.sfxFrames.forEach((frame) => animation.sfxAudioByFrame.getOrUpdate(frame, () => []).push(audio))
                }
            })

            if (entityType.wheelMesh) {
                animation.wheelJoints.forEach((joint) => {
                    joint.add(entityType.wheelMesh.clone(true))
                })
            }

            const upgrades0000 = entityType.upgradesByLevel.get('0000')
            if (upgrades0000) { // TODO check for other upgrade levels
                upgrades0000.forEach((upgrade) => {
                    const joint = animation.nullJoints.get(upgrade.upgradeNullName.toLowerCase())?.[upgrade.upgradeNullIndex]
                    if (joint) {
                        const lwoModel = ResourceManager.getLwoModel(upgrade.upgradeFilepath + '.lwo')
                        if (lwoModel) {
                            joint.add(lwoModel)
                        } else {
                            const upgradeModels = ResourceManager.getAnimationEntityType(upgrade.upgradeFilepath + '/' + upgrade.upgradeFilepath.split('/').last() + '.ae', audioListener)
                            upgradeModels.animations.get('activity_stand')?.bodies.forEach((b) => joint.add(b.model.clone()))
                        }
                    }
                })
            }

            animation.polyModel.scale.setScalar(entityType.scale)
            animation.bodies.forEach((body, index) => { // not all bodies may have been added in first iteration
                const polyPart = animation.polyList[index]
                const parentInd = body.parentObjInd
                if (parentInd !== undefined && parentInd !== null) { // can be 0
                    animation.polyList[parentInd].add(polyPart)
                } else {
                    animation.polyModel.add(polyPart)
                }
            })
        })

        return entityType
    }

    private static parseAnimations(value, root, path: string, verbose: boolean): Map<string, AnimClip> {
        const animations = new Map<string, AnimClip>()
        Object.keys(value).forEach((activity) => {
            try {
                let keyname = iGet(value, activity)
                const act: { file: string, transcoef: number, lwsfile: boolean, animation: AnimClip, keyname: string } = iGet(root, keyname)
                const file = iGet(act, 'FILE')
                const isLws = iGet(act, 'LWSFILE') === true
                const transcoef = iGet(act, 'TRANSCOEF')
                const looping = iGet(act, 'LOOPING') === true
                if (isLws) {
                    const content = ResourceManager.getResource(path + file + '.lws')
                    const animation = new LWSCLoader(path, verbose).parse(content)
                    animation.looping = looping
                    animation.transcoef = transcoef ? Number(transcoef) : 1
                    animations.set(activity.toLowerCase(), animation)
                } else {
                    console.error('Found activity which is not an LWS file')
                }
            } catch (e) {
                console.error(e)
                console.log(root)
                console.log(value)
                console.log(activity)
            }
        })
        return animations
    }

    private static parseUpgrades(value) {
        const upgrades = new Map<string, AnimationEntityUpgrade[]>()
        Object.keys(value).forEach((levelKey: string) => {
            const match = levelKey.match(/level(\d\d\d\d)/i) // [carry] [scan] [speed] [drill]
            if (match) {
                const upgradeValue = value[levelKey]
                upgrades.set(match[1], Object.keys(upgradeValue).map((upgradeName: string) => {
                    const upgradeFilepath = ResourceManager.cfg('UpgradeTypes', upgradeName)
                    const upgradeNullName = upgradeValue[upgradeName][0][0]
                    const upgradeNullIndex = Number(upgradeValue[upgradeName][1][0]) - 1
                    return new AnimationEntityUpgrade(upgradeFilepath, upgradeNullName, upgradeNullIndex)
                }))
            } else {
                console.warn('Unexpected upgrade level key: ' + levelKey)
            }
        })
        return upgrades
    }

}
