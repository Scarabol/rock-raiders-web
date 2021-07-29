export class ConfigColor {
    r: number
    g: number
    b: number

    constructor(values: number[]) {
        [this.r, this.g, this.b] = values
    }
}
