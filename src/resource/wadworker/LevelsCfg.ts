export class LevelsCfg {

    levelsByName: {} = []

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((levelKey) => {
            if (!levelKey.startsWith('Tutorial') && !levelKey.startsWith('Level')) return // ignore incomplete test levels and duplicates
            this.levelsByName[levelKey] = new LevelEntryCfg(cfgObj[levelKey])
        })
    }

}

export class LevelEntryCfg {

    fullName: any = ''
    endGameAvi1: string = ''
    endGameAvi2: string = ''
    allowRename: boolean = false
    recallOLObjects: boolean = false
    generateSpiders: boolean = false
    video: string = ''
    disableEndTeleport: any = ''
    disableStartTeleport: any = ''
    emergeTimeOut: any = ''
    boulderAnimation: any = ''
    noMultiSelect: any = ''
    noAutoEat: any = ''
    disableToolTipSound: any = ''
    blockSize: any = ''
    digDepth: any = ''
    roughLevel: any = ''
    roofHeight: any = ''
    useRoof: any = ''
    selBoxHeight: any = ''
    fpRotLightRGB: any = ''
    fogColourRGB: any = ''
    highFogColourRGB: any = ''
    fogRate: number = 0
    fallinMultiplier: number = 0
    numberOfLandSlidesTillCaveIn: number = 0
    noFallins: boolean = false
    oxygenRate: number = 0 // 0 - 100
    surfaceMap: string = ''
    predugMap: string = ''
    terrainMap: string = ''
    emergeMap: string = ''
    erodeMap: string = ''
    fallinMap: string = ''
    blockPointersMap: string = ''
    cryOreMap: string = ''
    pathMap: string = ''
    noGather: boolean = false
    textureSet: string = ''
    rockFallStyle: any = ''
    emergeCreature: any = ''
    safeCaverns: any = ''
    seeThroughWalls: any = ''
    oListFile: any = ''
    ptlFile: any = ''
    nerpFile: any = ''
    nerpMessageFile: any = ''
    objectiveText: any = ''
    objectiveImage640x480: any = ''
    erodeTriggerTime: number = 0
    erodeErodeTime: number = 0
    erodeLockTime: number = 0
    nextLevel: any = ''
    levelLinks: any = ''
    frontEndX: number = 0
    frontEndY: number = 0
    frontEndOpen: boolean = false
    menuBMP: string[] = []

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((cfgKey) => {
            const cfgKeyname = (cfgKey.startsWith('!') ? cfgKey.substring(1) : cfgKey).toLowerCase()
            const found = Object.keys(this).some((objKey) => {
                if (objKey.toLowerCase() === cfgKeyname) {
                    this[objKey] = cfgObj[cfgKey]
                    return true
                } else if (cfgKeyname === 'priorities') {
                    // TODO implement priorities per level handling
                    return true
                } else if (cfgKeyname === 'reward') {
                    // TODO implement reward weighting per level handling
                    return true
                }
            })
            if (!found) {
                console.warn('cfg key does not exist on menu full config: ' + cfgKey)
            }
        })
    }

}
