import { encodeChar } from './EncodingHelper'

export class WadFile {
    readonly entryByLowerName: Map<string, Uint8Array> = new Map()

    static parseWadFile(data: ArrayBufferLike, debug = false): WadFile {
        const result = new WadFile()
        const dataView = new DataView(data)
        const textDecoder = new TextDecoder()
        if (textDecoder.decode(new Uint8Array(data, 0, 4)) !== 'WWAD') {
            throw new Error('Invalid WAD file provided')
        }
        if (debug) {
            console.log('WAD file seems legit')
        }
        const numberOfEntries = dataView.getInt32(4, true)
        if (debug) {
            console.log(numberOfEntries)
        }

        const lEntryNames: string[] = []
        let pos = 8
        let bufferStart = pos
        for (let entryIndex = 0; entryIndex < numberOfEntries; pos++) {
            if (dataView.getUint8(pos) !== 0) continue
            const len = pos - bufferStart
            const array = new Uint8Array(data, bufferStart, len)
            lEntryNames[entryIndex] = textDecoder.decode(array).replace(/\\/g, '/').toLowerCase()
            bufferStart = pos + 1
            entryIndex++
        }

        if (debug) {
            console.log(lEntryNames)
        }

        for (let entryIndex = 0; entryIndex < numberOfEntries; pos++) {
            if (dataView.getUint8(pos) !== 0) continue
            entryIndex++
        }

        if (debug) {
            console.log(`Offset after absolute original names is ${pos}`)
        }

        for (let entryIndex = 0; entryIndex < numberOfEntries; entryIndex++) {
            const fileLength = dataView.getInt32(pos + 8, true)
            const fileStartOffset = dataView.getInt32(pos + 12, true)
            const buffer = data.slice(fileStartOffset, fileStartOffset + fileLength)
            result.entryByLowerName.set(lEntryNames[entryIndex], new Uint8Array(buffer, 0, fileLength))
            pos += 16
        }

        if (debug) {
            console.log(result.entryByLowerName)
        }
        return result
    }

    getEntryArrayView(entryName: string): Uint8Array {
        const view = this.entryByLowerName.get(entryName.toLowerCase())
        if (view === undefined || view === null) {
            throw new Error(`Entry '${entryName}' not found in WAD file`)
        }
        return view
    }

    getEntryDataView(entryName: string): DataView {
        const view = this.getEntryArrayView(entryName)
        return new DataView(view.buffer, view.byteOffset, view.byteLength)
    }

    getEntryText(entryName: string): string {
        let result = ''
        this.getEntryArrayView(entryName).forEach((c) => result += String.fromCharCode(encodeChar[c]))
        return result
    }

    getEntryBuffer(entryName: string): ArrayBuffer {
        const view = this.entryByLowerName.get(entryName.toLowerCase())
        if (view === undefined || view === null) {
            throw new Error(`Entry '${entryName}' not found in WAD file`)
        }
        return view.buffer
    }

    filterEntryNames(regexStr: string) {
        const regex = new RegExp(regexStr.toLowerCase())
        const result: string[] = []
        this.entryByLowerName.forEach((_, entry) => {
            if (entry.match(regex)) result.push(entry)
        })
        return result
    }

    hasEntry(entryName: string): boolean {
        return this.entryByLowerName.has(entryName.toLowerCase())
    }
}
