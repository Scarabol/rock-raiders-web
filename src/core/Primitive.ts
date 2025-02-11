declare global {
    interface String {
        equalsIgnoreCase(other?: string): boolean

        hashCode(): number
    }

    interface Math {
        randomInclusive(minimum: number, maximum?: number): number

        randomSign(): number
    }
}

String.prototype.equalsIgnoreCase = function (other?: string): boolean {
    return this.toLowerCase() === other?.toLowerCase()
}

String.prototype.hashCode = function () { // Inspired by https://stackoverflow.com/a/7616484
    let hash: number = 0
    if (this.length === 0) return hash
    for (let i = 0; i < this.length; i++) {
        const chr = this.charCodeAt(i)
        hash = ((hash << 5) - hash) + chr
        hash |= 0 // Convert to 32bit integer
    }
    return hash
}

Math.randomInclusive = (minimum: number, maximum: number): number => {
    if (maximum === undefined) {
        maximum = minimum
        minimum = 0
    }
    return Math.floor(Math.random() * (maximum - minimum + 1) + minimum)
}

Math.randomSign = (): number => Math.random() < 0.5 ? -1 : 1

export {}
