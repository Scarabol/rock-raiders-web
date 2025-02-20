import { FFmpeg, LogEvent } from '@ffmpeg/ffmpeg'
import { VERBOSE } from '../../../params'
import ffmpegCore from '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js?url'
import ffmpegWasm from '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm?url'
import { cacheGetData, cachePutData } from '../../AssetCacheHelper'

export class FFmpegWasm {
    private static readonly SEGMENT_LENGTH = 2 // Changing this will invalidate transcoded parts in caches
    readonly ffmpeg: Promise<FFmpeg>

    constructor() {
        this.ffmpeg = this.setup()
    }

    async setup(): Promise<FFmpeg> {
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

    async writeFile(fileName: string, fileData: ArrayBuffer): Promise<void> {
        const ffmpeg = await this.ffmpeg
        await ffmpeg.writeFile(fileName, new Uint8Array<ArrayBuffer>(fileData))
    }

    async getDuration(fileName: string): Promise<number> {
        const ffmpeg = await this.ffmpeg
        await ffmpeg.ffprobe([
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            fileName,
            '-o',
            'info.json',
        ])
        const infoDataFile = await ffmpeg.readFile('info.json') as Uint8Array
        this.deleteIgnoreError('info.json')
        const infoDataString = String.fromCharCode(...infoDataFile)
        return Number(infoDataString)
    }

    async transcodeSegment(videoFileName: string, segmentNum: number): Promise<Uint8Array<ArrayBuffer>> {
        const outputFilePath = `${videoFileName}-${(FFmpegWasm.SEGMENT_LENGTH)}-${segmentNum}.mp4`
        const fromCache = await cacheGetData(outputFilePath) as ArrayBuffer
        if (fromCache) return new Uint8Array(fromCache)
        const ffmpeg = await this.ffmpeg
        await ffmpeg.exec([
            '-ss', (segmentNum * FFmpegWasm.SEGMENT_LENGTH).toString(),
            '-to', ((segmentNum + 1) * FFmpegWasm.SEGMENT_LENGTH).toString(),
            '-i', videoFileName,
            '-segment_format_options', 'movflags=frag_keyframe+empty_moov+default_base_moof',
            '-segment_time', FFmpegWasm.SEGMENT_LENGTH.toString(),
            '-segment_start_number', segmentNum.toString(),
            '-f', 'segment',
            '-profile:v', 'baseline', '-level', '3.0',
            `${videoFileName}-${(FFmpegWasm.SEGMENT_LENGTH)}-%d.mp4`, // TODO Actually prefer WEBM over MP4; blocked by https://github.com/ffmpegwasm/ffmpeg.wasm/pull/824
        ])
        const fileData = await ffmpeg.readFile(outputFilePath) as Uint8Array<ArrayBuffer>
        this.deleteIgnoreError(outputFilePath)
        cachePutData(outputFilePath, fileData.buffer).then()
        return fileData
    }

    deleteAll(...fileExtensions: string[]) {
        this.ffmpeg.then((ffmpeg) => {
            ffmpeg.listDir('/').then((list) => {
                list.forEach((l) => {
                    if (!l.isDir) {
                        const lName = l.name.toLowerCase()
                        if (fileExtensions.some((e) => lName.endsWith(e))) {
                            this.deleteIgnoreError(l.name)
                        }
                    }
                })
            })
        })
    }

    deleteIgnoreError(fileName: string): void {
        this.ffmpeg.then((ffmpeg) => {
            ffmpeg.deleteFile(fileName).then().catch(() => {
            })
        })
    }
}
