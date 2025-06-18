export class VirtualFile {
    private buffer?: ArrayBuffer
    private text?: string

    private constructor(readonly fileName: string, private view: DataView<ArrayBuffer>) {
    }

    static fromView(fileName: string, view: DataView<ArrayBuffer>): VirtualFile {
        this.assertArgs(fileName, view)
        return new VirtualFile(fileName, view)
    }

    static fromBuffer(fileName: string, buffer: ArrayBuffer): VirtualFile {
        this.assertArgs(fileName, buffer)
        const f = new VirtualFile(fileName, new DataView(buffer))
        f.buffer = buffer
        return f
    }

    private static assertArgs(fileName: string, view: DataView | ArrayBuffer) {
        if (!fileName) throw new Error('No filename given')
        if (!view) throw new Error(`No data given for"${fileName}"`)
    }

    /**
     * This method actually clones the memory buffer and should be considered 'pricey' in terms of performance
     */
    toBuffer(): ArrayBuffer {
        if (!this.buffer) this.buffer = this.view.buffer.slice(this.view.byteOffset, this.view.byteOffset + this.view.byteLength)
        return this.buffer
    }

    toArray(): Uint8Array {
        return new Uint8Array(this.view.buffer, this.view.byteOffset, this.view.byteLength)
    }

    toDataView(): DataView<ArrayBuffer> {
        return new DataView(this.view.buffer, this.view.byteOffset, this.view.byteLength)
    }

    toText(): string {
        if (this.text !== undefined && this.text !== null) return this.text
        this.text = '' // otherwise text starts with 'undefined'
        this.toArray().forEach((c) => this.text += String.fromCharCode(c)) // Shorthand with spread operator (...) exceeds call stack size
        return this.text
    }
}
