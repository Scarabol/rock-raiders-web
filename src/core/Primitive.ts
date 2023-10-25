declare global {
    interface String {
        equalsIgnoreCase(other: string): boolean

        hashCode(): number
    }

    interface Number {
        toPadded(): string
    }

    interface Math {
        randomInclusive(minimum: number, maximum?: number): number

        randomSign(): number

        interpolate(y0: number, y1: number, x: number): number
    }
}

String.prototype.equalsIgnoreCase = function (other: string): boolean {
    return this.toLowerCase() === other?.toLowerCase()
}

String.prototype.hashCode = function () { // Inspired by https://stackoverflow.com/a/7616484
    let hash = 0,
        i, chr
    if (this.length === 0) return hash
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i)
        hash = ((hash << 5) - hash) + chr
        hash |= 0 // Convert to 32bit integer
    }
    return hash
}

Number.prototype.toPadded = function (): string {
    return `00${this.toString()}`.slice(-2)
}

Math.randomInclusive = (minimum: number, maximum: number): number => {
    if (maximum === undefined) {
        maximum = minimum
        minimum = 0
    }
    return Math.floor(Math.random() * (maximum - minimum + 1) + minimum)
}

Math.randomSign = (): number => Math.random() < 0.5 ? -1 : 1

Math.interpolate = (y0: number, y1: number, x: number): number => y0 + x * (y1 - y0)

export {}
