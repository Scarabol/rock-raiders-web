/**
 * Source: https://github.com/wokwi/bmp-ts
 */

enum HeaderTypes {
    BITMAP_INFO_HEADER = 40,
    BITMAP_V2_INFO_HEADER = 52,
    BITMAP_V3_INFO_HEADER = 56,
    BITMAP_V4_HEADER = 108,
    BITMAP_V5_HEADER = 124
}

// We have these:
//
// const sample = 0101 0101 0101 0101
// const mask   = 0111 1100 0000 0000
// 256        === 0000 0001 0000 0000
//
// We want to take the sample and turn it into an 8-bit value.
//
// 1. We extract the last bit of the mask:
//
// 0000 0100 0000 0000
//       ^
//
// Like so:
//
// const a = ~mask =    1000 0011 1111 1111
// const b = a + 1 =    1000 0100 0000 0000
// const c = b & mask = 0000 0100 0000 0000
//
// 2. We shift it to the right and extract the bit before the first:
//
// 0000 0000 0010 0000
//             ^
//
// Like so:
//
// const d = mask / c = 0000 0000 0001 1111
// const e = mask + 1 = 0000 0000 0010 0000
//
// 3. We apply the mask and the two values above to a sample:
//
// const f = sample & mask = 0101 0100 0000 0000
// const g = f / c =         0000 0000 0001 0101
// const h = 256 / e =       0000 0000 0000 0100
// const i = g * h =         0000 0000 1010 1000
//                                     ^^^^ ^
//
// Voila, we have extracted a sample and "stretched" it to 8 bits. For samples
// which are already 8-bit, h === 1 and g === i.

function maskColor(
    maskRed: number,
    maskGreen: number,
    maskBlue: number,
    maskAlpha: number,
) {
    const maskRedR = (~maskRed + 1) & maskRed
    const maskGreenR = (~maskGreen + 1) & maskGreen
    const maskBlueR = (~maskBlue + 1) & maskBlue
    const maskAlphaR = (~maskAlpha + 1) & maskAlpha

    const shiftedMaskRedL = maskRed / maskRedR + 1
    const shiftedMaskGreenL = maskGreen / maskGreenR + 1
    const shiftedMaskBlueL = maskBlue / maskBlueR + 1
    const shiftedMaskAlphaL = maskAlpha / maskAlphaR + 1

    return {
        shiftRed: (x: number) =>
            (((x & maskRed) / maskRedR) * 0x100) / shiftedMaskRedL,
        shiftGreen: (x: number) =>
            (((x & maskGreen) / maskGreenR) * 0x100) / shiftedMaskGreenL,
        shiftBlue: (x: number) =>
            (((x & maskBlue) / maskBlueR) * 0x100) / shiftedMaskBlueL,
        shiftAlpha:
            maskAlpha !== 0
                ? (x: number) => (((x & maskAlpha) / maskAlphaR) * 0x100) / shiftedMaskAlphaL
                : () => 255,
    }
}

const enum Compression {
    NONE = 0,
    BI_RLE8 = 1,
    BI_RLE4 = 2,
    BI_BIT_FIELDS = 3,
    BI_ALPHA_BIT_FIELDS = 6
}

type BitsPerPixel = 1 | 4 | 8 | 16 | 24 | 32;

interface IColor {
    red: number;
    green: number;
    blue: number;
    quad: number;
}

interface IDecoderOptions {
    toRGBA?: boolean;
}

interface IImage {
    width: number;
    height: number;
    bitPP: BitsPerPixel;
    data: Uint8Array;
    reserved1?: number;
    reserved2?: number;
    hr?: number;
    vr?: number;
    colors?: number;
    importantColors?: number;
    palette?: IColor[];
}

interface IBitmapImage extends IImage {
    flag: string;
    fileSize: number;
    offset: number;
    headerSize: number;
    planes?: number;
    compression?: Compression;
    rawSize: number;
}

