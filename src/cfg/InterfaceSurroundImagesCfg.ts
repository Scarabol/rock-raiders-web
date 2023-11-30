interface InterfaceSurroundImagesEntryCfg {
    readonly imgName: string
    readonly val1: number // XXX clarify usage
    readonly val2: number // XXX clarify usage
    readonly val3: number // XXX clarify usage
    readonly val4: number // XXX clarify usage
    readonly imgNameWoBackName: string
    readonly woBack1: number // XXX clarify usage
    readonly woBack2: number // XXX clarify usage
}

export class InterfaceSurroundImagesCfg {
    readonly cfgByNumItems: InterfaceSurroundImagesEntryCfg[] = []

    constructor(cfgValue: Record<number, [string, number, number, number, number, string, number, number]>) {
        Object.entries(cfgValue).forEach(([num, cfg]) => {
            const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = cfg
            this.cfgByNumItems[num] = {imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2}
        })
    }
}
