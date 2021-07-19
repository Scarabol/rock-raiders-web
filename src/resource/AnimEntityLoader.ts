import { AudioListener, PositionalAudio } from 'three'
import { SoundManager } from '../audio/SoundManager'
import { getPath, iGet, iSet } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimationEntityUpgrade } from '../game/model/anim/AnimationEntityUpgrade'
import { AnimClip } from '../game/model/anim/AnimClip'
import { DEV_MODE, TILESIZE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { LWSCLoader } from './LWSCLoader'
import { ResourceManager } from './ResourceManager'

export class AnimEntityLoader {

    aeFilename: string
    path: string
    cfgRoot: any
    audioListener: AudioListener
    verbose: boolean
    entityType: AnimationEntityType = new AnimationEntityType()
    knownAnimations: string[] = []

    constructor(aeFilename: string, cfgRoot: any, audioListener: AudioListener, verbose: boolean = false) {
        this.aeFilename = aeFilename
        this.path = getPath(aeFilename)
        this.cfgRoot = cfgRoot
        this.audioListener = audioListener
        this.verbose = verbose
    }

    loadModels(): AnimationEntityType {
        Object.entries<any>(this.cfgRoot).forEach(([rootKey, value]) => {
            if (rootKey.equalsIgnoreCase('Scale')) {
                this.entityType.scale = Number(value)
            } else if (rootKey.equalsIgnoreCase('CarryNullName')) {
                this.entityType.carryNullName = value
            } else if (rootKey.equalsIgnoreCase('CarryNullFrames')) {
                this.entityType.carryNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('Shape')) {
                if (this.verbose) console.warn('TODO Derive buildings shape from this value') // XXX derive buildings surfaces shape from this value
            } else if (rootKey.equalsIgnoreCase('DepositNullName')) {
                this.entityType.depositNullName = value
            } else if (rootKey.equalsIgnoreCase('ToolNullName')) {
                this.entityType.toolNullName = value
            } else if (rootKey.equalsIgnoreCase('WheelMesh')) {
                if (!'NULL_OBJECT'.equalsIgnoreCase(value)) {
                    const lwoFilename = `${this.path + value}.lwo`
                    this.entityType.wheelMesh = ResourceManager.getLwoModel(lwoFilename)
                    if (!this.entityType.wheelMesh) console.error(`Could not load wheel mesh from: ${lwoFilename}`)
                }
            } else if (rootKey.equalsIgnoreCase('WheelRadius')) {
                this.entityType.wheelRadius = Number(value)
            } else if (rootKey.equalsIgnoreCase('WheelNullName')) {
                this.entityType.wheelNullName = value
            } else if (rootKey.equalsIgnoreCase('DrillNullName')) {
                this.entityType.drillNullName = value
            } else if (rootKey.equalsIgnoreCase('DriverNullName')) {
                this.entityType.driverNullName = value
            } else if (rootKey.equalsIgnoreCase('CameraNullName')) {
                this.entityType.cameraNullName = value
            } else if (rootKey.equalsIgnoreCase('CameraNullFrames')) {
                this.entityType.cameraNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('CameraFlipDir')) {
                // XXX what is this? flip upside down when hanging from rm?
            } else if (rootKey.equalsIgnoreCase('HighPoly')) {
                Object.keys(value).forEach((key) => {
                    const polyKey = key.startsWith('!') ? key.slice(1) : key
                    const mesh = ResourceManager.getLwoModel(`${this.path + value[key]}.lwo`)
                    this.entityType.highPolyBodies.set(polyKey.toLowerCase(), mesh)
                })
            } else if (rootKey.equalsIgnoreCase('MediumPoly')) {
                // TODO implement medium poly parsing
            } else if (rootKey.equalsIgnoreCase('LowPoly')) {
                // TODO implement low poly parsing
            } else if (rootKey.equalsIgnoreCase('FPPoly')) {
                // TODO implement first person poly parsing
            } else if (rootKey.equalsIgnoreCase('Activities')) {
                this.parseAnimations(value)
            } else if (rootKey.equalsIgnoreCase('Upgrades')) {
                this.parseUpgrades(value)
            } else if (value['lwsfile']) { // some activities are not listed in the Activities section... try parse them anyway
                if (!this.knownAnimations.includes(rootKey)) {
                    try {
                        this.parseActivity(value, `activity_${rootKey}`)
                    } catch (e) {
                        if (this.verbose) console.warn(`Could not parse unlisted activity: ${rootKey}`, value, e)
                    }
                }
            } else if (this.parseUpgradeEntry(rootKey, value)) {
                if (!DEV_MODE) console.warn(`Entity ${this.aeFilename} has upgrade defined outside of Upgrades group`, value)
            } else if (rootKey.equalsIgnoreCase('FireNullName')) {
                this.entityType.fireNullName = value
            } else if (rootKey.match(/^[xy]Pivot$/i)) {
                iSet(this.entityType, rootKey, value)
            } else if (rootKey.equalsIgnoreCase('PivotMaxZ')) {
                this.entityType.PivotMaxZ = value
            } else if (rootKey.equalsIgnoreCase('PivotMinZ')) {
                this.entityType.PivotMinZ = value
            } else if (this.verbose) {
                console.warn(`Unhandled animated entity key found: ${rootKey}`, value)
            }
        })

        this.finalizeAnimations()

        return this.entityType
    }

    private parseAnimations(value) {
        Object.entries<string>(value).forEach(([activityName, keyName]) => {
            try {
                this.knownAnimations.push(keyName.toLowerCase())
                const act = iGet(this.cfgRoot, keyName)
                this.parseActivity(act, activityName.toLowerCase())
            } catch (e) {
                console.error(e)
                console.log(this.cfgRoot)
                console.log(value)
                console.log(activityName)
            }
        })
    }

    private parseActivity(act: any, lActivityName: string) {
        const file = iGet(act, 'FILE')
        const isLws = iGet(act, 'LWSFILE') === true
        const transcoef = iGet(act, 'TRANSCOEF')
        const looping = iGet(act, 'LOOPING') === true
        if (isLws) {
            const animation = new LWSCLoader(this.verbose).parse(`${this.path + file}.lws`)
            animation.looping = looping
            animation.transcoef = Number(transcoef) || animation.transcoef
            if (lActivityName.startsWith('!')) lActivityName = lActivityName.substr(1) // XXX Whats the meaning of leading ! for activities???
            this.entityType.animations.set(lActivityName, animation)
        } else {
            console.error('Found activity which is not an LWS file')
        }
    }

    private parseUpgrades(value) {
        Object.entries(value).forEach(([levelKey, upgradesCfg]) => {
            if (!this.parseUpgradeEntry(levelKey, upgradesCfg)) {
                console.warn(`Unexpected upgrade level key: ${levelKey}`)
            }
        })
    }

    private parseUpgradeEntry(levelKey: string, upgradesCfg): boolean {
        const match = levelKey.match(/level(\d\d\d\d)/i) // [carry] [scan] [speed] [drill]
        if (!match) return false
        const upgradesByLevel = []
        Object.entries<unknown[]>(upgradesCfg).forEach(([upgradeTypeName, upgradeEntry]) => {
            const upgradeFilepath = ResourceManager.cfg('UpgradeTypes', upgradeTypeName) || this.path + upgradeTypeName
            const upgradeEntries = Array.isArray(upgradeEntry[0]) ? upgradeEntry : [upgradeEntry]
            upgradeEntries.forEach((upgradeTypeEntry) => {
                upgradesByLevel.push(new AnimationEntityUpgrade(upgradeFilepath, upgradeTypeEntry[0], upgradeTypeEntry[1] - 1))
            })
        })
        this.entityType.upgradesByLevel.set(match[1], upgradesByLevel)
        return true
    }

    private finalizeAnimations() {
        this.entityType.animations.forEach((animation) => {
            this.resolveAnimationBodies(animation)

            if (this.entityType.wheelMesh) {
                animation.wheelJoints.forEach((joint) => {
                    joint.add(this.entityType.wheelMesh.clone(true))
                })
            }

            animation.polyRootGroup.scale.setScalar(this.entityType.scale)
            animation.animatedPolys.forEach((body, index) => { // not all bodies may have been added in first iteration
                const polyPart = animation.polyList[index]
                const parentInd = body.parentObjInd
                if (parentInd !== undefined && parentInd !== null) { // can be 0
                    animation.polyList[parentInd].add(polyPart)
                } else {
                    animation.polyRootGroup.add(polyPart)
                }
            })
        })
    }

    private resolveAnimationBodies(animation: AnimClip) {
        animation.animatedPolys.forEach((body) => {
            let model = this.entityType.highPolyBodies.get(body.lowerName)
            if (!model) model = this.entityType.mediumPolyBodies.get(body.lowerName)
            if (!model) model = body.model
            const polyModel = model.clone()
            animation.polyList.push(polyModel)
            if (body.lowerName) {
                if (body.lowerName.equalsIgnoreCase(this.entityType.carryNullName)) {
                    animation.carryJoints.push(polyModel)
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.depositNullName)) {
                    animation.depositJoint = polyModel
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.toolNullName)) {
                    animation.getToolJoint = polyModel
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.wheelNullName)) {
                    animation.wheelJoints.push(polyModel)
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.drillNullName)) {
                    animation.drillJoints.push(polyModel)
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.driverNullName)) {
                    animation.driverJoint = polyModel
                } else if (body.isNull) {
                    animation.nullJoints.getOrUpdate(body.lowerName.toLowerCase(), () => []).push(polyModel)
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.xPivot)) {
                    animation.xPivot = polyModel
                } else if (body.lowerName.equalsIgnoreCase(this.entityType.yPivot)) {
                    animation.yPivot = polyModel
                }
            }
            if (body.sfxName) {
                const audio = new PositionalAudio(this.audioListener)
                audio.setRefDistance(TILESIZE * 6) // TODO optimize ref distance for SFX sounds
                audio.loop = false
                polyModel.add(audio)
                if (!body.sfxName.equalsIgnoreCase('snd_music')) {
                    SoundManager.getSoundBuffer(body.sfxName)?.then((audioBuffer) => {
                        audio.setBuffer(audioBuffer)
                    })
                    body.sfxFrames.forEach((frame) => animation.sfxAudioByFrame.getOrUpdate(frame, () => []).push(audio))
                }
            }
        })
        if (!animation.driverJoint) {
            animation.driverJoint = new SceneMesh()
            animation.driverJoint.name = 'driverJoint'
            animation.polyRootGroup.add(animation.driverJoint)
        }
    }

}
