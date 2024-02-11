export class RockFallStyle {
    itemNull: string // XXX Usage unclear
    threeSides: string
    outsideCorner: string
    tunnel: string

    constructor(cfgValue: any) {
        ;[this.itemNull, this.threeSides, this.outsideCorner, this.tunnel] = cfgValue
    }
}
