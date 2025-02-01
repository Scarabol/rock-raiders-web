import { ByteStreamReader } from '../../core/ByteStreamReader'

export class CueFileParser {
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
        lines.forEach((line, index) => {
            if (!line.toUpperCase().startsWith('TRACK ')) return
            const indexLine = lines[index + 1]
            if (!indexLine) throw new Error(`Missing INDEX line for given TRACK ${index}`)
            result.push({
                track: this.parseTrackLine(line),
                index: this.parseIndexLine(indexLine)
            })
        })
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
