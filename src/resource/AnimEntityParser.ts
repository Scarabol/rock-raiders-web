import { iGet } from '../core/Util'
import { VERBOSE } from '../params'
import { AnimEntityActivity } from '../game/model/anim/AnimationActivity'

export class AnimEntityData {
    scale?: number
    carryNullName?: string
    carryNullFrames?: number
    depositNullName?: string
    toolNullName?: string
    wheelMesh?: string
    wheelRadius?: number
    wheelNullName?: string
    drillNullName?: string
    driverNullName?: string
    cameraNullName?: string
    cameraNullFrames?: number
    readonly highPolyBodies: Map<string, string> = new Map()
    readonly mediumPolyBodies: Map<string, string> = new Map()
    readonly lowPolyBodies: Map<string, string> = new Map()
    readonly fPPolyBodies: Map<string, Map<string, string>> = new Map()
    fireNullName?: string
    xPivotName?: string
    yPivotName?: string
    pivotMaxZ?: number
    pivotMinZ?: number
    readonly animations: AnimEntityAnimationData[] = []
    readonly upgradesByLevel: Map<string, AnimEntityUpgradeData[]> = new Map()
}

export interface AnimEntityAnimationData {
    name: string
    file: string
    transcoef: number
    looping: boolean
    trigger: number
}

export class AnimEntityUpgradeData {
    constructor(
        readonly lNameType: string,
        readonly lUpgradeFilepath: string,
        readonly parentNullName: string,
        readonly parentNullIndex: number,
    ) {
    }
}

export class AnimEntityParser {
    readonly animEntityData: AnimEntityData = new AnimEntityData()
    readonly knownAnimations: string[] = []

    constructor(readonly cfgRoot: object, readonly path: string, readonly verbose: boolean = false) {
    }

    parse(): AnimEntityData {
        Object.entries<any>(this.cfgRoot).forEach(([rootKey, value]) => {
            if (rootKey.equalsIgnoreCase('Scale')) {
                this.animEntityData.scale = Number(value)
            } else if (rootKey.equalsIgnoreCase('CarryNullName')) {
                this.animEntityData.carryNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('CarryNullFrames')) {
                this.animEntityData.carryNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('Shape')) {
                if (this.verbose) console.warn('TODO Derive buildings shape from this value') // XXX derive buildings surfaces shape from this value
            } else if (rootKey.equalsIgnoreCase('DepositNullName')) {
                this.animEntityData.depositNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('ToolNullName')) {
                this.animEntityData.toolNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('WheelMesh')) {
                if (!'NULL_OBJECT'.equalsIgnoreCase(value)) this.animEntityData.wheelMesh = this.path + value
            } else if (rootKey.equalsIgnoreCase('WheelRadius')) {
                this.animEntityData.wheelRadius = Number(value)
            } else if (rootKey.equalsIgnoreCase('WheelNullName')) {
                this.animEntityData.wheelNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('DrillNullName')) {
                this.animEntityData.drillNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('DriverNullName')) {
                this.animEntityData.driverNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('CameraNullName')) {
                this.animEntityData.cameraNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('CameraNullFrames')) {
                this.animEntityData.cameraNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('CameraFlipDir')) {
                // XXX what is this? flip upside down when hanging from rm?
            } else if (rootKey.equalsIgnoreCase('HighPoly')) {
                this.parsePolyBodies(value, this.animEntityData.highPolyBodies)
            } else if (rootKey.equalsIgnoreCase('MediumPoly')) {
                this.parsePolyBodies(value, this.animEntityData.mediumPolyBodies)
            } else if (rootKey.equalsIgnoreCase('LowPoly')) {
                this.parsePolyBodies(value, this.animEntityData.lowPolyBodies)
            } else if (rootKey.equalsIgnoreCase('FPPoly')) {
                ['Camera1', 'Camera2'].forEach((cameraName) => {
                    this.parsePolyBodies(iGet(value, cameraName), this.animEntityData.fPPolyBodies.getOrUpdate(cameraName, () => new Map()))
                })
            } else if (rootKey.equalsIgnoreCase('Activities')) {
                this.parseActivities(value)
            } else if (rootKey.equalsIgnoreCase('Upgrades')) {
                this.parseUpgrades(value)
            } else if (value['lwsfile']) { // some activities are not listed in the Activities section... try parse them anyway
                if (!this.knownAnimations.includes(rootKey)) {
                    try {
                        if (rootKey.equalsIgnoreCase('stand')) { // XXX workaround for walkerlegs.ae
                            this.parseActivityEntry(value, AnimEntityActivity.Stand)
                        } else {
                            // XXX What does it mean to have activities given outside of listing?
                            this.parseActivityEntry(value, rootKey)
                        }
                    } catch (e) {
                        if (this.verbose) console.warn(`Could not parse unlisted activity: ${rootKey}`, value, e)
                    }
                }
            } else if (this.parseUpgradeEntry(rootKey, value)) {
                if (VERBOSE) console.warn(`Entity has upgrade defined outside of upgrades group`, value)
            } else if (rootKey.equalsIgnoreCase('FireNullName')) {
                this.animEntityData.fireNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('xPivot')) {
                this.animEntityData.xPivotName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('yPivot')) {
                this.animEntityData.yPivotName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('PivotMaxZ')) {
                this.animEntityData.pivotMaxZ = value
            } else if (rootKey.equalsIgnoreCase('PivotMinZ')) {
                this.animEntityData.pivotMinZ = value
            } else if (this.verbose) {
                console.warn(`Unhandled animated entity key found: ${rootKey}`, value)
            }
        })

        return this.animEntityData
    }

