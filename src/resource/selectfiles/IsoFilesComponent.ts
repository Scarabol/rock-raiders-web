import { AbstractFormFilesComponent } from './AbstractFormFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'
import { IsoFileParser } from '../fileparser/IsoFileParser'
import { cachePutData } from '../AssetCacheHelper'

export class IsoFilesComponent extends AbstractFormFilesComponent {
    constructor() {
        super({
            labelHTML: 'Use local CD provided as ISO file <b>(no background music)</b>:',
            btnText: 'Start with ISO file',
            fileNames: ['Rock Raiders.iso'],
        })
    }

    protected async onFilesSelected(vfs: VirtualFileSystem, files: File[]): Promise<void> {
        if (files.length !== 1) throw new Error(`Unexpected number of files (${files.length}) given`)
        const isoFileBuffer = await files[0].arrayBuffer()
        const isoFile = new IsoFileParser(isoFileBuffer)
        const allFiles = await isoFile.loadAllFiles()
        await Promise.all(allFiles.map(async (f) => {
            if (f.fileName.equalsIgnoreCase('data1.hdr') || f.fileName.equalsIgnoreCase('data1.cab')) return // only cache unpacked files
            await cachePutData(f.fileName.toLowerCase(), f.toBuffer())
            vfs.registerFile(f)
        }))
    }
}