type IColorProcessor = (x: number, line: number) => void;

class BmpDecoder implements IBitmapImage {
    // Header
    public flag: string
    public fileSize!: number
    public reserved1!: number
    public reserved2!: number
    public offset!: number
    public headerSize!: number
    public width!: number
    public height!: number
    public planes!: number
    public bitPP!: BitsPerPixel
    public compression?: Compression
    public rawSize!: number
    public hr!: number
    public vr!: number
    public colors!: number
    public importantColors!: number
    public palette!: IColor[]
    public data!: Uint8Array

    private maskRed!: number
    private maskGreen!: number
    private maskBlue!: number
    private maskAlpha!: number

    private readonly toRGBA: boolean

    private pos: number
    private bottomUp: boolean

    private readonly locRed: number
    private readonly locGreen: number
    private readonly locBlue: number
    private readonly locAlpha: number

    private shiftRed!: (x: number) => number
    private shiftGreen!: (x: number) => number
    private shiftBlue!: (x: number) => number
    private shiftAlpha!: (x: number) => number

    constructor(
        readonly bufferView: DataView,
        {toRGBA}: IDecoderOptions = {toRGBA: false},
    ) {
        this.toRGBA = !!toRGBA
        this.bottomUp = true
        this.flag = String.fromCharCode(this.bufferView.getUint8(0), this.bufferView.getUint8(1))
        this.pos = 2

        if (this.flag !== 'BM') {
            throw new Error('Invalid BMP File')
        }

        this.locRed = this.toRGBA ? 0 : 3
        this.locGreen = this.toRGBA ? 1 : 2
        this.locBlue = this.toRGBA ? 2 : 1
        this.locAlpha = this.toRGBA ? 3 : 0

        this.parseHeader()
        this.parseRGBA()
    }

    private parseHeader() {
        this.fileSize = this.readUInt32LE()

        this.reserved1 = this.bufferView.getUint16(this.pos, true)
        this.pos += 2
        this.reserved2 = this.bufferView.getUint16(this.pos, true)
        this.pos += 2

        this.offset = this.readUInt32LE()

        // End of BITMAP_FILE_HEADER
        this.headerSize = this.readUInt32LE()

        if (!(this.headerSize in HeaderTypes)) {
            throw new Error(`Unsupported BMP header size ${this.headerSize}`)
        }

        this.width = this.readUInt32LE()
        this.height = this.readUInt32LE()

        this.planes = this.bufferView.getUint16(this.pos, true)
        this.pos += 2
        this.bitPP = this.bufferView.getUint16(this.pos, true) as BitsPerPixel
        this.pos += 2

        this.compression = this.readUInt32LE()
        this.rawSize = this.readUInt32LE()
        this.hr = this.readUInt32LE()
        this.vr = this.readUInt32LE()
        this.colors = this.readUInt32LE()
        this.importantColors = this.readUInt32LE()

        // De facto defaults

        if (this.bitPP === 32) {
            this.maskAlpha = 0
            this.maskRed = 0x00ff0000
            this.maskGreen = 0x0000ff00
            this.maskBlue = 0x000000ff
        } else if (this.bitPP === 16) {
            this.maskAlpha = 0
            this.maskRed = 0x7c00
            this.maskGreen = 0x03e0
            this.maskBlue = 0x001f
        }

        // End of BITMAP_INFO_HEADER

        if (
            this.headerSize > HeaderTypes.BITMAP_INFO_HEADER ||
            this.compression === Compression.BI_BIT_FIELDS ||
            this.compression === Compression.BI_ALPHA_BIT_FIELDS
        ) {
            this.maskRed = this.readUInt32LE()
            this.maskGreen = this.readUInt32LE()
            this.maskBlue = this.readUInt32LE()
        }

        // End of BITMAP_V2_INFO_HEADER

        if (
            this.headerSize > HeaderTypes.BITMAP_V2_INFO_HEADER ||
            this.compression === Compression.BI_ALPHA_BIT_FIELDS
        ) {
            this.maskAlpha = this.readUInt32LE()
        }

        // End of BITMAP_V3_INFO_HEADER

        if (this.headerSize > HeaderTypes.BITMAP_V3_INFO_HEADER) {
            this.pos +=
                HeaderTypes.BITMAP_V4_HEADER - HeaderTypes.BITMAP_V3_INFO_HEADER
        }

        // End of BITMAP_V4_HEADER

        if (this.headerSize > HeaderTypes.BITMAP_V4_HEADER) {
            this.pos += HeaderTypes.BITMAP_V5_HEADER - HeaderTypes.BITMAP_V4_HEADER
        }

        // End of BITMAP_V5_HEADER

        if (this.bitPP <= 8 || this.colors > 0) {
            const len = this.colors === 0 ? 1 << this.bitPP : this.colors
            this.palette = new Array(len)

            for (let i = 0; i < len; i++) {
                const blue = this.bufferView.getUint8(this.pos++)
                const green = this.bufferView.getUint8(this.pos++)
                const red = this.bufferView.getUint8(this.pos++)
                const quad = this.bufferView.getUint8(this.pos++)

                this.palette[i] = {
                    red,
                    green,
                    blue,
                    quad,
                }
            }
        }

        // End of color table

        // Can the height ever be negative?
        if (this.height < 0) {
            this.height *= -1
            this.bottomUp = false
        }

        const coloShift = maskColor(
            this.maskRed,
            this.maskGreen,
            this.maskBlue,
            this.maskAlpha,
        )

        this.shiftRed = coloShift.shiftRed
        this.shiftGreen = coloShift.shiftGreen
        this.shiftBlue = coloShift.shiftBlue
        this.shiftAlpha = coloShift.shiftAlpha
    }

