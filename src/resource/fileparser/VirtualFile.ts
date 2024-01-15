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

    toText(): string {
        if (this.text !== undefined && this.text !== null) return this.text
        this.text = '' // otherwise text starts with 'undefined'
        this.toArray().forEach((c) => this.text += String.fromCharCode(encodeChar[c]))
        return this.text
    }
}
