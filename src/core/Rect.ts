export class Rect {
    x: number = 0
    y: number = 0
    w: number = 0
    h: number = 0

    constructor(arr: number[]) {
        [this.x, this.y, this.w, this.h] = arr
    }
}
