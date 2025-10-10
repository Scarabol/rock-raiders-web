import { ByteStreamReader } from '../../../core/ByteStreamReader'
import { AVIVideoStream } from './AVIVideoStream'
import { AVIAudioFormat, AVIMainHeader, AVIStreamHeader, AVIVideoFormat, WAVE_FORMAT_MSADPCM } from './AVI'
import { AVIItem, AVIReader } from './AVIReader'
import { AVIAudioStream } from './AVIAudioStream'

export interface AVIFile {
    videoStreams: AVIVideoStream[]
    audioStreams: AVIAudioStream[]
}

export class AVIParser {
    static readonly LIST_TYPE_HEADER_LIST = 'hdrl'
    static readonly LIST_TYPE_STREAM_HEADER_LIST = 'strl'
    static readonly LIST_TYPE_STREAM_DATA = 'movi'
    static readonly CHUNK_TYPE_LIST = 'LIST'
    static readonly CHUNK_TYPE_JUNK = 'JUNK'
    static readonly CHUNK_TYPE_MAIN_HEADER = 'avih'
    static readonly CHUNK_TYPE_STREAM_HEADER = 'strh'
    static readonly CHUNK_TYPE_STREAM_FORMAT = 'strf'
    static readonly FCC_TYPE_VIDEO = 'vids'
    static readonly FCC_TYPE_AUDIO = 'auds'

    readonly reader: AVIReader
    readonly videoStreams: AVIVideoStream[] = []
    readonly audioStreams: AVIAudioStream[] = []
    readonly chunksByStreamIndex: Map<number, ByteStreamReader[]> = new Map()
    mainHeader?: AVIMainHeader

    constructor(dataView: DataView) {
        this.reader = new AVIReader(dataView)
    }

    parse(): AVIFile {
        const magic = this.reader.readFourCC()
        if (magic !== 'RIFF') throw new Error(`Unexpected magic in AVI header; got ${magic} instead of "RIFF"`)
        this.reader.read32() // fileLength not needed
        const fileType = this.reader.readFourCC()
        if (fileType !== 'AVI ') throw new Error(`Unexpected file type; got ${fileType} instead of "AVI "`)
        this.parseHeaderList()
        this.parseStreamData()
        // XXX handle optional avi index entries?
        this.videoStreams.forEach((stream) => {
            const chunks = this.chunksByStreamIndex.get(stream.streamIndex)
            if (!chunks) throw new Error(`No chunks for stream ${stream.streamIndex} provided`)
            stream.setFrameChunks(chunks)
        })
        this.audioStreams.forEach((stream) => {
            const chunks = this.chunksByStreamIndex.get(stream.streamIndex)
            if (!chunks) throw new Error(`No chunks for stream ${stream.streamIndex} provided`)
            stream.setFrameChunks(chunks)
        })
        return {videoStreams: this.videoStreams, audioStreams: this.audioStreams}
    }

    private parseHeaderList() {
        const headerList = this.reader.readList(AVIParser.LIST_TYPE_HEADER_LIST)
        let streamIndex = 0
        headerList.forEachItem((headerItem) => {
            switch (headerItem.chunkType) {
                case AVIParser.CHUNK_TYPE_MAIN_HEADER:
                    this.parseMainHeader(headerItem.reader)
                    break
                case AVIParser.CHUNK_TYPE_LIST:
                    this.parseStreamHeaders(streamIndex, headerItem)
                    streamIndex++
                    break
                default:
                    throw new Error(`Unhandled list type "${headerItem.chunkType}" in AVI file. Cannot proceed without endless loop`)
            }
        })
    }

    private parseMainHeader(aviReader: AVIReader) {
        this.mainHeader = {
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

    private parseStreamHeaders(streamIndex: number, headerItem: AVIItem) {
        const listType = headerItem.reader.readFourCC()
        if (listType !== AVIParser.LIST_TYPE_STREAM_HEADER_LIST) throw new Error(`Unexpected list type; got ${listType} instead of ${AVIParser.LIST_TYPE_STREAM_HEADER_LIST}`)
        while (headerItem.reader.hasMoreData()) {
            const streamHeaderItem = headerItem.reader.readItem()
            if (!streamHeaderItem) throw new Error('Failed to read next header item')
            if (streamHeaderItem.chunkType !== AVIParser.CHUNK_TYPE_STREAM_HEADER) throw new Error(`Unexpected header item; got ${streamHeaderItem.chunkType} instead of ${AVIParser.CHUNK_TYPE_STREAM_HEADER}`)
            const streamHeader = this.parseStreamHeader(streamHeaderItem.reader)
            const streamFormatItem = headerItem.reader.readItem()
            if (!streamFormatItem) throw new Error('Failed to read next stream format item')
            if (streamFormatItem.chunkType !== AVIParser.CHUNK_TYPE_STREAM_FORMAT) throw new Error(`Unexpected header item; got ${streamFormatItem.chunkType} instead of ${AVIParser.CHUNK_TYPE_STREAM_FORMAT}`)
            switch (streamHeader.fccType) {
                case AVIParser.FCC_TYPE_VIDEO:
                    const videoFormat = this.parseVideoFormat(streamFormatItem.reader)
                    this.videoStreams.push(new AVIVideoStream(streamIndex, streamHeader, videoFormat))
                    break
                case AVIParser.FCC_TYPE_AUDIO:
                    const audioFormat = this.parseAudioFormat(streamFormatItem.reader)
                    this.audioStreams.push(new AVIAudioStream(streamIndex, streamHeader, audioFormat))
                    break
                default:
                    console.warn(`Unsupported stream fcc type ${streamHeader.fccType}`)
                    break
            }
        }
    }

    private parseStreamHeader(aviReader: AVIReader): AVIStreamHeader {
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

    private parseVideoFormat(aviReader: AVIReader): AVIVideoFormat {
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

    private parseAudioFormat(aviReader: AVIReader): AVIAudioFormat {
        const result: AVIAudioFormat = {
            wFormatTag: aviReader.read16(),
            nChannels: aviReader.read16(),
            nSamplesPerSec: aviReader.read32(),
            nAvgBytesPerSec: aviReader.read32(),
            nBlockAlign: aviReader.read16(),
            wBitsPerSample: aviReader.read16(),
            cbSize: aviReader.read16(),
        }
        if (result.cbSize) {
            switch (result.wFormatTag) {
                case WAVE_FORMAT_MSADPCM:
                    result.extra = {
                        wSamplesPerBlock: aviReader.read16(),
                        wNumCoefficients: aviReader.read16(),
                        coefficientPairs: [[], []]
                    }
                    for (let c = 0; c < result.extra.wNumCoefficients; c++) {
                        result.extra.coefficientPairs[0].push(aviReader.read16Signed())
                        result.extra.coefficientPairs[1].push(aviReader.read16Signed())
                    }
                    break
                default:
                    throw new Error(`Unhandled audio codec ${result.wFormatTag}`)
            }
        }
        return result
    }

    private parseStreamData() {
        const moviList = this.reader.readList(AVIParser.LIST_TYPE_STREAM_DATA)
        moviList.forEachItem((streamDataItem) => {
            const streamIndexStr = streamDataItem.chunkType.slice(0, 2)
            const streamIndex = Number(streamIndexStr)
            if (isNaN(streamIndex)) throw new Error(`Non-numeric stream index given "${streamIndexStr}" in "${streamDataItem.chunkType}"`)
            const chunks = this.chunksByStreamIndex.getOrUpdate(streamIndex, () => [])
            chunks.push(streamDataItem.reader)
        })
    }
}
