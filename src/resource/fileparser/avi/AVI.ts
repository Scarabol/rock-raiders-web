// see https://learn.microsoft.com/en-us/windows/win32/directshow/avi-riff-file-reference

export interface AVIMainHeader {
    streams: number
    flags: number
    suggestedBufferSize: number
    width: number
    initialFrames: number
    microSecPerFrame: number
    paddingGranularity: number
    maxBytesPerSec: number
    totalFrames: number
    height: number
}

export interface AVIStreamHeader {
    fccType: string
    flags: number
    start: number
    length: number
    suggestedBufferSize: number
    scale: number
    language: number
    priority: number
    sampleSize: number
    quality: number
    rate: number
    fccHandler: string
    initialFrames: number
    frame: { top: number; left: number; bottom: number; right: number }
}

export interface AVIVideoFormat {
    biHeight: number
    biSize: number
    biSizeImage: number
    biWidth: number
    biCompression: number
    biClrUsed: number
    biClrImportant: number
    biBitCount: number
    biXPelsPerMeter: number
    biPlanes: number
    biYPelsPerMeter: number
}
