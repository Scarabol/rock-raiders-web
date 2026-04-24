export class VirtualFile {
    static readonly textDecoder = new TextDecoder('utf-16le')
    readonly lFileName: string
    private buffer?: ArrayBuffer
    private text?: string

    private constructor(fileName: string, private view: DataView<ArrayBuffer>) {
        this.lFileName = fileName.toLowerCase()
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
        this.text = VirtualFile.textDecoder.decode(new Uint16Array(this.toArray())) // Inner array needed for byte alignment - still fast
        return this.text
    }
}