    private parseRGBA() {
        this.data = new Uint8Array(this.width * this.height * 4)

        switch (this.bitPP) {
            case 1:
                this.bit1()
                break
            case 4:
                this.bit4()
                break
            case 8:
                this.bit8()
                break
            case 16:
                this.bit16()
                break
            case 24:
                this.bit24()
                break
            default:
                this.bit32()
        }
    }

    private bit1() {
        const xLen = Math.ceil(this.width / 8)
        const mode = xLen % 4
        const padding = mode !== 0 ? 4 - mode : 0

        let lastLine: number | undefined

        this.scanImage(padding, xLen, (x, line) => {
            if (line !== lastLine) {
                lastLine = line
            }

            const b = this.bufferView.getUint8(this.pos++)
            const location = line * this.width * 4 + x * 8 * 4

            for (let i = 0; i < 8; i++) {
                if (x * 8 + i < this.width) {
                    const rgb = this.palette[(b >> (7 - i)) & 0x1]

                    this.data[location + i * 4 + this.locAlpha] = 0xff
                    this.data[location + i * 4 + this.locBlue] = rgb.blue
                    this.data[location + i * 4 + this.locGreen] = rgb.green
                    this.data[location + i * 4 + this.locRed] = rgb.red
                } else {
                    break
                }
            }
        })
    }

