import { createContext, createDummyImgData, getPixel, setPixel } from './ImageHelper'
import { SpriteImage } from './Sprite'

export class BitmapFontData {
    letterMap: Map<string, ImageData> = new Map()

    constructor(fontImageData: ImageData, maxCharWidth: number, readonly charHeight: number) {
        // actually chars are font dependent and have to be externalized in future
        // maybe CP850 was used... not sure, doesn't fit...
        const chars = [' ', '!', '"', '#', '$', '%', '⌵', '`', '(', ')',
            '*', '+', ',', '-', '.', '/', '0', '1', '2', '3',
            '4', '5', '6', '7', '8', '9', ':', ';', '<', '=',
            '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
            'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
            'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[',
            '\\', ']', '^', '_', '\'', 'a', 'b', 'c', 'd', 'e',
            'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
            'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
            'z', 'Ä', 'Å', 'Á', 'À', 'Â', 'Ã', 'Ą', 'ä', 'å',
            'á', 'à', 'â', 'ã', 'ą', 'Ë', 'E̊', 'É', 'È', 'É',
            'Ę', 'ë', 'e̊', 'é', 'è', 'e̊', 'ę̊', '', '', '',
            '', '', '', '', '', 'Ö', '', '', '', '',
            'ö', '', '', '', '', 'Ü', '', '', '', 'ü',
            '', '', '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '', '', '',
            '', '', '', 'ß', '', '', '', 'Ñ', '', 'ñ',
            '',
        ] // XXX complete this character list

        function isLimiterColor(imgData: ImageData, index: number): boolean {
            // Last pixel in the first row defines the end of char limiter color (e.g. 255,39,0)
            return imgData.data[index] === imgData.data[(imgData.width - 1) * 4]
                && imgData.data[index + 1] === imgData.data[(imgData.width - 1) * 4 + 1]
                && imgData.data[index + 2] === imgData.data[(imgData.width - 1) * 4 + 2]
        }

        function getActualCharacterWidth(imgData: ImageData) {
            for (let y = 0; y < imgData.height; y++) {
                if (isLimiterColor(imgData, y * 4 * imgData.width)) continue // find non-empty row first
                for (let x = 0; x < maxCharWidth; x++) {
                    if (isLimiterColor(imgData, x * 4)) return x
                }
                return maxCharWidth
            }
            return imgData.width
        }

        for (let i = 0; i < chars.length; i++) {
            let imgData = this.extractData(fontImageData, (i % 10) * maxCharWidth, Math.floor(i / 10) * this.charHeight, maxCharWidth, this.charHeight)
            const actualWidth = getActualCharacterWidth(imgData)
            if (actualWidth > 0) {
                imgData = this.extractData(imgData, 0, 0, actualWidth, this.charHeight)
            } else {
                imgData = createDummyImgData(maxCharWidth, this.charHeight)
            }
            this.letterMap.set(chars[i], imgData)
        }
    }

    extractData(imgData: ImageData, startX: number, startY: number, width: number, height: number): ImageData {
        const alpha = getPixel(imgData, startX + width - 1, startY + height - 1)
        const result = new ImageData(width, height)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const p = getPixel(imgData, startX + x, startY + y)
                if (p.r === alpha.r && p.g === alpha.g && p.b === alpha.b) p.a = 0 // apply alpha channel
                setPixel(result, x, y, p.r, p.g, p.b, p.a)
            }
        }
        return result
    }
}

export class BitmapFont {
    data: BitmapFontData

    constructor(data: BitmapFontData) {
        this.data = data
    }

    createTextImage(text: string, maxWidth?: number, autoCenter: boolean = true): SpriteImage {
        if (!text) return null
        text = text.replace(/_/g, ' ')
        const rows = this.determineRows(text, maxWidth)
        const width = Math.max(...(rows.map(r => r.width)))
        const result = new ImageData(width, this.data.charHeight * rows.length)
        rows.forEach((row, index) => {
            const rowX = autoCenter ? Math.round((width - row.width) / 2) : 0
            const rowY = index * this.data.charHeight
            let letterX = 0
            for (let c = 0; c < row.text.length; c++) {
                const letterImgData = this.data.letterMap.get(row.text.charAt(c))
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
        const img = createContext(result.width, result.height)
        img.putImageData(result, 0, 0)
        return img.canvas
    }

    private determineRows(text: string, maxWidth?: number): { text: string, width: number }[] {
        const spaceWidth = this.data.letterMap.get(' ').width
        const rows: { text: string, width: number }[] = []
        let rowText = ''
        let rowWidth = 0
        text.split(' ').map(word => {
            let wordWidth = 0
            for (let c = 0; c < word.length; c++) {
                const letter = word.charAt(c)
                const letterImg = this.data.letterMap.get(letter)
                if (letterImg) {
                    wordWidth += letterImg.width
                } else {
                    console.error(`Letter '${letter}' not found in charset! Ignoring it`)
                }
            }
            if (rowWidth > 0) {
                if (!maxWidth || rowWidth + spaceWidth + wordWidth < maxWidth) {
                    rowText += ` ${word}`
                    rowWidth += spaceWidth + wordWidth
                } else {
                    rows.push({text: rowText, width: rowWidth})
                    rowText = word
                    rowWidth = wordWidth
                }
            } else {
                rowText += word
                rowWidth += wordWidth
            }
            return wordWidth
        })
        if (rowWidth > 0) rows.push({text: rowText, width: rowWidth})
        return rows
    }
}
