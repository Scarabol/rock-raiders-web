import { FFFSType, FFmpeg, LogEvent } from '@ffmpeg/ffmpeg'
import { VERBOSE } from '../../../params'
import ffmpegCore from '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js?url'
import ffmpegWasm from '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm?url'
import { cacheGetData, cachePutData } from '../../AssetCacheHelper'

export class FFmpegWasm {
    private static readonly SEGMENT_LENGTH = 2 // Changing this will invalidate transcoded parts in caches

    private async loadFFmpeg(): Promise<FFmpeg> {
        // FFmpeg stops working after mulitiple calls of exec (memory leak)
        const ffmpeg = new FFmpeg()
        ffmpeg.on('log', (arg: LogEvent) => {
            if (VERBOSE) console.log(arg)
        })
        await ffmpeg.load({
            coreURL: ffmpegCore,
            wasmURL: ffmpegWasm,
        })
        return ffmpeg
    }

    async transcodeAudio(videoFileName: string, videoFileData: ArrayBuffer): Promise<ArrayBuffer> {
        const outputFilePath = `${videoFileName}-audio.webm`
        const fromCache = await cacheGetData<ArrayBuffer>(outputFilePath)
        if (fromCache !== undefined) return fromCache
        const ffmpeg = await this.loadFFmpeg()
        try {
            await ffmpeg.createDir('/input')
            ffmpeg.mount(FFFSType.WORKERFS, {files: [new File([videoFileData], videoFileName)]}, '/input')
            const returnCode = await ffmpeg.exec([
                '-i', `/input/${videoFileName}`,
                '-vn',
                '-c:a', 'libopus', '-compression_level', '0',
                '-dash', '1',
                `/${outputFilePath}`,
            ])
            if (returnCode !== 0) {
                throw new Error(`FFmpeg returned non-zero exit status: ${returnCode}`)
            }
            const fileData = (await ffmpeg.readFile(outputFilePath) as Uint8Array<ArrayBuffer>).buffer
            cachePutData(outputFilePath, fileData).then()
            return fileData
        } finally {
            ffmpeg.terminate()
        }
    }

    async transcodeVideoSegment(videoFileName: string, videoFileData: ArrayBuffer, segmentNum: number): Promise<ArrayBuffer |  null> {
        const outputFilePath = `${videoFileName}-video-${(FFmpegWasm.SEGMENT_LENGTH)}-${segmentNum}.mp4`
        const fromCache = await cacheGetData<ArrayBuffer | null>(outputFilePath)
        if (fromCache !== undefined) return fromCache
        const ffmpeg = await this.loadFFmpeg()
        try {
            await ffmpeg.createDir('/input')
            ffmpeg.mount(FFFSType.WORKERFS, {files: [new File([videoFileData], videoFileName)]}, '/input')
            let isEmpty = false
            ffmpeg.on('log', ({type, message}) => {
                if (type === 'stderr' && message.match(/^video:0kB audio:0kB /)) {
                    isEmpty = true
                }
            })
            const returnCode = await ffmpeg.exec([
                '-ss', (segmentNum * FFmpegWasm.SEGMENT_LENGTH).toString(),
                '-to', ((segmentNum + 1) * FFmpegWasm.SEGMENT_LENGTH).toString(),
                '-i', `/input/${videoFileName}`,
                '-c:v', 'libx264', '-preset', 'ultrafast',
                '-profile:v', 'baseline', '-level', '3.0',
                '-an',
                '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
                `/${outputFilePath}`,
            ])
            if (returnCode !== 0) {
                throw new Error(`FFmpeg returned non-zero exit status: ${returnCode}`)
            }
            const fileData = isEmpty ? null : (await ffmpeg.readFile(outputFilePath) as Uint8Array<ArrayBuffer>).buffer
            cachePutData(outputFilePath, fileData).then()
            return fileData
        } finally {
            ffmpeg.terminate()
        }
    }
}