    private bit4() {
        if (this.compression === Compression.BI_RLE4) {
            this.data.fill(0)

            let lowNibble = false //for all count of pixel
            let lines = this.bottomUp ? this.height - 1 : 0
            let location = 0

            while (location < this.data.length) {
                const a = this.bufferView.getUint8(this.pos++)
                const b = this.bufferView.getUint8(this.pos++)

                //absolute mode
                if (a === 0) {
                    if (b === 0) {
                        //line end
                        lines += this.bottomUp ? -1 : 1
                        location = lines * this.width * 4
                        lowNibble = false

                        continue
                    }

                    if (b === 1) {
                        // image end
                        break
                    }

                    if (b === 2) {
                        // offset x, y
                        const x = this.bufferView.getUint8(this.pos++)
                        const y = this.bufferView.getUint8(this.pos++)

                        lines += this.bottomUp ? -y : y
                        location += y * this.width * 4 + x * 4
                    } else {
                        let c = this.bufferView.getUint8(this.pos++)

                        for (let i = 0; i < b; i++) {
                            location = this.setPixelData(
                                location,
                                lowNibble ? c & 0x0f : (c & 0xf0) >> 4,
                            )

                            if (i & 1 && i + 1 < b) {
                                c = this.bufferView.getUint8(this.pos++)
                            }

                            lowNibble = !lowNibble
                        }

                        if ((((b + 1) >> 1) & 1) === 1) {
                            this.pos++
                        }
                    }
                } else {
                    //encoded mode
                    for (let i = 0; i < a; i++) {
                        location = this.setPixelData(
                            location,
                            lowNibble ? b & 0x0f : (b & 0xf0) >> 4,
                        )
                        lowNibble = !lowNibble
                    }
                }
            }
        } else {
            const xLen = Math.ceil(this.width / 2)
            const mode = xLen % 4
            const padding = mode !== 0 ? 4 - mode : 0

            this.scanImage(padding, xLen, (x, line) => {
                const b = this.bufferView.getUint8(this.pos++)
                const location = line * this.width * 4 + x * 2 * 4

                const first4 = b >> 4
                let rgb = this.palette[first4]

                this.data[location + this.locAlpha] = 0xff
                this.data[location + this.locBlue] = rgb.blue
                this.data[location + this.locGreen] = rgb.green
                this.data[location + this.locRed] = rgb.red

                if (x * 2 + 1 >= this.width) {
                    // throw new Error('Something');
                    return
                }

                const last4 = b & 0x0f
                rgb = this.palette[last4]

                this.data[location + 4 + this.locAlpha] = 0xff
                this.data[location + 4 + this.locBlue] = rgb.blue
                this.data[location + 4 + this.locGreen] = rgb.green
                this.data[location + 4 + this.locRed] = rgb.red
            })
        }
    }

    private bit8() {
        if (this.compression === Compression.BI_RLE8) {
            this.data.fill(0)

            let lines = this.bottomUp ? this.height - 1 : 0
            let location = 0

            while (location < this.data.length) {
                const a = this.bufferView.getUint8(this.pos++)
                const b = this.bufferView.getUint8(this.pos++)

                //absolute mode
                if (a === 0) {
                    if (b === 0) {
                        //line end
                        lines += this.bottomUp ? -1 : 1
                        location = lines * this.width * 4
                        continue
                    }

                    if (b === 1) {
                        //image end
                        break
                    }

                    if (b === 2) {
                        //offset x,y
                        const x = this.bufferView.getUint8(this.pos++)
                        const y = this.bufferView.getUint8(this.pos++)

                        lines += this.bottomUp ? -y : y
                        location += y * this.width * 4 + x * 4
                    } else {
                        for (let i = 0; i < b; i++) {
                            const c = this.bufferView.getUint8(this.pos++)
                            location = this.setPixelData(location, c)
                        }

                        // @ts-ignore
                        const shouldIncrement = b & (1 === 1)
                        if (shouldIncrement) {
                            this.pos++
                        }
                    }
                } else {
                    //encoded mode
                    for (let i = 0; i < a; i++) {
                        location = this.setPixelData(location, b)
                    }
                }
            }
        } else {
            const mode = this.width % 4
            const padding = mode !== 0 ? 4 - mode : 0

            this.scanImage(padding, this.width, (x, line) => {
                const b = this.bufferView.getUint8(this.pos++)
                const location = line * this.width * 4 + x * 4

                if (b < this.palette.length) {
                    const rgb = this.palette[b]

                    this.data[location + this.locAlpha] = 0xff
                    this.data[location + this.locBlue] = rgb.blue
                    this.data[location + this.locGreen] = rgb.green
                    this.data[location + this.locRed] = rgb.red
                }
            })
        }
    }

