import { MSVCDecoder } from './MSVCDecoder'
import { ADPCMAudioDecoder } from './ADPCMAudioDecoder'

export interface AVIStreamHeader {
    fccType: string;
    flags: number;
    start: number;
    length: number;
    suggestedBufferSize: number;
    scale: number;
    language: number;
    priority: number;
    sampleSize: number;
    quality: number;
    rate: number;
    fccHandler: string;
    initialFrames: number;
    frame: { top: number; left: number; bottom: number; right: number }
}

export interface AVIVideoFormat {
    biHeight: number;
    biSize: number;
    biSizeImage: number;
    biWidth: number;
    biCompression: number;
    biClrUsed: number;
    biClrImportant: number;
    biBitCount: number;
    biXPelsPerMeter: number;
    biPlanes: number;
    biYPelsPerMeter: number
}

export interface AVIAudioFormat {
    wFormatTag: number;
    nChannels: number;
    nSamplesPerSec: number;
    nAvgBytesPerSec: number;
    nBlockAlign: number;
    wBitsPerSample: number;
    cbSize: number;
}

export interface RRWVideoDecoder {
    initialize(chunks: AVIReader[], videoFormat: AVIVideoFormat): void

    getNextFrame(): ImageData
}

export interface RRWAudioDecoder {
    initialize(chunks: AVIReader[], audioFormat: AVIAudioFormat): void
}

export class AVIParser {

    static readonly WAVE_FORMAT_ADPCM = 0x2

    parse(buffer: ArrayBuffer): { videoDecoder: RRWVideoDecoder, audioDecoder: RRWAudioDecoder } {
        const aviReader = new AVIReader(new DataView(buffer), 0, buffer.byteLength)
        const magic = aviReader.readFourCC()
        if (magic !== 'RIFF') throw new Error(`Unexpected magic in AVI header; got ${magic} instead of "RIFF"`)
        aviReader.read32() // fileLength not needed
        const fileType = aviReader.readFourCC()
        if (fileType !== 'AVI ') throw new Error(`Unexpected file type; got ${fileType} instead of "AVI "`)
        const headerList = aviReader.readList()
        const aviHeaderItem = headerList.getNextListItem() as AVIChunk
        this.parseAVIHeader(aviHeaderItem.chunkReader) // aviHeader not needed

        let firstVideoFormat: AVIVideoFormat
        let firstVideoStreamHeader: AVIStreamHeader
        let firstVideoStreamIndex: number = -1
        let firstAudioFormat: AVIAudioFormat
        let firstAudioStreamHeader: AVIStreamHeader
        let firstAudioStreamIndex: number = -1
        let firstAudioChunkReader: AVIReader
        let streamIndex = 0
        while (headerList.hasMoreItems()) {
            const streamList = headerList.getNextListItem() as AVIList
            const item = streamList.getNextListItem() as AVIChunk
            const streamHeader = this.parseStreamHeader(item.chunkReader)
            const streamFormat = streamList.getNextListItem() as AVIChunk
            switch (streamHeader.fccType) {
                case 'vids':
                    if (!firstVideoFormat) {
                        firstVideoFormat = this.parseVideoFormat(streamFormat.chunkReader)
                        firstVideoStreamHeader = streamHeader
                        firstVideoStreamIndex = streamIndex
                    }
                    break
                case 'auds':
                    if (!firstAudioFormat) {
                        firstAudioFormat = this.parseAudioFormat(streamFormat.chunkReader)
                        firstAudioStreamHeader = streamHeader
                        firstAudioStreamIndex = streamIndex
                        firstAudioChunkReader = streamFormat.chunkReader
                    }
                    break
                default:
                    console.warn(`Unsupported stream fcc type ${streamHeader.fccType}`)
                    break
            }
            streamIndex++
            videoFormat = this.parseStreamFormat(streamHeader, streamFormat.chunkReader)
            if (videoFormat) break
            streamIndex++
        }
        if (!videoFormat) throw new Error('No video format found')
        let decoder: RRWVideoDecoder
        switch (streamHeader.fccHandler) {
            case 'MSVC':
            case 'CRAM':
            case 'WHAM':
                decoder = new MSVCDecoder()
                break
            default:
                throw new Error(`Unhandled video codec ${streamHeader.fccHandler}`)
        }

        const moviList = aviReader.readList()
        if (moviList.listType !== 'movi') throw new Error(`Unexpected list type; got ${moviList.listType} instead of movi`)
        const paddedVideoStreamIndex = firstVideoStreamIndex.toPadded()
        const paddedAudioStreamIndex = firstAudioStreamIndex.toPadded()
        const videoChunks: AVIReader[] = []
        const audioChunks: AVIReader[] = []
        while (moviList.hasMoreItems()) {
            const item = moviList.getNextListItem() as AVIChunk
            if (item.chunkType === `${paddedVideoStreamIndex}dc`) {
                videoChunks.push(item.chunkReader)
            } else if (item.chunkType === `${paddedAudioStreamIndex}wb`) {
                audioChunks.push(item.chunkReader)
            } else {
                console.warn(`Unhandled stream data ${item.chunkType}`)
            }
        }

        let videoDecoder: RRWVideoDecoder
        if (firstVideoFormat) {
            switch (firstVideoStreamHeader.fccHandler) {
                case 'MSVC':
                case 'CRAM':
                case 'WHAM':
                    videoDecoder = new MSVCDecoder()
                    break
                case 'IV50':
                    videoDecoder = new Indeo5Decoder()
                    break
                default:
                    throw new Error(`Unhandled video codec ${firstAudioStreamHeader.fccHandler}`)
            }
            videoDecoder.initialize(videoChunks, firstVideoFormat)
        }

        let audioDecoder: RRWAudioDecoder
        if (firstAudioFormat) {
            switch (firstAudioFormat.wFormatTag) {
                case AVIParser.WAVE_FORMAT_ADPCM:
                    audioDecoder = new ADPCMAudioDecoder(firstAudioChunkReader)
                    break
                default:
                    throw new Error(`Unhandled audio codec ${firstAudioFormat.wFormatTag}`)
            }
            audioDecoder.initialize(audioChunks, firstAudioFormat)
        }
        return {videoDecoder, audioDecoder}
    }

