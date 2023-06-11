import { encodeChar } from './parser/EncodingHelper'

export interface WadData {
    buffer: Int8Array
    entryIndexByName: Map<string, number>
    fLength: number[]
    fStart: number[]
}

/**
 * Handles the extraction of single files from a bigger WAD data blob
 */
export class WadFile implements WadData {
    buffer: Int8Array = null
    entryIndexByName: Map<string, number> = new Map()
    fLength: number[] = []
    fStart: number[] = []

    /**
     * Validate and parse the given data object as binary blob of a WAD file
     * @param data binary blob
     * @param debug enable/disable debug output while parsing
     */
    static parseWadFile(data: ArrayBufferLike, debug = false): WadFile {
        const result = new WadFile()
        const dataView = new DataView(data)
        result.buffer = new Int8Array(data)
        let pos = 0
        if (String.fromCharCode.apply(null, result.buffer.slice(pos, 4)) !== 'WWAD') {
            throw new Error('Invalid WAD0 file provided')
        }
        if (debug) {
            console.log('WAD0 file seems legit')
        }
        pos = 4
        const numberOfEntries = dataView.getInt32(pos, true)
        if (debug) {
            console.log(numberOfEntries)
        }
        pos = 8

        let bufferStart = pos
        for (let i = 0; i < numberOfEntries; pos++) {
            if (result.buffer[pos] === 0) {
                result.entryIndexByName.set(String.fromCharCode.apply(null, result.buffer.slice(bufferStart, pos)).replace(/\\/g, '/').toLowerCase(), i)
                bufferStart = pos + 1
                i++
            }
        }

        if (debug) {
            console.log(result.entryIndexByName)
        }

        for (let i = 0; i < numberOfEntries; pos++) {
            if (result.buffer[pos] === 0) {
                bufferStart = pos + 1
                i++
            }
        }

        if (debug) {
            console.log(`Offset after absolute original names is ${pos}`)
        }

        for (let i = 0; i < numberOfEntries; i++) {
            result.fLength[i] = dataView.getInt32(pos + 8, true)
            result.fStart[i] = dataView.getInt32(pos + 12, true)
            pos += 16
        }

        if (debug) {
            console.log(result.fLength)
            console.log(result.fStart)
        }
        return result
    }

    /**
     * Returns the entries content extracted by name from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {Uint8Array} Returns the content as Uint8Array
     */
    getEntryData(entryName: string): Uint8Array {
        return new Uint8Array(this.getEntryBuffer(entryName))
    }

    /**
     * Returns the entries content as text extracted by name from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {string} Returns the content as String
     */
    getEntryText(entryName: string): string {
        let result = ''
        this.getEntryData(entryName).forEach((c) => result += String.fromCharCode(encodeChar[c]))
        return result
    }

    /**
     * Returns the entries content by name extracted from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {ArrayBufferLike} Returns the content as buffer slice
     */
    getEntryBuffer(entryName: string): ArrayBufferLike {
        const index = this.entryIndexByName.get(entryName.toLowerCase())
        if (index === undefined || index === null) {
            throw new Error(`Entry '${entryName}' not found in WAD file`)
        }
        return this.buffer.slice(this.fStart[index], this.fStart[index] + this.fLength[index]).buffer
    }

    filterEntryNames(regexStr: string) {
        const regex = new RegExp(regexStr.toLowerCase())
        const result: string[] = []
        this.entryIndexByName.forEach((index, entry) => {
            if (entry.match(regex)) result.push(entry)
        })
        return result
    }

    hasEntry(entryName: string): boolean {
        const index = this.entryIndexByName.get(entryName.toLowerCase())
        return index !== undefined && index !== null
    }
}
