import { ByteStreamReader } from '../../core/ByteStreamReader'
import { VERBOSE } from '../../params'

export interface CueFile {
    isoFile: ArrayBuffer
    audioTracks: ArrayBuffer[]
}

export class CueFileParser {
    readonly hdrParser: CueHdrFileParser

    constructor(cueFileBuffer: ArrayBuffer, readonly binFileBuffer: ArrayBuffer) {
        this.hdrParser = new CueHdrFileParser(cueFileBuffer)
    }

    async parse(): Promise<CueFile> {
        let isoFile: ArrayBuffer | undefined
        const audioTracks: ArrayBuffer[] = []
        const cueEntries = this.hdrParser.parseEntries()
        if (VERBOSE) console.log('Entries found in CUE file', cueEntries)
        const binFileBuffer = this.binFileBuffer
        for (let c = 0; c < cueEntries.length; c++) {
            const cueEntry = cueEntries[c]
            switch (cueEntry.track.type) {
                case 'MODE1': {
                    const chunkSize = cueEntry.track.bitrate
                    if (!chunkSize) throw new Error('No chunk size given for track')
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
                    isoFile = entryData.buffer
                    break
                }
                case 'AUDIO': {
                    const startOffset = cueEntries[c].index.sector * 2352
                    const endOffset = !!cueEntries[c + 1] ? cueEntries[c + 1].index.sector * 2352 : binFileBuffer.byteLength
                    const audioBuffer = this.readAudioEntry(binFileBuffer, startOffset, endOffset)
                    audioTracks.push(audioBuffer)
                    break
                }
                default:
                    throw new Error(`Unexpected cue entry track type "${cueEntry.track.type}"`)
            }
        }
        if (!isoFile) throw new Error('Invalid CUE/BIN files given; no iso image contained')
        return {isoFile: isoFile, audioTracks: audioTracks}
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

export class CueHdrFileParser {
    readonly reader: ByteStreamReader

    constructor(readonly buffer: ArrayBuffer) {
        if (buffer.byteLength > 2000) throw new Error(`Unexpected CUE file length! Got ${buffer.byteLength} expected max 2000 bytes`)
        this.reader = new ByteStreamReader(new DataView(buffer))
    }

    parseEntries(): CueEntry[] {
        const content = this.reader.readString(this.buffer.byteLength)
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => !!l)
        const binFileLine = lines.find((l) => l.toUpperCase().startsWith('FILE '))
        if (!binFileLine) throw new Error('Invalid CUE file! No line starts with "FILE " keyword')
        const binFileParts = binFileLine.split(/\s+/)
        if (binFileParts.length !== 3) throw new Error(`Unexpected FILE line given! Expected "FILE "ROCKRAIDERS.bin" BINARY" but got "${binFileLine}" instead`)
        if (binFileParts[2].toUpperCase() !== 'BINARY') throw new Error(`Unexpected BIN file mode given! Expected BINARY got ${binFileParts[2]} instead`)
        const result: CueEntry[] = []
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index]
            if (!line.toUpperCase().startsWith('TRACK ')) continue
            let indexLine = ''
            for (let c = index; c < lines.length; c++) {
                const line2 = lines[c]
                if (line2.startsWith('INDEX')) {
                    indexLine = line2
                    break
                }
            }
            if (!indexLine) throw new Error(`Missing INDEX line for given TRACK ${index}`)
            result.push({
                track: this.parseTrackLine(line),
                index: this.parseIndexLine(indexLine)
            })
        }
        result.sort((l, r) => l.track.number - r.track.number)
        return result
    }

    private parseTrackLine(line: string): CueTrack {
        if (!line.startsWith('TRACK ')) throw new Error(`Invalid TRACK line "${line}" given!`)
        const parts = line.split(/\s+/)
        if (parts.length !== 3) throw new Error(`Unexpected TRACK line "${line}" given!`)
        const typeSplit = parts[2].split('/')
        const typeUpper = typeSplit[0].toUpperCase()
        if (typeUpper !== 'MODE1' && typeUpper !== 'AUDIO') throw new Error(`Unexpected type "${typeSplit[0]}" given`)
        return {
            number: Number(parts[1]),
            type: typeUpper,
            bitrate: !!typeSplit[1] ? Number(typeSplit[1]) : undefined
        }
    }

    private parseIndexLine(line: string): CuePosition {
        if (!line.startsWith('INDEX ')) throw new Error(`Invalid INDEX line "${line}" given!`)
        const parts = line.split(/\s+/)
        if (parts.length !== 3) throw new Error(`Unexpected INDEX line "${line}" given!`)
        const posSplit = parts[2].split(':')
        return {
            // TODO Is it safe to ignore INDEX 00 aka pregap?
            minute: Number(posSplit[0]),
            second: Number(posSplit[1]),
            frame: Number(posSplit[2]),
            sector: Number(posSplit[0]) * 60 * 75 + Number(posSplit[1]) * 75 + Number(posSplit[2]), // 75 frames per second of audio
        }
    }
}

export interface CueEntry {
    track: CueTrack
    index: CuePosition
}

export interface CueTrack {
    number: number
    type: 'MODE1' | 'AUDIO'
    bitrate?: number
}

export interface CuePosition {
    minute: number
    second: number
    frame: number
    sector: number
}