    private parsePolyBodies(value: object, polyBodies: Map<string, string>) {
        Object.entries(value).forEach(([key, fileName]) => {
            const polyKey = key.startsWith('!') ? key.slice(1) : key
            const filePath = 'NULL'.equalsIgnoreCase(fileName) ? 'hidden' : `${fileName}.lwo`
            polyBodies.set(polyKey.toLowerCase(), filePath)
        })
    }

    private parseActivities(value: any) {
        Object.entries<string>(value).forEach(([activityName, keyName]) => {
            try {
                this.knownAnimations.push(keyName.toLowerCase())
                const act = iGet(this.cfgRoot, keyName)
                this.parseActivityEntry(act, activityName.toLowerCase())
            } catch (e) {
                console.error(e)
                console.log(this.cfgRoot)
                console.log(value)
                console.log(activityName)
            }
        })
    }

    private parseActivityEntry(act: any, lActivityName: string) {
        const file = iGet(act, 'FILE')
        const isLws = iGet(act, 'LWSFILE') === true
        const transcoef = iGet(act, 'TRANSCOEF')
        const looping = iGet(act, 'LOOPING') === true
        const trigger = iGet(act, 'TRIGGER') ?? 0
        if (isLws) {
            if (lActivityName.startsWith('!')) lActivityName = lActivityName.slice(1) // XXX What's the meaning of leading ! for activities???
            this.animEntityData.animations.push({name: lActivityName, file: this.path + file.toLowerCase(), transcoef, looping, trigger})
        } else {
            console.error('Found activity which is not an LWS file')
        }
    }

    private parseUpgrades(value: object) {
        Object.entries(value).forEach(([levelKey, upgradesCfg]) => {
            if (!this.parseUpgradeEntry(levelKey, upgradesCfg)) {
                console.warn(`Unexpected upgrade level key: ${levelKey}`)
            }
        })
    }

    private parseUpgradeEntry(levelKey: string, upgradesCfg: any): boolean {
        const match = levelKey.match(/level(\d\d\d\d)/i) // [carry] [scan] [speed] [drill]
        if (!match) return false
        const upgradesByLevel: AnimEntityUpgradeData[] = []
        Object.entries<[string, number][] | [string, number]>(upgradesCfg).forEach(([upgradeTypeName, upgradeEntry]) => {
            const upgradeEntries: [string, number][] = Array.isArray(upgradeEntry[0]) ? upgradeEntry as [string, number][] : [upgradeEntry as [string, number]]
            upgradeEntries.forEach((upgradeTypeEntry) => {
                const lNameType = upgradeTypeName.toLowerCase()
                upgradesByLevel.push(new AnimEntityUpgradeData(lNameType, this.path + lNameType, upgradeTypeEntry[0], upgradeTypeEntry[1] - 1))
            })
        })
        this.animEntityData.upgradesByLevel.set(match[1], upgradesByLevel)
        return true
    }
}
