import { AbstractFormFilesComponent } from './AbstractFormFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'
import { CueFileParser } from '../fileparser/CueFileParser'
import { IsoFileParser } from '../fileparser/IsoFileParser'
import { cachePutData } from '../AssetCacheHelper'
import { VERBOSE } from '../../params'

export class CueBinFilesComponent extends AbstractFormFilesComponent {
    constructor() {
        super({
            labelHTML: 'Use local CUE/BIN files, usually seen as CD image <b>(recommended, all features)</b>:',
            btnText: 'Start with CUE/BIN files',
            fileNames: ['Rock Raiders.cue', 'Rock Raiders.bin'],
        })
    }

    protected async onFilesSelected(vfs: VirtualFileSystem, files: File[]): Promise<void> {
        if (files.length !== 2) throw new Error(`Unexpected number of files (${files.length}) given`)
        const cueFileBuffer = await files[0].arrayBuffer()
        const binFileBuffer = await files[1].arrayBuffer()
        const cueFile = new CueFileParser(cueFileBuffer)
        const cueEntries = cueFile.parseEntries()
        if (VERBOSE) console.log('Entries found in CUE file', cueEntries)
        for (let c = 0; c < cueEntries.length; c++) {
            const cueEntry = cueEntries[c]
            switch (cueEntry.track.type) {
                case 'MODE1': {
                    const chunkSize = cueEntry.track.bitrate
                    if (chunkSize !== 2352) console.warn(`Expected bitrate 2352 but got (${chunkSize}) instead`)
                    const startSector = cueEntry.index.sector
                    const startOffset = (16 + startSector) * chunkSize + 16
                    const endSector = cueEntries[1].index.sector // TODO What if last entry?
                    const endOffset = (16 + endSector - 1) * chunkSize + 16 - 64 * 1024
                    const entryLength = (endSector - startSector) * 2048
                    const entryData = new Uint8Array(entryLength)
                    console.log(`Reading ISO with chunk size ${cueEntry.track.bitrate} from start offset ${startOffset} sector ${startSector} to end offset ${endOffset} sector ${endSector} and final iso length ${entryLength}`)
                    let writeOffset = 32 * 1024
                    for (let c = startOffset; c < endOffset; c += chunkSize) {
                        const isoBuffer = binFileBuffer.slice(c, c + 2048)
                        entryData.set(new Uint8Array(isoBuffer), writeOffset)
                        writeOffset += 2048
                    }
                    // Parse files from ISO image
                    const isoFile = new IsoFileParser(entryData.buffer)
                    const allFiles = await isoFile.loadAllFiles()
                    await Promise.all(allFiles.map(async (f) => {
                        if (f.fileName.equalsIgnoreCase('data1.hdr') || f.fileName.equalsIgnoreCase('data1.cab')) return // only cache unpacked files
                        await cachePutData(f.fileName.toLowerCase(), f.toBuffer())
                        vfs.registerFile(f)
                    }))
                    break
                }
                case 'AUDIO': {
                    const startOffset = cueEntries[c].index.sector * 2352
                    const endOffset = !!cueEntries[c + 1] ? cueEntries[c + 1].index.sector * 2352 : binFileBuffer.byteLength
                    const audioBuffer = this.readAudioEntry(binFileBuffer, startOffset, endOffset)
                    await cachePutData(`musictrack${c}`, audioBuffer)
                    break
                }
                default:
                    throw new Error(`Unexpected cue entry track type "${cueEntry.track.type}"`)
            }
        }
    }

    private readAudioEntry(binFileBuffer: ArrayBuffer, startOffset: number, endOffset: number): ArrayBuffer {
        const headerLen = 44
        const entryDataLength = endOffset - startOffset
        const trackArr = new Uint8Array(headerLen + entryDataLength)
        const trackView = new DataView(trackArr.buffer)
        // Write WAV header at start of buffer
        const encoder = new TextEncoder()
        trackArr.set(encoder.encode('RIFF')) // RIFF header
        trackView.setUint32(4, entryDataLength + 8 + 24 + 4, true) // length of file, starting from WAVE
        trackArr.set(encoder.encode('WAVE'), 8)
        trackArr.set(encoder.encode('fmt '), 12) // FORMAT header
        trackView.setUint32(16, 16, true) // length of FORMAT header
        trackView.setUint16(20, 1, true) // constant
        trackView.setUint16(22, 2, true) // channels
        trackView.setUint32(24, 44100, true) // sample rate
        trackView.setUint32(28, 44100 * 4, true) // bytes per second
        trackView.setUint16(32, 4, true) // bytes per sample
        trackView.setUint16(34, 16, true) // bits per channel
        trackArr.set(encoder.encode('data'), 36) // DATA header
        trackView.setUint32(40, entryDataLength, true)
        for (let offset = startOffset; offset < endOffset; offset += 2352) {
            const read = binFileBuffer.slice(offset, offset + 2352)
            trackArr.set(new Uint8Array(read), headerLen + offset - startOffset)
        }
        return trackArr.buffer
    }
}