    parseAVIHeader(aviReader: AVIReader) {
        return {
            microSecPerFrame: aviReader.read32(),
            maxBytesPerSec: aviReader.read32(),
            paddingGranularity: aviReader.read32(),
            flags: aviReader.read32(),
            totalFrames: aviReader.read32(),
            initialFrames: aviReader.read32(),
            streams: aviReader.read32(),
            suggestedBufferSize: aviReader.read32(),
            width: aviReader.read32(),
            height: aviReader.read32(),
            // reserved 16 bytes ignored
        }
    }

    parseStreamHeader(aviReader: AVIReader) {
        return {
            fccType: aviReader.readFourCC(),
            fccHandler: aviReader.readFourCC(),
            flags: aviReader.read32(),
            priority: aviReader.read16(),
            language: aviReader.read16(),
            initialFrames: aviReader.read32(),
            scale: aviReader.read32(),
            rate: aviReader.read32(),
            start: aviReader.read32(),
            length: aviReader.read32(),
            suggestedBufferSize: aviReader.read32(),
            quality: aviReader.read32(),
            sampleSize: aviReader.read32(),
            frame: {
                left: aviReader.read16Signed(),
                top: aviReader.read16Signed(),
                right: aviReader.read16Signed(),
                bottom: aviReader.read16Signed()
            },
        }
    }

    parseVideoFormat(aviReader: AVIReader): AVIVideoFormat {
        const videoFormat = {
            biSize: aviReader.read32(),
            biWidth: aviReader.read32Signed(),
            biHeight: aviReader.read32Signed(),
            biPlanes: aviReader.read16(),
            biBitCount: aviReader.read16(),
            biCompression: aviReader.read32(),
            biSizeImage: aviReader.read32(),
            biXPelsPerMeter: aviReader.read32Signed(),
            biYPelsPerMeter: aviReader.read32Signed(),
            biClrUsed: aviReader.read32(),
            biClrImportant: aviReader.read32(),
        }
        if (aviReader.hasMoreData()) {
            console.warn('Reading bitmap palette is not yet implemented')
        }
        return videoFormat
    }

