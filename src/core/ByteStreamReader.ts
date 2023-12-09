export class ByteStreamReader {
    constructor(
        readonly dataView: DataView,
        public offset: number,
        readonly dataEnd: number,
    ) {
    }

    hasMoreData(): boolean {
        return this.offset < this.dataEnd
    }

    readString(length: number): string {
        const chars = []
        for (let c = 0; c < length; c++) {
            chars.push(this.dataView.getUint8(this.offset))
            this.offset++
        }
        return String.fromCharCode.apply(null, chars)
    }

    read8(): number {
        if (this.offset + 1 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint8(this.offset)
        this.offset += 1
        return data
    }

    read8Signed(): number {
        if (this.offset + 1 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt8(this.offset)
        this.offset += 1
        return data
    }

    read16Signed(): number {
        if (this.offset + 2 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt16(this.offset, true)
        this.offset += 2
        return data
    }

    read16(): number {
        if (this.offset + 2 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint16(this.offset, true)
        this.offset += 2
        return data
    }

    read32Signed(): number {
        if (this.offset + 4 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt32(this.offset, true)
        this.offset += 4
        return data
    }

    read32(): number {
        if (this.offset + 4 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint32(this.offset, true)
        this.offset += 4
        return data
    }
}
