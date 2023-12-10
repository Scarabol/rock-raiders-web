import { ScreenMaster } from '../screen/ScreenMaster'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { SelectFilesModal } from '../../site/selectfiles/SelectFilesModal'
import { CabFile } from './fileparser/CabFile'
import { AVIParser } from './fileparser/AVIParser'
import { imgDataToCanvas } from '../core/ImageHelper'
import { getElementByIdOrThrow } from '../core/Util'

export class GameFilesLoader {
    readonly modal: SelectFilesModal
    readonly onDonePromise: Promise<CabFile>
    onDoneCallback: (cabFile: CabFile) => void

    constructor(readonly screenMaster: ScreenMaster) {
        this.modal = new SelectFilesModal('game-container', this.onFilesSelected.bind(this))
        this.onDonePromise = new Promise<CabFile>((resolve) => {
            this.onDoneCallback = resolve
        })
    }

    onFilesSelected(headerUrl: string, volumeUrl1: string, volumeUrl2: string, introUrl: string): void {
        this.screenMaster.loadingLayer.setLoadingMessage('Loading installer files from urls...')
        Promise.all<ArrayBuffer>([
            this.loadFileFromUrl(headerUrl),
            this.loadFileFromUrl(volumeUrl1),
            !!volumeUrl2 ? this.loadFileFromUrl(volumeUrl2) : new ArrayBuffer(0),
            !!introUrl ? this.loadFileFromUrl(introUrl) : new ArrayBuffer(0),
        ]).then(([cabHeader, cabVolume1, cabVolume2, intro]) => {
            const cabMerge = new Uint8Array(cabVolume1.byteLength + cabVolume2.byteLength)
            cabMerge.set(new Uint8Array(cabVolume1), 0)
            cabMerge.set(new Uint8Array(cabVolume2), cabVolume1.byteLength)
            const cabVolume = cabMerge.buffer
            cachePutData('cabHeader', cabHeader).then()
            cachePutData('cabVolume', cabVolume).then()
            cachePutData('intro', intro).then()
            this.onGameFilesLoaded(cabHeader, cabVolume, intro).then()
        })
    }

    async loadGameFiles(): Promise<CabFile> {
        this.screenMaster.loadingLayer.setLoadingMessage('Loading installer files from cache...')
        console.time('Files loaded from cache')
        try {
            const [cabHeader, cabVolume, intro] = await Promise.all<ArrayBuffer>([cacheGetData('cabHeader'), cacheGetData('cabVolume'), cacheGetData('intro')])
            console.timeEnd('Files loaded from cache')
            if (cabHeader && cabVolume) {
                this.onGameFilesLoaded(cabHeader, cabVolume, intro).then()
            } else {
                console.log('Installer files not found in cache')
                this.screenMaster.loadingLayer.setLoadingMessage('Installer files not found in cache')
                this.modal.show()
            }
        } catch (e) {
            console.error('Error reading installer files files from cache', e)
            this.screenMaster.loadingLayer.setLoadingMessage('Error reading installer files files from cache')
            this.modal.show()
        }
        return this.onDonePromise
    }

    async onGameFilesLoaded(cabHeader: ArrayBuffer, cabVolume: ArrayBuffer, intro: ArrayBuffer) {
        console.log('Loading avi file')
        const aviFileContent = intro
        const parser = new AVIParser()
        try {
            const decoders = parser.parse(aviFileContent)
            console.log('decoder', decoders)
            // const frame = decoder.getNextFrame()
            // console.log('frame', frame)
            const parent = getElementByIdOrThrow('game-canvas-container')
            const target = document.createElement('canvas')
            target.width = 640
            target.height = 480
            parent.replaceChildren(target)
            // setInterval(() => {
                const context = target.getContext('2d')
                const imageData = decoders.videoDecoder.getNextFrame()
                const canvas = imgDataToCanvas(imageData)
                context.drawImage(canvas, 0, 0, 640, 480)
            // }, 1000 / 14.9)
            // FIXME render video frames on canvas then proceed to main menu
            // const cabFile = new CabFile(cabHeader, cabVolume, false).parse()
            // this.modal.hide()
            // this.onDoneCallback(cabFile)
        } catch (e) {
            console.error(e)
        }
    }

    async loadFileFromUrl(url: string): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            console.log(`Loading file from ${url}`)
            const xhr = new XMLHttpRequest()
            xhr.open('GET', url)
            xhr.responseType = 'arraybuffer'
            xhr.onprogress = (event) => this.modal.setProgress(url, event.loaded, event.total)
            xhr.onerror = (event) => reject(event)
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(xhr.response)
                } else {
                    reject(new Error(`Could not fetch file from "${url}" Got status ${xhr.status} - ${xhr.statusText}`))
                }
            }
            xhr.send()
        })
    }
}
