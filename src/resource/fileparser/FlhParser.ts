import { getPixel, setPixel } from '../../core/ImageHelper'

/**
 * References for FLIC file formats (FLC, FLI and FLH)
 *
 * https://www.compuphase.com/flic.htm#DELTA_FLC
 * https://github.com/miningmanna/LRR-remake/blob/master/src/org/rrr/assets/tex/FLHFile.java
 * https://www.drdobbs.com/windows/the-flic-file-format/184408954
 * http://bespin.org/~qz/pc-gpe/fli.for
 * https://github.com/aseprite/flic/blob/main/decoder.cpp
 *
 */

export class FlhParser {
    fileLength: number = 0
    flicFileType: number = 0
    lengthFrames: number = 0
    frames: Array<ImageData> = []
    width: number = 0
    height: number = 0
    depth: number = 0
    offsetFirstFrame: number = 0

    constructor(readonly dataView: DataView, readonly interFrameMode: boolean) {
    }

    parse(): ImageData[] {
        this.parseHeader()
        this.parseChunks()
        if (this.interFrameMode) this.frames.shift()
        return this.frames
    }

    private parseHeader() {
        this.fileLength = this.getDWord(0)
        this.flicFileType = this.getWord(4)
        if (this.flicFileType !== 0xAF43) console.warn(`Unexpected FLIC file type found: ${this.flicFileType} does not match expected 0xAF43`)
        this.lengthFrames = this.getWord(6)
        this.frames = new Array(this.lengthFrames)
        this.width = this.getWord(8)
        this.height = this.getWord(10)
        this.depth = this.getWord(12)
        if (this.depth != 16) console.warn(`Expected 16 bit colors in flh file; got instead: ${this.depth}`)
        // const flags = this.getWord(14) // always 0
        // const speed = this.getDWord(16) // delay between frames; always 0
        this.offsetFirstFrame = this.getDWord(80)
    }

    private parseChunks() {
        let frameIndex = 0
        for (let chunkStart = this.offsetFirstFrame; chunkStart < this.fileLength;) {
            const chunkLength = this.getDWord(chunkStart)
            const chunkType = this.getWord(chunkStart + 4)
            switch (chunkType) {
                case 0xF1FA:
                    if (chunkLength > 16) {
                        this.parseFrameType(chunkStart + 6, frameIndex)
                        frameIndex++
                    }
                    break
                default:
                    console.warn(`Unexpected chunk type: 0x${chunkType.toString(16).toUpperCase()}`)
                    break
            }
            chunkStart += chunkLength
        }
    }

    parseFrameType(chunkStart: number, frameIndex: number) {
        let offset = chunkStart
        const numChunks = this.dataView.getUint16(offset, true)
        if (numChunks > 1) {
            console.warn(`More than one sub-chunk; got instead: ${numChunks}`)
        }
        offset += 2
        offset += 2
        offset += 2 // reserved = 0
        offset += 4 // width and height override should be 0

        let len = this.dataView.getUint32(offset, true)
        len -= 6
        offset += 4
        const chunkType = this.dataView.getUint16(offset, true)
        offset += 2

        switch (chunkType) {
            case 25:
                this.parseDtaBrun(this.dataView, offset, chunkStart + len, frameIndex)
                break
            case 27:
                this.parseDeltaFlc(this.dataView, offset, chunkStart + len, frameIndex)
                break
            default:
                console.warn(`Unsupported sub-chunk type: ${chunkType}`)
                break
        }
    }

    private parseDtaBrun(seg: DataView, offset: number, chunkEnd: number, frameIndex: number) {
        const imgData = new ImageData(this.width, this.height)
        let x = 0
        let y = 0
        let w = this.width
        offset += 1
        while ((chunkEnd - offset) > 0) {
            let repeat = seg.getInt8(offset)
            if (repeat < 0) {
                repeat = (repeat * -1)
                for (let i = 0; i < repeat; i++) {
                    const [r, g, b] = FlhParser.getARGBFrom555RGB(seg, offset + i * 2 + 1)
                    this.setPixel(imgData, x, y, r, g, b, (!r && !g && !b ? 0 : 255))
                    x++
                }
                offset += repeat * 2 + 1
            } else {
                const [r, g, b] = FlhParser.getARGBFrom555RGB(seg, offset + 1)
                for (let i = 0; i < repeat; i++) {
                    this.setPixel(imgData, x, y, r, g, b, (!r && !g && !b ? 0 : 255))
                    x++
                }
                offset += 3
            }
            if (x >= w) {
                x %= w
                y++
                if (y > this.height) break
                offset++
            }
        }
        this.frames[frameIndex] = imgData
    }

