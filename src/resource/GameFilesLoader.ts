import { ScreenMaster } from '../screen/ScreenMaster'
import { cacheGetData } from './AssetCacheHelper'
import { SelectFilesModal } from '../../site/selectfiles/SelectFilesModal'
import { CabFile } from './fileparser/CabFile'
import { VirtualFileSystem } from './fileparser/VirtualFileSystem'
import { VirtualFile } from './fileparser/VirtualFile'
import { WadFileParser } from './fileparser/WadFileParser'

export class GameFilesLoader {
    readonly modal: SelectFilesModal
    readonly onDonePromise: Promise<VirtualFileSystem>
    onDoneCallback: (vfs: VirtualFileSystem) => void

    constructor(readonly screenMaster: ScreenMaster) {
        this.modal = new SelectFilesModal('game-container')
        this.modal.onCabFilesSelected = this.onCabFilesSelected.bind(this)
        this.onDonePromise = new Promise<VirtualFileSystem>((resolve) => {
            this.onDoneCallback = resolve
        })
    }

    async onCabFilesSelected(headerUrl: string, volumeUrl1: string, volumeUrl2: string) {
        this.screenMaster.loadingLayer.setLoadingMessage('Loading CAB files from urls...')
        const [cabHeader, cabVolume1, cabVolume2] = await Promise.all<ArrayBuffer>([
            this.loadFileFromUrl(headerUrl),
            this.loadFileFromUrl(volumeUrl1),
            !!volumeUrl2 ? this.loadFileFromUrl(volumeUrl2) : new ArrayBuffer(0),
        ])
        const cabMerge = new Uint8Array(cabVolume1.byteLength + cabVolume2.byteLength)
        cabMerge.set(new Uint8Array(cabVolume1), 0)
        cabMerge.set(new Uint8Array(cabVolume2), cabVolume1.byteLength)
        const cabVolume = cabMerge.buffer
        const cabFile = new CabFile(cabHeader, cabVolume, false).parse()
        const vfs = await cabFile.loadAllFiles()
        this.onGameFilesLoaded(vfs)
    }

    async loadGameFiles(): Promise<VirtualFileSystem> {
        this.screenMaster.loadingLayer.setLoadingMessage('Try loading files from cache...')
        console.time('Files loaded from cache')
        try {
            const vfsFileNames: string[] = await cacheGetData('vfs')
            if (vfsFileNames) {
                const vfs = new VirtualFileSystem()
                await Promise.all(vfsFileNames.map(async (f) => {
                    const buffer = await cacheGetData(f)
                    const vFile = new VirtualFile(buffer)
                    vfs.registerFile(f, vFile)
                }))
                console.timeEnd('Files loaded from cache')
                this.onGameFilesLoaded(vfs)
            } else {
                console.log('Files not found in cache')
                this.screenMaster.loadingLayer.setLoadingMessage('Files not found in cache')
                this.modal.show()
            }
        } catch (e) {
            console.error('Error reading files files from cache', e)
            this.screenMaster.loadingLayer.setLoadingMessage('Error reading files files from cache')
            this.modal.show()
        }
        return this.onDonePromise
    }

    onGameFilesLoaded(vfs: VirtualFileSystem) {
        const wadFiles = vfs.filterEntryNames('.+\\.wad')
        wadFiles.sort()
        console.log(`Loading WAD files in order like ${wadFiles}`)
        wadFiles.forEach((wadFileName) => {
            WadFileParser.parse(vfs, vfs.getFile(wadFileName).buffer)
        })
        this.modal.hide()
        this.onDoneCallback(vfs)
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
