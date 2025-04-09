import { VirtualFileSystem } from './VirtualFileSystem'
import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js'
import { VirtualFile } from './VirtualFile'
import { cachePutData } from '../AssetCacheHelper'
import { SelectFilesProgress } from '../selectfiles/SelectFilesProgress'

export class ZipFileParser {
    constructor(readonly progress: SelectFilesProgress) {
    }

    async readZipFile(vfs: VirtualFileSystem, zipFileContent: Uint8Array): Promise<VirtualFileSystem> {
        console.log('Reading ZIP file...')
        const zipReader = new ZipReader(new Uint8ArrayReader(zipFileContent))
        try {
            const zipEntries = await zipReader.getEntries({
                onprogress: (progress: number, total: number): undefined => {
                    this.progress.setProgress(`Reading ZIP file entries...`, progress, total)
                }
            })
            const wadEntries = zipEntries.filter((e) => !e.directory && !!e.filename.match(/.+\.wad/i))
            await Promise.all(wadEntries.map(async (e) => {
                const lFileName = e.filename.replace('Rock Raiders/', '').toLowerCase()
                const buffer = (await e.getData?.(new Uint8ArrayWriter(), {
                    onprogress: (progress: number, total: number): undefined => {
                        this.progress.setProgress(`Extracting "${e.filename}"...`, progress, total)
                    }
                }))?.buffer as ArrayBuffer // Workaround for https://github.com/gildas-lormeau/zip.js/issues/549
                if (!buffer) throw new Error(`Could not read file buffer for ${lFileName}`)
                vfs.registerFile(VirtualFile.fromBuffer(lFileName, buffer))
                await cachePutData(lFileName, buffer)
            }))
            const dataEntries = zipEntries.filter((e) => !e.directory && !!e.filename.match(/Rock Raiders\/Data/i))
            let progress = 0
            await Promise.all(dataEntries.map(async (e) => {
                const lFileName = e.filename.replace('Rock Raiders/', '').toLowerCase()
                const buffer = (await e.getData?.(new Uint8ArrayWriter()))?.buffer as ArrayBuffer // Workaround for https://github.com/gildas-lormeau/zip.js/issues/549
                if (!buffer) throw new Error(`Could not read file buffer for ${lFileName}`)
                vfs.registerFile(VirtualFile.fromBuffer(lFileName, buffer))
                await cachePutData(lFileName, buffer)
                progress++
                this.progress.setProgress(`Extracting files...`, progress, dataEntries.length)
            }))
            console.log('ZIP file content processed')
            return vfs
        } finally {
            await zipReader.close()
        }
    }
}
