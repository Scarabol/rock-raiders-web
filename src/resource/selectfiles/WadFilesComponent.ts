import { AbstractFormFilesComponent } from './AbstractFormFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'
import { VirtualFile } from '../fileparser/VirtualFile'
import { cachePutData } from '../AssetCacheHelper'

export class WadFilesComponent extends AbstractFormFilesComponent {
    constructor() {
        super({
            labelText: 'Use local WAD files usually seen with mods:',
            btnText: 'Start with WAD files',
            fileNames: ['RR0.wad', 'RR1.wad'],
        })
    }

    protected async onFilesSelected(vfs: VirtualFileSystem, files: File[]): Promise<void> {
        await Promise.all(files.map(async (file) => {
            const lFileName = file.name.toLowerCase()
            const buffer = await file.arrayBuffer()
            vfs.registerFile(VirtualFile.fromBuffer(lFileName, buffer))
            await cachePutData(lFileName, buffer)
        }))
    }
}
