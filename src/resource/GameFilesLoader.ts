import { LoadingLayer } from '../screen/layer/LoadingLayer'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { SelectFilesModal } from './selectfiles/SelectFilesModal'
import { VirtualFileSystem } from './fileparser/VirtualFileSystem'
import { VirtualFile } from './fileparser/VirtualFile'
import { WadParser } from './fileparser/WadParser'
import { CfgFileParser } from './fileparser/CfgFileParser'
import { GameConfig } from '../cfg/GameConfig'
import { HTML_GAME_CONTAINER } from '../core'

export class GameFilesLoader {
    readonly modal: SelectFilesModal
    readonly onDonePromise: Promise<VirtualFileSystem>
    onDoneCallback?: (vfs: VirtualFileSystem) => void

    constructor(readonly loadingLayer: LoadingLayer) {
        this.modal = new SelectFilesModal(HTML_GAME_CONTAINER, async (vfs) => {
            await cachePutData('vfs', vfs.fileNames)
            this.onGameFilesLoaded(vfs).then()
        })
        this.onDonePromise = new Promise<VirtualFileSystem>((resolve) => {
            this.onDoneCallback = resolve
        })
    }

    async loadGameFiles(): Promise<VirtualFileSystem> {
        this.loadingLayer.setLoadingMessage('Try loading files from cache...')
        console.time('Files loaded from cache')
        try {
            const vfsFileNames: string[] | undefined = await cacheGetData('vfs')
            if (vfsFileNames) {
                const vfs = new VirtualFileSystem()
                await Promise.all(vfsFileNames.map(async (fileName) => {
                    const buffer = await cacheGetData(fileName)
                    vfs.registerFile(VirtualFile.fromBuffer(fileName, buffer))
                }))
                console.timeEnd('Files loaded from cache')
                this.onGameFilesLoaded(vfs).then()
            } else {
                console.log('Files not found in cache')
                this.loadingLayer.setLoadingMessage('Files not found in cache')
                this.modal.show()
            }
        } catch (e) {
            console.error('Error reading files from cache', e)
            this.loadingLayer.setLoadingMessage('Error reading files from cache')
            this.modal.show()
        }
        return this.onDonePromise
    }

    async onGameFilesLoaded(vfs: VirtualFileSystem) {
        vfs.filterEntryNames('.+\\.wad').sort()
            .forEach((f) => WadParser.parseFileList(vfs.getFile(f).toDataView()).forEach((f) => vfs.registerFile(f)))
        this.loadingLayer.setLoadingMessage('Loading configuration...')
        const cfgFiles = vfs.filterEntryNames('\\.cfg')
        if (cfgFiles.length < 1) throw new Error('Invalid second WAD file given! No config file present at root level.')
        if (cfgFiles.length > 1) console.warn(`Found multiple config files ${cfgFiles} will proceed with first one ${cfgFiles[0]} only`)
        const result = CfgFileParser.parse(vfs.getFile(cfgFiles[0]).toArray())
        GameConfig.instance.setFromCfgObj(result, true) // TODO do not create missing
        this.modal.hide()
        this.onDoneCallback?.(vfs)
    }
}
