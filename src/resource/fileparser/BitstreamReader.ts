export class BitstreamReader {
    cache: number
    bitsRemaining: number

    constructor(
        readonly dataView: DataView,
        public offset: number,
        readonly dataEndBytes: number
    ) {
        this.cache = 0
        this.bitsRemaining = 0
    }

    readBits(numBits: number): number {
        let retVal = 0
        let bitsCounter = 0
        while (numBits > 0) {
            if (numBits > this.bitsRemaining) {
                this.cache |= this.dataView.getUint8(this.offset) << this.bitsRemaining
                this.offset++
                this.bitsRemaining += 8
            }
            let readBits = 0
            if (numBits > 8) {
                readBits = 8
                numBits -= 8
            } else {
                readBits = numBits
                numBits = 0
            }
            retVal |= (this.cache & (1 << readBits) - 1) << bitsCounter
            this.cache = this.cache >> readBits
            this.bitsRemaining -= readBits
            bitsCounter += readBits
        }
        return retVal
    }

    alignToNextByteBoundary() {
        this.cache = 0
        this.bitsRemaining = 0
    }
}