    private parseDeltaFlc(seg: DataView, offset: number, chunkEnd: number, frameIndex: number) {
        const res = new ImageData(this.width, this.height)
        if (frameIndex > (this.interFrameMode ? 1 : 0)) {
            res.data.set(this.frames[frameIndex - 1].data)
        }
        const numLines = seg.getUint16(offset, true)
        offset += 2
        let y = 0
        let linesDone = 0
        while ((chunkEnd - offset) > 0) {
            if (numLines === linesDone) {
                console.warn(`All lines already done. Unexpected data at: ${chunkEnd - offset}`)
                break
            }
            let packCount = -1
            while (packCount === -1) {
                const opcode = seg.getInt16(offset, true)
                offset += 2
                const opType = (0x0000C000 & opcode) >> 14
                switch (opType) {
                    case 0:
                        packCount = opcode
                        break
                    case 1: // undefined opcode according to specs
                        console.warn(`Undefined opcode: ${opcode}`)
                        break
                    case 2:
                        // console.log('Last Pixel?')
                        break
                    case 3:
                        y += Math.abs(opcode) & 0x000000FF
                        break
                    default:
                        console.warn(`Unknown opType: ${opType}; opcode: ${opcode}`)
                        break
                }
            }
            let x = 0
            for (let i = 0; i < packCount; i++) {
                x += 0x000000FF & seg.getInt8(offset)
                offset++
                let repeat = seg.getInt8(offset)
                offset++
                if (repeat < 0) {
                    repeat = (-1 * repeat)
                    const [r, g, b] = FlhParser.getARGBFrom555RGB(seg, offset)
                    for (let j = 0; j < repeat; j++) {
                        this.setPixel(res, x, y, r, g, b)
                        x++
                    }
                    offset += 2
                } else {
                    for (let j = 0; j < repeat; j++) {
                        const [r, g, b] = FlhParser.getARGBFrom555RGB(seg, offset + j * 2)
                        this.setPixel(res, x, y, r, g, b)
                        x++
                    }
                    offset += repeat * 2
                }
            }
            y++
            linesDone++
        }
        this.frames[frameIndex] = res
    }

    private setPixel(img: ImageData, x: number, y: number, r: number, g: number, b: number, a: number = 255) {
        const firstFrame = this.frames[0]
        if (this.interFrameMode && firstFrame && img !== firstFrame) {
            const f = getPixel(firstFrame, x, y)
            const d = Math.abs(f.r - r) + Math.abs(f.g - g) + Math.abs(f.b - b) + Math.abs(f.a - a)
            if (d > 1) {
                setPixel(img, x, y, r, g, b, a)
            } else {
                setPixel(img, x, y, 0, 0, 0, 0)
            }
        } else {
            setPixel(img, x, y, r, g, b, a)
        }
    }

    private static getARGBFrom555RGB(a: DataView, offset: number): [number, number, number] {
        let rgb = 0x000000FF
        rgb &= a.getInt8(offset + 1)
        rgb = rgb << 8
        rgb |= 0x000000FF & a.getInt8(offset)
        let r = Math.floor((rgb >> 10) * (255.0 / 31.0))
        let g = Math.floor(((rgb >> 5) & 0b00011111) * (255.0 / 31.0))
        let b = Math.floor((rgb & 0b00011111) * (255.0 / 31.0))
        return [r, g, b]
    }

    private getDWord(offset: number): number {
        return this.dataView.getUint32(offset, true)
    }

    private getWord(offset: number): number {
        return this.dataView.getUint16(offset, true)
    }
}