    parseAudioFormat(aviReader: AVIReader): AVIAudioFormat {
        return {
            wFormatTag: aviReader.read16(),
            nChannels: aviReader.read16(),
            nSamplesPerSec: aviReader.read32(),
            nAvgBytesPerSec: aviReader.read32(),
            nBlockAlign: aviReader.read16(),
            wBitsPerSample: aviReader.read16(),
            cbSize: aviReader.read16(),
            // TODO read cbSize here and pass to reader?
        }
    }
}

export class AVIReader {
    readonly littleEndian: boolean = true

    constructor(
        readonly dataView: DataView,
        public offset: number,
        readonly dataEnd: number,
    ) {
    }

    readFourCC(): string {
        const result = this.peekFourCC()
        this.offset += 4
        return result
    }

    peekFourCC() {
        if (this.offset + 4 > this.dataEnd) throw new Error('Attempt to read past data end')
        return String.fromCharCode.apply(null, [
            this.dataView.getUint8(this.offset),
            this.dataView.getUint8(this.offset + 1),
            this.dataView.getUint8(this.offset + 2),
            this.dataView.getUint8(this.offset + 3),
        ])
    }

    read8(): number {
        if (this.offset + 1 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint8(this.offset)
        this.offset += 1
        return data
    }

    read16Signed(): number {
        if (this.offset + 2 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt16(this.offset, this.littleEndian)
        this.offset += 2
        return data
    }

    read16(): number {
        if (this.offset + 2 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint16(this.offset, this.littleEndian)
        this.offset += 2
        return data
    }

    read32Signed(): number {
        if (this.offset + 4 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getInt32(this.offset, this.littleEndian)
        this.offset += 4
        return data
    }

    read32(): number {
        if (this.offset + 4 > this.dataEnd) throw new Error('Attempt to read past data end')
        const data = this.dataView.getUint32(this.offset, this.littleEndian)
        this.offset += 4
        return data
    }

    readList(): AVIList {
        this.skipJunkChunk()
        const nextChunk = this.peekFourCC()
        if (nextChunk === 'JUNK') this.readChunk(true)
        const chunkType = this.readFourCC()
        if (chunkType !== 'LIST') throw new Error(`Unexpected chunk type; got ${chunkType} instead of LIST`)
        const listLength = this.read32()
        const dataEnd = this.offset + listLength
        const listType = this.readFourCC()
        const listReader = new AVIReader(this.dataView, this.offset, dataEnd)
        this.offset = dataEnd
        return new AVIList(listType, listReader)
    }

    readChunk(forceRead: boolean = false): AVIChunk {
        if (!forceRead) this.skipJunkChunk()
        const chunkType = this.readFourCC()
        if (chunkType === 'LIST') throw new Error(`Unexpected chunk type; got LIST instead of chunk type`)
        const chunkLength = this.read32()
        const dataEnd = this.offset + chunkLength
        const chunkReader = new AVIReader(this.dataView, this.offset, dataEnd)
        this.offset = dataEnd
        this.offset += this.offset % 2 // padded to WORD boundary
        return new AVIChunk(chunkType, chunkReader)
    }

    skipJunkChunk() {
        const nextChunk = this.peekFourCC()
        if (nextChunk === 'JUNK') {
            this.readChunk(true)
        }
    }

    hasMoreData(): boolean {
        return this.offset < this.dataEnd
    }
}

export class AVIList {
    constructor(
        readonly listType: string,
        readonly listReader: AVIReader,
    ) {
    }

    hasMoreItems(): boolean {
        return this.listReader.hasMoreData()
    }

    getNextListItem() {
        const itemType = this.listReader.peekFourCC()
        if (itemType === 'LIST') {
            return this.listReader.readList()
        } else {
            return this.listReader.readChunk()
        }
    }
}

export class AVIChunk {
    constructor(
        readonly chunkType: string,
        readonly chunkReader: AVIReader,
    ) {
    }
}
