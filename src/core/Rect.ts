export class Rect {
    constructor(
        public x: number = 0,
        public y: number = 0,
        public w: number = 0,
        public h: number = 0,
    ) {
    }

    public static fromArray(arr: number[]) {
        if (arr.length !== 4) throw new Error(`Invalid number of args (${arr}) given for rect`)
        if (arr.some((n) => isNaN(n))) throw new Error(`Invalid arg (${arr}) given for rect`)
        return new Rect(...arr)
    }
}
