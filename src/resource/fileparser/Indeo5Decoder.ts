import { AVIReader, AVIVideoFormat, RRWVideoDecoder } from './AVIParser'
import { BitstreamReader } from './BitstreamReader'

interface BandInfo {
    mvRes: number
    mbSizeId: number
    blkSizeId: number
    transFlg: number
    extTrans: number
    endMarker: number
}

export class Indeo5Decoder implements RRWVideoDecoder {
    static readonly STANDARD_PICTURE_SIZES = [[640, 480], [320, 240], [160, 120], [704, 224], [352, 288], [176, 144], [240, 180], [640, 240], [704, 240], [80, 60], [88, 72], [0, 0], [0, 0], [0, 0]]
    static readonly HUFFMAN_MACROBLOCK_DEFAULT_INDEX = 7
    static readonly HUFFMAN_MACROBLOCK_CODEBOOKS = [
        [0, 4, 5, 4, 4, 4, 6, 6],
        [0, 2, 2, 3, 3, 3, 3, 5, 3, 2, 2, 2],
        [0, 2, 3, 4, 3, 3, 3, 3, 4, 3, 2, 2],
        [0, 3, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2],
        [0, 4, 4, 3, 3, 3, 3, 2, 3, 3, 2, 1, 1],
        [0, 4, 4, 4, 4, 3, 3, 3, 2],
        [0, 4, 4, 4, 4, 3, 3, 2, 2, 2],
        [0, 4, 4, 4, 3, 3, 2, 3, 2, 2, 2, 2],
    ]
    static readonly HUFFMAN_BLOCK_DEFAULT_INDEX: number = 7
    static readonly HUFFMAN_BLOCK_CODEBOOKS = [
        [1, 2, 3, 4, 4, 7, 5, 5, 4, 1],
        [2, 3, 4, 4, 4, 7, 5, 4, 3, 3, 2],
        [2, 4, 5, 5, 5, 5, 6, 4, 4, 3, 1, 1],
        [3, 3, 4, 4, 5, 6, 6, 4, 4, 3, 2, 1, 1],
        [3, 4, 4, 5, 5, 5, 6, 5, 4, 2, 2],
        [3, 4, 5, 5, 5, 5, 6, 4, 3, 3, 2, 1, 1],
        [3, 4, 5, 5, 5, 6, 5, 4, 3, 3, 2, 1, 1],
        [3, 4, 4, 5, 5, 5, 6, 5, 5],
    ]

    static readonly FRAME_TYPE_INTRA = 0
    static readonly FRAME_TYPE_NULL = 4

    static readonly GOP_HEADER_SIZE = 0x1
    static readonly GOP_TRANSPARENCY_DATA = 0x8
    static readonly GOP_ACCESS_KEY = 0x20
    static readonly GOP_LOCAL_DECODING = 0x40
    static readonly FRAME_PIC_HEADER_SIZE = 0x1
    static readonly FRAME_CHECKSUM = 0x10
    static readonly FRAME_HEADER_EXT = 0x20
    static readonly FRAME_HUFF_DESC = 0x40
    static readonly FRAME_BAND_DATA_SIZE = 0x80

    static readonly BAND_RV_TAB_CORRECTION = 0x10
    static readonly BAND_HDR_EXT = 0x20
    static readonly BAND_RV_TAB_SELECTION = 0x40
    static readonly BAND_BLK_HUFF_DESC = 0x80

    chunks: AVIReader[]
    videoFormat: AVIVideoFormat
    chunkIndex: number = 0
    bitstreamReader: BitstreamReader

    frameType: number = 0
    frameFlags: number = 0
    gopFlags: number = 0
    numLumaBands: number = 0

    initialize(chunks: AVIReader[], videoFormat: AVIVideoFormat) {
        console.log('videoFormat', videoFormat)
        this.chunks = chunks
        this.videoFormat = videoFormat
    }

