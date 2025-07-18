import { createContext, createDummyImgData, getPixel, setPixel } from './ImageHelper'
import { SpriteImage } from './Sprite'

export class BitmapFontData {
    readonly charCodeMap: Map<number, ImageData> = new Map()
    readonly alphaColor: { r: number, g: number, b: number }
    readonly spaceWidth: number

    constructor(fontImageData: ImageData, readonly charHeight: number) {
        if (!fontImageData) throw new Error('No font image data given')
        if (charHeight < 1) throw new Error(`Invalid char height (${charHeight}) given`)
        const cols = 10, rows = Math.floor(fontImageData.height / charHeight)
        // XXX find better way to detect char dimensions
        const maxCharWidth = fontImageData.width / cols
        this.alphaColor = getPixel(fontImageData, 0, 0)

        function isLimiterColor(imgData: ImageData, index: number): boolean {
            // Last pixel in the first row of the first char defines the end of char limiter color (e.g. 255,39,0)
            return imgData.data[index] === fontImageData.data[(maxCharWidth - 1) * 4]
                && imgData.data[index + 1] === fontImageData.data[(maxCharWidth - 1) * 4 + 1]
                && imgData.data[index + 2] === fontImageData.data[(maxCharWidth - 1) * 4 + 2]
        }

        function getActualCharacterWidth(imgData: ImageData) {
            for (let y = 0; y < imgData.height; y++) {
                if (isLimiterColor(imgData, y * 4 * imgData.width)) continue // find non-empty row first
                for (let x = 0; x < maxCharWidth; x++) {
                    if (isLimiterColor(imgData, y * 4 * imgData.width + x * 4)) return x
                }
                return maxCharWidth
            }
            return imgData.width
        }

        for (let i = 0; i < cols * rows; i++) {
            let imgData = this.extractData(fontImageData, (i % 10) * maxCharWidth, Math.floor(i / 10) * this.charHeight, maxCharWidth)
            const actualWidth = getActualCharacterWidth(imgData)
            if (actualWidth > 0) {
                imgData = this.extractData(imgData, 0, 0, actualWidth)
            } else {
                console.warn(`Could not determine actual character width for '${i}'. Adding dummy sprite to letter map`)
                imgData = createDummyImgData(maxCharWidth, this.charHeight)
            }
            this.charCodeMap.set(i + 32, imgData) // Config files use custom encoding with offset (32) to bitmap fonts index
        }

        this.spaceWidth = this.charCodeMap.get(' '.charCodeAt(0))?.width || 10
    }

    extractData(imgData: ImageData, startX: number, startY: number, width: number): ImageData {
        const result = new ImageData(width, this.charHeight)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < this.charHeight; y++) {
                const p = getPixel(imgData, startX + x, startY + y)
                if (p.r === this.alphaColor.r && p.g === this.alphaColor.g && p.b === this.alphaColor.b) p.a = 0 // apply alpha channel
                setPixel(result, x, y, p.r, p.g, p.b, p.a)
            }
        }
        return result
    }
}

export class BitmapFont {
    constructor(readonly data: BitmapFontData) {
    }

    createTextImageData(text: string, maxWidth?: number, autoCenter: boolean = true): ImageData | undefined {
        if (!text) return undefined
        text = text.replace(/_/g, ' ') // TODO All underscores should be replaced in config parsing
        const rows = this.determineRows(text, maxWidth)
        const width = Math.max(1, ...(rows.map(r => r.width)))
        const result = new ImageData(width, this.data.charHeight * (rows.length || 1))
        rows.forEach((row, index) => {
            const rowX = autoCenter ? Math.round((width - row.width) / 2) : 0
            const rowY = index * this.data.charHeight
            let letterX = 0
            for (let c = 0; c < row.text.length; c++) {
                const letterImgData = this.data.charCodeMap.get(row.text.charCodeAt(c))
                if (letterImgData) {
                    for (let x = letterX; x < letterX + letterImgData.width; x++) {
                        for (let y = 0; y < letterImgData.height; y++) {
                            const p = getPixel(letterImgData, x - letterX, y)
                            setPixel(result, rowX + x, rowY + y, p.r, p.g, p.b, p.a)
                        }
                    }
                    letterX += letterImgData.width
                } // missing letter issue already reported above
            }
        })
        return result
    }

    createTextImage(text: string, maxWidth?: number, autoCenter: boolean = true): SpriteImage | undefined {
        if (!text) return undefined
        const result = this.createTextImageData(text, maxWidth, autoCenter)
        if (!result) return undefined
        const img = createContext(result.width, result.height)
        img.putImageData(result, 0, 0)
        return img.canvas
    }

    private determineRows(text: string, maxWidth?: number): { text: string, width: number }[] {
        const rows: { text: string, width: number }[] = []
        let rowText = ''
        let rowWidth = 0
        text.replaceAll('\t', '    ').split(' ').forEach((word) => {
            let wordWidth = 0
            for (let c = 0; c < word.length; c++) {
                const charCode = word.charCodeAt(c)
                const letterImg = this.data.charCodeMap.get(charCode)
                if (letterImg) {
                    wordWidth += letterImg.width
                } else {
                    const letter = word.charAt(c)
                    if (charCode !== 13) { // ignore carriage return
                        console.error(`Ignoring letter '${letter}' (${charCode}) of word "${text}" not found in charset of size ${this.data.charCodeMap.size}!`)
                    }
                }
            }
            if (rowWidth > 0) {
                if (!maxWidth || rowWidth + this.data.spaceWidth + wordWidth < maxWidth) {
                    rowText += ` ${word}`
                    rowWidth += this.data.spaceWidth + wordWidth
                } else {
                    rows.push({text: rowText, width: rowWidth})
                    rowText = word
                    rowWidth = wordWidth
                }
            } else {
                rowText += word
                rowWidth += wordWidth
            }
        })
        if (rowWidth > 0) rows.push({text: rowText, width: rowWidth})
        return rows
    }
}
