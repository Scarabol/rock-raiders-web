export class ByteStreamReader {
    littleEndian: boolean = true
    offset: number = 0

    constructor(
        readonly dataView: DataView,
    ) {
    }

    hasMoreData(): boolean {
        return this.offset < this.dataView.byteLength
    }

    seek(offset: number): void {
        if (offset < 0 || offset >= this.dataView.byteLength) throw new Error(`Invalid offset (${offset}) given`)
        this.offset = offset
    }

    skip(numBytes: number): void {
        this.offset += numBytes
    }

    readString(byteLength: number): string {
        const chars: number[] = []
        for (let c = 0; c < byteLength; c++) {
            chars.push(this.dataView.getUint8(this.offset))
            this.offset++
        }
        return String.fromCharCode.apply(null, chars)
    }

    readStringNull(): string {
        const charCodes: number[] = []
        let char: number = 0
        do {
            char = this.read8()
            if (char !== 0) charCodes.push(char)
        } while (char !== 0)
        return String.fromCharCode.apply(null, charCodes)
    }

    read8(): number {
        if (this.offset + 1 > this.dataView.byteLength) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint8(this.offset)
        this.offset += 1
        return data
    }

    read8Signed(): number {
        if (this.offset + 1 > this.dataView.byteLength) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt8(this.offset)
        this.offset += 1
        return data
    }

    read16Signed(): number {
        if (this.offset + 2 > this.dataView.byteLength) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt16(this.offset, this.littleEndian)
        this.offset += 2
        return data
    }

    read16(): number {
        if (this.offset + 2 > this.dataView.byteLength) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint16(this.offset, this.littleEndian)
        this.offset += 2
        return data
    }

    read32Signed(): number {
        if (this.offset + 4 > this.dataView.byteLength) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt32(this.offset, this.littleEndian)
        this.offset += 4
        return data
    }

    read32(): number {
        if (this.offset + 4 > this.dataView.byteLength) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint32(this.offset, this.littleEndian)
        this.offset += 4
        return data
    }

    readBytes(numOfBytes: number): Uint8Array {
        const result = new Uint8Array(this.dataView.buffer, this.offset, numOfBytes)
        this.offset += numOfBytes
        return result
    }
}
