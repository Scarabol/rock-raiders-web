declare global {
    interface String {
        equalsIgnoreCase(other: string): boolean
    }

    interface Number {
        toPadded(): string
    }

    interface Math {
        randomInclusive(minimum: number, maximum?: number): number

        randomSign(): number
    }
}

String.prototype.equalsIgnoreCase = function (other: string): boolean {
    return this.toLowerCase() === other?.toLowerCase()
}

Number.prototype.toPadded = function (): string {
    return `00${this.toString()}`.slice(-2)
}

Math.randomInclusive = function (minimum: number, maximum: number): number {
    if (maximum === undefined) {
        maximum = minimum
        minimum = 0
    }
    return Math.floor(Math.random() * (maximum - minimum + 1) + minimum)
}

Math.randomSign = function (): number {
    return Math.random() < 0.5 ? -1 : 1
}

export {}
