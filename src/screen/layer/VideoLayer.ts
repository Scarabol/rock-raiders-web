import { AbstractLayer } from './AbstractLayer'
import { cacheGetData } from '../../resource/AssetCacheHelper'
import { SpriteImage } from '../../core/Sprite'
import { getFilename } from '../../core/Util'
import { FFmpegWasm } from '../../resource/fileparser/avi/FFmpegWasm'
import { createContext } from '../../core/ImageHelper'

export class VideoLayer extends AbstractLayer {
    readonly video: HTMLVideoElement
    readonly ffmpeg: FFmpegWasm
    currentVideo?: () => void

    constructor() {
        super()
        this.video = document.createElement('video')
        this.video.setAttribute('data-layer-class', this.constructor.name)
        this.video.style.visibility = 'hidden'
        this.video.autoplay = true
        this.video.onended = () => {
            this.hide()
        }
        this.ffmpeg = new FFmpegWasm()
        this.addEventListener('pointerup', (): boolean => {
            if (!this.video.controls) this.hide()
            return true
        })
    }

    get element(): HTMLElement {
        return this.video
    }

    async playVideo(videoFilePath: string): Promise<void> {
        if (this.currentVideo) {
            console.log('Already playing video')
            return
        } else if (!videoFilePath) {
            console.warn('No video file path given')
            return
        }
        videoFilePath = videoFilePath.toLowerCase()
        if (!videoFilePath.endsWith('.avi')) {
            console.error(`Unsupported video file format "${videoFilePath}"`)
            return
        }
        const videoData = await cacheGetData(videoFilePath) as ArrayBuffer
        if (!videoData) {
            console.warn(`Video data for ${videoFilePath} not found in cache`)
            return
        }
        this.show()

        const videoFileName = getFilename(videoFilePath)
        await this.ffmpeg.writeFile(videoFileName, videoData)

        const duration = await this.ffmpeg.getDuration(videoFileName)

        let currentSegment = 0
        const mediaSource = new MediaSource()
        mediaSource.addEventListener('sourceopen', async () => {
            try {
                const sourceBuf = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42001e, mp4a.40.2"')
                sourceBuf.mode = 'sequence'
                sourceBuf.addEventListener('updateend', async () => {
                    try {
                        if (!this.active || sourceBuf.timestampOffset >= duration) {
                            mediaSource.endOfStream()
                            return
                        }
                        const nextData = await this.ffmpeg.transcodeSegment(videoFileName, currentSegment)
                        if (!this.active) return
                        currentSegment++
                        sourceBuf.appendBuffer(nextData)
                    } catch (e) {
                        console.error('error adding segment', e)
                        this.hide()
                    }
                })
                const firstData = await this.ffmpeg.transcodeSegment(videoFileName, currentSegment)
                mediaSource.duration = duration
                currentSegment++
                sourceBuf.appendBuffer(firstData)
            } catch (e) {
                console.error('error appending buffer', e)
                this.hide()
            }
        })
        this.video.src = URL.createObjectURL(mediaSource)
        this.video.play().then().catch((e) => {
            console.warn('Could not autoplay video', e)
            this.video.controls = true
            this.video.onplay = () => {
                this.video.controls = false
            }
        })
        return new Promise((resolve) => {
            this.currentVideo = resolve
        })
    }

    resize(width: number, height: number) {
        this.video.width = width
        this.video.height = height
    }

    hide() {
        super.hide()
        this.video.pause()
        this.video.src = ''
        this.video.controls = false
        if (this.currentVideo) {
            this.currentVideo()
            this.currentVideo = undefined
        }
        this.ffmpeg.deleteAll('.avi', '.mp4')
    }

    takeScreenshotFromLayer(): Promise<SpriteImage> {
        const context = createContext(this.video.width, this.video.height)
        context.drawImage(this.video, 0, 0)
        return Promise.resolve(context.canvas)
    }
}
