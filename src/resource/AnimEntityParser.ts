import { iGet, iSet } from '../core/Util'
import { DEV_MODE } from '../params'
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
    fireNullName: string
    pivotMaxZ?: number
    pivotMinZ?: number
    readonly animations: AnimEntityAnimationData[] = []
    readonly upgradesByLevel: Map<string, AnimEntityUpgradeData[]> = new Map()
}

export class AnimEntityAnimationData {
    name: string
    file: string
    transcoef: number
    looping: boolean
}

export class AnimEntityUpgradeData {
    constructor(
        readonly lNameType: string,
        readonly parentNullName: string,
        readonly parentNullIndex: number,
    ) {
    }
}

export class AnimEntityParser {
    readonly lwoFiles: string[] = []
    readonly lwsFiles: string[] = []
    readonly entityType: AnimEntityData = new AnimEntityData()
    readonly knownAnimations: string[] = []

    constructor(readonly cfgRoot: object, readonly path: string, readonly verbose: boolean = false) {
        const wheelMeshName = iGet(this.cfgRoot, 'WheelMesh')
        if (wheelMeshName && !'NULL_OBJECT'.equalsIgnoreCase(wheelMeshName)) {
            this.lwoFiles.add(`${path + wheelMeshName}.lwo`)
        }
        ;['HighPoly', 'MediumPoly', 'LowPoly'].forEach((polyType) => {
            const cfgPoly = iGet(this.cfgRoot, polyType)
            if (cfgPoly) {
                Object.keys(cfgPoly).forEach((key) => {
                    const fileName = cfgPoly[key]
                    if (!'NULL'.equalsIgnoreCase(fileName)) {
                        this.lwoFiles.add(`${path + fileName}.lwo`)
                    }
                })
            }
        })
        ;['FPPoly'].forEach((polyType) => {
            const cfgFirstPerson = iGet(this.cfgRoot, polyType)
            if (cfgFirstPerson) {
                ['Camera1', 'Camera2'].forEach((cameraName) => {
                    const cfgCamera = iGet(cfgFirstPerson, cameraName)
                    if (cfgCamera) {
                        Object.keys(cfgCamera).forEach((key) => {
                            const fileName = cfgCamera[key]
                            if (!'NULL'.equalsIgnoreCase(fileName)) {
                                this.lwoFiles.add(`${path + fileName}.lwo`)
                            }
                        })
                    }
                })
            }
        })
        Object.keys(this.cfgRoot).forEach((cfgKey) => {
            try {
                const value = this.cfgRoot[cfgKey]
                const isLws = iGet(value, 'LWSFILE') === true
                if (isLws) {
                    const file = iGet(value, 'FILE')
                    this.lwsFiles.add(`${path + file}.lws`)
                }
            } catch (e) {
                // XXX do we have to care? files listed in pilot.ae can be found in vehicles/hoverboard/...
            }
        })
    }

    parse(): AnimEntityData {
        Object.entries<any>(this.cfgRoot).forEach(([rootKey, value]) => {
            if (rootKey.equalsIgnoreCase('Scale')) {
                this.entityType.scale = Number(value)
            } else if (rootKey.equalsIgnoreCase('CarryNullName')) {
                this.entityType.carryNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('CarryNullFrames')) {
                this.entityType.carryNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('Shape')) {
                if (this.verbose) console.warn('TODO Derive buildings shape from this value') // XXX derive buildings surfaces shape from this value
            } else if (rootKey.equalsIgnoreCase('DepositNullName')) {
                this.entityType.depositNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('ToolNullName')) {
                this.entityType.toolNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('WheelMesh')) {
                if (!'NULL_OBJECT'.equalsIgnoreCase(value)) this.entityType.wheelMesh = this.path + value
            } else if (rootKey.equalsIgnoreCase('WheelRadius')) {
                this.entityType.wheelRadius = Number(value)
            } else if (rootKey.equalsIgnoreCase('WheelNullName')) {
                this.entityType.wheelNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('DrillNullName')) {
                this.entityType.drillNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('DriverNullName')) {
                this.entityType.driverNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('CameraNullName')) {
                this.entityType.cameraNullName = value.toLowerCase()
            } else if (rootKey.equalsIgnoreCase('CameraNullFrames')) {
                this.entityType.cameraNullFrames = Number(value)
            } else if (rootKey.equalsIgnoreCase('CameraFlipDir')) {
                // XXX what is this? flip upside down when hanging from rm?
            } else if (rootKey.equalsIgnoreCase('HighPoly')) {
                this.parsePolyBodies(value, this.entityType.highPolyBodies)
            } else if (rootKey.equalsIgnoreCase('MediumPoly')) {
                this.parsePolyBodies(value, this.entityType.mediumPolyBodies)
            } else if (rootKey.equalsIgnoreCase('LowPoly')) {
                this.parsePolyBodies(value, this.entityType.lowPolyBodies)
            } else if (rootKey.equalsIgnoreCase('FPPoly')) {
                ['Camera1', 'Camera2'].forEach((cameraName) => {
                    this.parsePolyBodies(iGet(value, cameraName), this.entityType.fPPolyBodies.getOrUpdate(cameraName, () => new Map()))
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
                            if (!DEV_MODE) console.warn(`Parsing unlisted activity '${rootKey}'`)
                            this.parseActivityEntry(value, rootKey)
                        }
                    } catch (e) {
                        if (this.verbose) console.warn(`Could not parse unlisted activity: ${rootKey}`, value, e)
                    }
                }
            } else if (this.parseUpgradeEntry(rootKey, value)) {
                if (!DEV_MODE) console.warn(`Entity has upgrade defined outside of Upgrades group`, value)
            } else if (rootKey.equalsIgnoreCase('FireNullName')) {
                this.entityType.fireNullName = value.toLowerCase()
            } else if (rootKey.match(/^[xy]Pivot$/i)) {
                iSet(this.entityType, rootKey, value)
            } else if (rootKey.equalsIgnoreCase('PivotMaxZ')) {
                this.entityType.pivotMaxZ = value
            } else if (rootKey.equalsIgnoreCase('PivotMinZ')) {
                this.entityType.pivotMinZ = value
            } else if (this.verbose) {
                console.warn(`Unhandled animated entity key found: ${rootKey}`, value)
            }
        })

        return this.entityType
    }

    private parsePolyBodies(value, polyBodies: Map<string, string>) {
        Object.keys(value).forEach((key) => {
            const polyKey = key.startsWith('!') ? key.slice(1) : key
            const fileName = value[key]
            const filePath = 'NULL'.equalsIgnoreCase(fileName) ? 'hidden' : `${this.path + fileName}.lwo`
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
        if (isLws) {
            if (lActivityName.startsWith('!')) lActivityName = lActivityName.substring(1) // XXX What's the meaning of leading ! for activities???
            this.entityType.animations.push({name: lActivityName, file: this.path + file.toLowerCase(), transcoef, looping})
        } else {
            console.error('Found activity which is not an LWS file')
        }
    }

    private parseUpgrades(value: any) {
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
        Object.entries<unknown[]>(upgradesCfg).forEach(([upgradeTypeName, upgradeEntry]) => {
            const upgradeEntries = Array.isArray(upgradeEntry[0]) ? upgradeEntry : [upgradeEntry]
            upgradeEntries.forEach((upgradeTypeEntry) => {
                upgradesByLevel.push(new AnimEntityUpgradeData(upgradeTypeName.toLowerCase(), upgradeTypeEntry[0], upgradeTypeEntry[1] - 1))
            })
        })
        this.entityType.upgradesByLevel.set(match[1], upgradesByLevel)
        return true
    }
}
