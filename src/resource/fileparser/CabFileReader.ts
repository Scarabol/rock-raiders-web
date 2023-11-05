export class CabFileReader {
    readonly dataView: DataView
    offset: number = 0

    constructor(buffer: ArrayBuffer) {
        this.dataView = new DataView(buffer)
    }

    seek(offset: number): void {
        this.offset = offset
    }

    skip(length: number): void {
        this.offset += length
    }

    readUint8(): number {
        const value = this.dataView.getUint8(this.offset)
        this.offset += 1
        return value
    }

    readUint16(): number {
        const value = this.dataView.getUint16(this.offset, true)
        this.offset += 2
        return value
    }

    readUint32(): number {
        const value = this.dataView.getUint32(this.offset, true)
        this.offset += 4
        return value
    }

    readString(): string {
        const charCodes: number[] = []
        let char: number = 0
        do {
            char = this.readUint8()
            if (char !== 0) charCodes.push(char)
        } while (char !== 0)
        return new TextDecoder().decode(new Uint8Array(charCodes))
    }

    readBuffer(bufferLength: number): ArrayBuffer {
        const result = this.dataView.buffer.slice(this.offset, this.offset + bufferLength)
        this.offset += bufferLength
        return result
    }
}
