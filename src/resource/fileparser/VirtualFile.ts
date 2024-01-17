import { encodeChar } from './EncodingHelper'

export class VirtualFile {
    text: string

    constructor(readonly buffer: ArrayBuffer) {
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
