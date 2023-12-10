import { ScreenMaster } from '../screen/ScreenMaster'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { SelectFilesModal } from '../../site/selectfiles/SelectFilesModal'
import { CabFile } from './fileparser/CabFile'

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

    onFilesSelected(headerUrl: string, volumeUrl1: string, volumeUrl2: string): void {
        this.screenMaster.loadingLayer.setLoadingMessage('Loading installer files from urls...')
        Promise.all<ArrayBuffer>([
            this.loadFileFromUrl(headerUrl),
            this.loadFileFromUrl(volumeUrl1),
            !!volumeUrl2 ? this.loadFileFromUrl(volumeUrl2) : new ArrayBuffer(0),
        ]).then(([cabHeader, cabVolume1, cabVolume2]) => {
            const cabMerge = new Uint8Array(cabVolume1.byteLength + cabVolume2.byteLength)
            cabMerge.set(new Uint8Array(cabVolume1), 0)
            cabMerge.set(new Uint8Array(cabVolume2), cabVolume1.byteLength)
            const cabVolume = cabMerge.buffer
            cachePutData('cabHeader', cabHeader).then()
            cachePutData('cabVolume', cabVolume).then()
            this.onGameFilesLoaded(cabHeader, cabVolume).then()
        })
    }

    async loadGameFiles(): Promise<CabFile> {
        this.screenMaster.loadingLayer.setLoadingMessage('Loading installer files from cache...')
        console.time('Files loaded from cache')
        try {
            const [cabHeader, cabVolume] = await Promise.all<ArrayBuffer>([cacheGetData('cabHeader'), cacheGetData('cabVolume')])
            console.timeEnd('Files loaded from cache')
            if (cabHeader && cabVolume) {
                this.onGameFilesLoaded(cabHeader, cabVolume).then()
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

    async onGameFilesLoaded(cabHeader: ArrayBuffer, cabVolume: ArrayBuffer) {
        console.log('Loading avi file')
        const aviFileContent = intro
        const parser = new AVIParser()
        try {
            const decoders = parser.parse(aviFileContent)
            console.log('decoder', decoders)
            // const frame = decoder.getNextFrame()
            // console.log('frame', frame)
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