    private bit16() {
        const padding = (this.width % 2) * 2

        this.scanImage(padding, this.width, (x, line) => {
            const loc = line * this.width * 4 + x * 4
            const px = this.bufferView.getUint16(this.pos, true)
            this.pos += 2

            this.data[loc + this.locRed] = this.shiftRed(px)
            this.data[loc + this.locGreen] = this.shiftGreen(px)
            this.data[loc + this.locBlue] = this.shiftBlue(px)
            this.data[loc + this.locAlpha] = this.shiftAlpha(px)
        })
    }

    private bit24() {
        const padding = this.width % 4

        this.scanImage(padding, this.width, (x, line) => {
            const loc = line * this.width * 4 + x * 4
            const blue = this.bufferView.getUint8(this.pos++)
            const green = this.bufferView.getUint8(this.pos++)
            const red = this.bufferView.getUint8(this.pos++)

            this.data[loc + this.locAlpha] = 0xff
            this.data[loc + this.locBlue] = blue
            this.data[loc + this.locGreen] = green
            this.data[loc + this.locRed] = red
        })
    }

    private bit32() {
        this.scanImage(0, this.width, (x, line) => {
            const loc = line * this.width * 4 + x * 4
            const px = this.readUInt32LE()

            this.data[loc + this.locAlpha] = this.shiftAlpha(px)
            this.data[loc + this.locBlue] = this.shiftBlue(px)
            this.data[loc + this.locGreen] = this.shiftGreen(px)
            this.data[loc + this.locRed] = this.shiftRed(px)
        })
    }

    private scanImage(
        padding = 0,
        width = this.width,
        processPixel: IColorProcessor,
    ) {
        for (let y = this.height - 1; y >= 0; y--) {
            const line = this.bottomUp ? y : this.height - 1 - y

            for (let x = 0; x < width; x++) {
                processPixel.call(this, x, line)
            }

            this.pos += padding
        }
    }

    private readUInt32LE() {
        const value = this.bufferView.getUint32(this.pos, true)
        this.pos += 4
        return value
    }

    private setPixelData(location: number, rgbIndex: number) {
        const {blue, green, red} = this.palette[rgbIndex]

        this.data[location + this.locAlpha] = 0xff
        this.data[location + this.locBlue] = blue
        this.data[location + this.locGreen] = green
        this.data[location + this.locRed] = red

        return location + 4
    }
}

export class BitmapWithPalette extends ImageData {
    readonly palette: IColor[]

    static decode(bitmapData: ArrayBuffer): BitmapWithPalette {
        return new BitmapWithPalette(new BmpDecoder(new DataView(bitmapData), {toRGBA: true}))
    }

    constructor(decoder: BmpDecoder) {
        super(new Uint8ClampedArray(decoder.data), decoder.width, decoder.height)
        this.palette = decoder.palette
    }

    applyAlphaByIndex(alphaIndex: number): BitmapWithPalette {
        if (alphaIndex || alphaIndex === 0) {
            const alphaColor = this.palette?.[alphaIndex] // XXX fails for a102_bigtyre.bmp
            if (alphaColor) {
                const data = this.data
                for (let c = 0; c < data.length; c += 4) {
                    data[c + 3] = alphaColor.red === data[c] && alphaColor.green === data[c + 1] && alphaColor.blue === data[c + 2] ? 0 : 255
                }
            }
        }
        return this
    }

    applyAlpha(): BitmapWithPalette {
        const data = this.data
        for (let n = 0; n < data.length; n += 4) {
            if (data[n] <= 2 && data[n + 1] <= 2 && data[n + 2] <= 2) { // Interface/Reward/RSoxygen.bmp uses 2/2/2 as "black" alpha background
                data[n + 3] = 0
            }
        }
        return this
    }
}
