/**
 * creates a new context with the specified dimensions.
 * @param width: the desired width of the new context
 * @param height: the desired height of the new context
 * @returns RenderingContext the newly created canvas
 */
export function createContext(width, height): SpriteContext {
    if (width < 1 || height < 1) {
        console.error('Can\'t create context with size ' + width + ' x ' + height)
        return createDummyContext(64, 64)
    }
    let canvas
    if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas')
        canvas.setAttribute('width', width)
        canvas.setAttribute('height', height)
    } else {
        canvas = new OffscreenCanvas(width, height)
    }
    const context = canvas.getContext('2d')
    context.width = width
    context.height = height
    return context
}

/**
 * This method is intended to increase stability by providing an (ugly) placeholder image in case the right one is missing
 * @param width: expected width of the original image
 * @param height: expected height of the original image
 */
export function createDummyContext(width, height): SpriteContext {
    const result = createContext(width, height)
    for (let y = 0; y < height; y += 16) {
        for (let x = 0; x < width; x += 16) {
            if (x / 16 % 2 === y / 16 % 2) {
                result.fillStyle = 'rgb(0,255,255)'
            } else {
                result.fillStyle = 'rgb(255,0,255)'
            }
            result.fillRect(x, y, 16, 16)
        }
    }
    return result
}

export function createDummyImgData(width, height): ImageData {
    const result = new ImageData(width, height)
    for (let y = 0; y < height; y += 16) {
        for (let x = 0; x < width; x += 16) {
            const e = x / 16 % 2 === y / 16 % 2
            for (let px = x; px < x + 16; px++) {
                for (let py = y; py < y + 16; py++) {
                    setPixel(result, px, py, e ? 0 : 255, e ? 255 : 0, 255)
                }
            }
        }
    }
    return result
}

export function setPixel(imgData, x, y, r, g, b, a = 255): void {
    const n = (y * imgData.width + x) * 4
    imgData.data[n] = r
    imgData.data[n + 1] = g
    imgData.data[n + 2] = b
    imgData.data[n + 3] = a
}

export function getPixel(imgData, x, y): { r: number, g: number, b: number, a: number } {
    const n = (y * imgData.width + x) * 4
    return {r: imgData.data[n], g: imgData.data[n + 1], b: imgData.data[n + 2], a: imgData.data[n + 3]}
}
