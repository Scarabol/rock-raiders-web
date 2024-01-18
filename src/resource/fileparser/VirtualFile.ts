import { encodeChar } from './EncodingHelper'

export class VirtualFile {
    text: string

    constructor(readonly fileName: string, readonly buffer: ArrayBuffer) {
        if (!fileName) throw new Error('No filename given')
        if (!buffer) throw new Error('No buffer given')
        else if (buffer.byteLength < 1) throw new Error(`Invalid buffer given with length of ${buffer.byteLength} bytes`)
    }

    toArray(): Uint8Array {
        return new Uint8Array(this.buffer)
    }

    toDataView(): DataView {
        return new DataView(this.buffer)
    }

    toText(decode: boolean = false): string {
        if (this.text !== undefined && this.text !== null) return this.text
        this.text = '' // otherwise text starts with 'undefined'
        this.toArray().forEach((c) => {
            const decoded = decode ? encodeChar[c] : c
            return this.text += String.fromCharCode(decoded)
        })
        return this.text
    }
}
