export function grayscaleToGreen(imgData: ImageData): ImageData {
    const arr = imgData.data
    for (let c = 0; c < arr.length; c += 4) {
        arr[c] = 0
        arr[c + 2] = 0
    }
    return imgData
}
