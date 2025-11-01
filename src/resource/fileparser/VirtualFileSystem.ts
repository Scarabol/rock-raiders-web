import { VirtualFile } from './VirtualFile'

export type VFSEncoding = 'default' | 'windows-1250' | 'windows-1251' | 'windows-1252' | 'windows-1255'

export class VirtualFileSystem {
    readonly files: Map<string, VirtualFile> = new Map()

    constructor(readonly encoding: VFSEncoding = 'default') {
    }

    registerFile(file: VirtualFile) {
        this.files.set(file.lFileName, file)
    }

    getFile(filename: string): VirtualFile {
        const lName = filename.toLowerCase()
        const file = this.files.get(lName)
        if (!file) throw new Error(`File "${filename}" (${lName}) not found`)
        return file
    }

    filterEntryNames(regexStr: string): string[] {
        const regex = new RegExp(regexStr.toLowerCase())
        return Array.from(this.files.keys()).filter((f) => !!f.match(regex))
    }

    hasEntry(entryName: string): boolean {
        return this.files.has(entryName.toLowerCase())
    }

    get fileNames(): string[] {
        return Array.from(this.files.keys())
    }

    dispose(): void {
        this.files.clear()
    }
}