    getNextFrame(): ImageData {
        const chunk = this.chunks[this.chunkIndex]
        console.log('first chunk', chunk)
        this.chunkIndex++
        this.bitstreamReader = new BitstreamReader(chunk.dataView, chunk.offset, chunk.dataEnd)
        this.decodePicHeader()

        // if (this.frameType !== Indeo5Decoder.FRAME_TYPE_NULL) {
        //     for (let b = 0; b < this.numLumaBands; b++) {
        //         this.decodeBand()
        //     }
        // }

        // BAND HEADER
        const bandFlags = this.bitstreamReader.readBits(8)
        if (this.frameFlags & Indeo5Decoder.FRAME_BAND_DATA_SIZE) {
            const bandDataSize = this.bitstreamReader.readBits(24)
            console.log('bandDataSize', bandDataSize)
        }
        if (bandFlags & Indeo5Decoder.BAND_RV_TAB_CORRECTION) {
            const numRvCorr = this.bitstreamReader.readBits(8)
            console.log('numRvCorr', numRvCorr)
            for (let c = 0; c < numRvCorr; c++) {
                const rvTabCorr = this.bitstreamReader.readBits(16)
                console.log('rvTabCorr', rvTabCorr)
            }
        }
        if (bandFlags & Indeo5Decoder.BAND_RV_TAB_SELECTION) {
            const rvTabSel = this.bitstreamReader.readBits(3)
            console.log('rvTabSel', rvTabSel)
        }
        const readBandCodebook = bandFlags & Indeo5Decoder.BAND_BLK_HUFF_DESC
        let bandCodebook: number[] = this.readHuffmanCodeblock(readBandCodebook, Indeo5Decoder.HUFFMAN_BLOCK_CODEBOOKS, Indeo5Decoder.HUFFMAN_BLOCK_DEFAULT_INDEX)
        console.log('bandCodebook', bandCodebook)
        const checksumFlag = this.bitstreamReader.readBits(1)
        console.log('checksum flag', checksumFlag)
        if (checksumFlag) {
            const bandChecksum = this.bitstreamReader.readBits(16)
            console.log('bandChecksum', bandChecksum)
        }
        const globalQuantLevel = this.bitstreamReader.readBits(5)
        console.log('globalQuantLevel', globalQuantLevel)
        this.bitstreamReader.alignToNextByteBoundary()
        if (bandFlags & Indeo5Decoder.BAND_HDR_EXT) {
            throw new Error('Skip band header extension')
        }
        this.bitstreamReader.alignToNextByteBoundary()
        // FIXME continue here
        return null
    }

    decodePicHeader() {
        const psc = this.bitstreamReader.readBits(5)
        if (psc !== 0x1F) throw new Error(`Invalid picture start code; got 0x${psc.toString(16)} 0b${psc.toString(2)} expected 0x1F`)
        this.frameType = this.bitstreamReader.readBits(3)
        console.log('frameType', this.frameType)
        if (this.frameType === Indeo5Decoder.FRAME_TYPE_NULL) return null // do nothing
        const frameNumber = this.bitstreamReader.readBits(8)
        console.log('frameNumber', frameNumber)
        // GOP HEADER
        if (this.frameType === Indeo5Decoder.FRAME_TYPE_INTRA) {
            // Only in INTRA frames
            this.decodeGOPHeader()
        }
        // FRAME HEADER
        if (this.frameType !== Indeo5Decoder.FRAME_TYPE_NULL) {
            // in all frames except NULL
            this.frameFlags = this.bitstreamReader.readBits(8)
            console.log('frame flags', this.frameFlags.toString(2))
            if (this.frameFlags & Indeo5Decoder.FRAME_PIC_HEADER_SIZE) {
                const picHeaderSize = this.bitstreamReader.readBits(24)
                console.log('picHeaderSize', picHeaderSize)
            }
            if (this.frameFlags & Indeo5Decoder.FRAME_CHECKSUM) {
                const frameChecksum = this.bitstreamReader.readBits(16)
                console.log('frameChecksum', frameChecksum)
            }
            if (this.frameFlags & Indeo5Decoder.FRAME_HEADER_EXT) {
                throw new Error('not yet implemented')
            }
            const readCodebook = this.frameFlags & Indeo5Decoder.FRAME_HUFF_DESC
            let codebook = this.readHuffmanCodeblock(readCodebook, Indeo5Decoder.HUFFMAN_MACROBLOCK_CODEBOOKS, Indeo5Decoder.HUFFMAN_MACROBLOCK_DEFAULT_INDEX)
            console.log('codebook', codebook)
            this.bitstreamReader.readBits(3) // ignored unused
        }
        this.bitstreamReader.alignToNextByteBoundary()
    }

