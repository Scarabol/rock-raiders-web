export class Rect {
    constructor(
        public x: number = 0,
        public y: number = 0,
        public w: number = 0,
        public h: number = 0,
    ) {
    }

    public static fromArray(arr: number[]) {
        return new Rect(...arr)
    }
}
