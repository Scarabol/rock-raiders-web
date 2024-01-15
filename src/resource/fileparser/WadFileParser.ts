import { VirtualFile } from './VirtualFile'
import { VirtualFileSystem } from './VirtualFileSystem'

export class WadFileParser {
    static parse(vfs: VirtualFileSystem, data: ArrayBufferLike) {
        const dataView = new DataView(data)
        const textDecoder = new TextDecoder()
        if (textDecoder.decode(new Uint8Array(data, 0, 4)) !== 'WWAD') {
            throw new Error('Invalid WAD file provided')
        }
        const numberOfEntries = dataView.getInt32(4, true)
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
        for (let entryIndex = 0; entryIndex < numberOfEntries; pos++) {
            if (dataView.getUint8(pos) !== 0) continue
            entryIndex++
        }
        for (let entryIndex = 0; entryIndex < numberOfEntries; entryIndex++) {
            const fileLength = dataView.getInt32(pos + 8, true)
            const fileStartOffset = dataView.getInt32(pos + 12, true)
            const buffer = data.slice(fileStartOffset, fileStartOffset + fileLength)
            vfs.registerFile(lEntryNames[entryIndex], new VirtualFile(buffer))
            pos += 16
        }
    }
}
