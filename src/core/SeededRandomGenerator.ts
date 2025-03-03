// Inspired by https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316

/**
 * Simple hash function to properly seed pseudo-random-number-generator from any user input
 */
function cyrb128(seed: string): number[] {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762
    for (let i = 0, k: number; i < seed.length; i++) {
        k = seed.charCodeAt(i)
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
    // noinspection CommaExpressionJS
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
}

/**
 * pseudo-random-number-generator
 */
function sfc32(a: number, b: number, c: number, d: number): () => number {
    return function () {
        a |= 0
        b |= 0
        c |= 0
        d |= 0
        let t = (a + b | 0) + d | 0
        d = d + 1 | 0
        a = b ^ b >>> 9
        b = c + (c << 3) | 0
        c = (c << 21 | c >>> 11)
        c = c + t | 0
        return (t >>> 0) / 4294967296
    }
}

export class SeededRandomGenerator {
    private rand?: () => number

    setSeed(seed: string): this {
        if (!seed) throw new Error('Invalid seed given')
        const hashed = cyrb128(seed)
        this.rand = sfc32(hashed[0], hashed[1], hashed[2], hashed[3])
        return this
    }

    random(): number {
        if (!this.rand) throw new Error('Not yet initialized')
        return this.rand()
    }

    randInt(maximum: number): number {
        return Math.floor(this.random() * maximum)
    }

    shuffle<T>(array: T[] | undefined): T[] {
        if (!Array.isArray(array)) throw new Error(`Not an array but "${array}"`)
        let currentIndex = array.length
        while (currentIndex > 0) {
            const randomIndex = this.randInt(currentIndex)
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
        }
        return array
    }

    sample<T>(array: [T, ...T[]]): T;
    sample<T>(array: T[]): T | undefined;
    sample<T>(array: [T, ...T[]] | T[]): T | undefined {
        if (!Array.isArray(array) || array.length < 1) return undefined
        return array[this.randInt(array.length)]
    }
}
