import { AbstractFormFilesComponent } from './AbstractFormFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'
import { CabFile } from '../fileparser/CabFile'
import { cachePutData } from '../AssetCacheHelper'

export class CabFilesComponent extends AbstractFormFilesComponent {
    constructor() {
        super({
            labelText: 'Use local CAB files usually seen on CD with installer:',
            btnText: 'Start with CAB files',
            fileNames: ['data1.hdr', 'data1.cab'],
        })
    }

    protected async onFilesSelected(vfs: VirtualFileSystem, files: File[]): Promise<void> {
        if (files.length !== 2) throw new Error(`Unexpected number of files (${files.length}) given`)
        const cabHeader = await files[0].arrayBuffer()
        const cabVolume = await files[1].arrayBuffer()
        const cabFile = new CabFile(cabHeader, cabVolume, false).parse()
        const allFiles = await cabFile.loadAllFiles()
        await Promise.all(allFiles.map(async (f) => {
            await cachePutData(f.fileName.toLowerCase(), f.toBuffer())
            vfs.registerFile(f)
        }))
    }
}
