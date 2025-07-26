import { VirtualFileSystem } from './VirtualFileSystem'
import { Entry, FileEntry, Uint8ArrayReader, ZipReader } from '@zip.js/zip.js'
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
            const wadEntries = zipEntries.filter(ZipFileParser.isWadFileEntry)
            await Promise.all(wadEntries.map(async (e) => {
                const lFileName = e.filename.replace('Rock Raiders/', '').toLowerCase()
                const buffer = await e.arrayBuffer({
                    onprogress: (progress: number, total: number): undefined => {
                        this.progress.setProgress(`Extracting "${e.filename}"...`, progress, total)
                    }
                })
                if (!buffer) throw new Error(`Could not read file buffer for ${lFileName}`)
                vfs.registerFile(VirtualFile.fromBuffer(lFileName, buffer))
                await cachePutData(lFileName, buffer)
            }))
            const dataEntries = zipEntries.filter(ZipFileParser.isDataFileEntry)
            let progress = 0
            await Promise.all(dataEntries.map(async (e) => {
                const lFileName = e.filename.replace('Rock Raiders/', '').toLowerCase()
                const buffer = await e.arrayBuffer()
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

    private static isWadFileEntry(entry: Entry): entry is FileEntry {
        return !entry.directory && !!entry.filename.match(/.+\.wad/i)
    }

    private static isDataFileEntry(entry: Entry): entry is FileEntry {
        return !entry.directory && !!entry.filename.match(/Rock Raiders\/Data/i)
    }
}