    decodeGOPHeader() {
        this.gopFlags = this.bitstreamReader.readBits(8)
        console.log('gopFlags', this.gopFlags.toString(2))
        if (this.gopFlags & Indeo5Decoder.GOP_HEADER_SIZE) {
            const gopHeaderSize = this.bitstreamReader.readBits(16)
            console.log('gopHeaderSize', gopHeaderSize)
        }
        if (this.gopFlags & Indeo5Decoder.GOP_ACCESS_KEY) {
            const lockWord = this.bitstreamReader.readBits(32)
            console.log('lockWord', lockWord)
        }
        if (this.gopFlags & Indeo5Decoder.GOP_LOCAL_DECODING) throw new Error('Local decoding mode not supported')
        const lumaLevels = this.bitstreamReader.readBits(2)
        console.log('luma levels', lumaLevels)
        const chromaLevel = this.bitstreamReader.readBits(1)
        console.log('chroma levels', chromaLevel)
        const picSizeId = this.bitstreamReader.readBits(4)
        console.log('pic size id', picSizeId)
        let picHeight: number, picWidth: number
        if (picSizeId === 15) {
            picHeight = this.bitstreamReader.readBits(13)
            picWidth = this.bitstreamReader.readBits(13)
        } else {
            [picWidth, picHeight] = Indeo5Decoder.STANDARD_PICTURE_SIZES[picSizeId]
        }
        console.log('pic size', picHeight, picWidth)
        this.numLumaBands = lumaLevels * 3 + 1
        console.log('num luma bands', this.numLumaBands)
        for (let c = 0; c < this.numLumaBands; c++) {
            const band: BandInfo = {
                mvRes: this.bitstreamReader.readBits(1),
                mbSizeId: this.bitstreamReader.readBits(1),
                blkSizeId: this.bitstreamReader.readBits(1),
                transFlg: this.bitstreamReader.readBits(1),
                extTrans: 0,
                endMarker: 0,
            }
            if (band.extTrans) {
                band.extTrans = this.bitstreamReader.readBits(2)
            }
            band.endMarker = this.bitstreamReader.readBits(2)
            console.log('luma band', band)
        }
        const chromaBand: BandInfo = {
            mvRes: this.bitstreamReader.readBits(1),
            mbSizeId: this.bitstreamReader.readBits(1),
            blkSizeId: this.bitstreamReader.readBits(1),
            transFlg: this.bitstreamReader.readBits(1),
            extTrans: 0,
            endMarker: 0,
        }
        if (chromaBand.extTrans) {
            chromaBand.extTrans = this.bitstreamReader.readBits(2)
        }
        chromaBand.endMarker = this.bitstreamReader.readBits(2)
        console.log('chroma band', chromaBand)
        if (this.gopFlags & Indeo5Decoder.GOP_TRANSPARENCY_DATA) {
            const align = this.bitstreamReader.readBits(3)
            if (align !== 0) throw new Error('Invalid alignment')
            const colorFlg = this.bitstreamReader.readBits(1)
            console.log('colorFlg', colorFlg)
            if (colorFlg) {
                const transCol = this.bitstreamReader.readBits(24)
                console.log('transCol', transCol)
            }
        }
        this.bitstreamReader.alignToNextByteBoundary()
        this.bitstreamReader.readBits(8 + 8 + 3 + 4) // skipped unknown/unused
        const gopExt = this.bitstreamReader.readBits(1)
        console.log('gopExt', gopExt)
        if (gopExt) throw new Error('GOP header extension not yet supported')
        this.bitstreamReader.alignToNextByteBoundary()
    }

    readHuffmanCodeblock(readCodebook: number, codebooks: number[][], defaultIndex: number): number[] {
        if (!readCodebook) return codebooks[defaultIndex]
        const selector = this.bitstreamReader.readBits(3)
        console.log('selector', selector)
        if (selector < 7) { // predefined codebooks
            return codebooks[selector]
        } else if (selector === 7) { // custom codebook
            const numRows = this.bitstreamReader.readBits(4)
            console.log('numRows', numRows)
            let xBits: number[] = []
            for (let c = 0; c < numRows; c++) {
                xBits[c] = this.bitstreamReader.readBits(4)
            }
            console.log('xBits', xBits)
            return xBits
        } else {
            throw new Error(`Invalid huffman selector ${selector} given`)
        }
    }
}
