import { VirtualFile } from './VirtualFile'

export class VirtualFileSystem {
    readonly files: Map<string, VirtualFile> = new Map()

    registerFile(file: VirtualFile) {
        this.files.set(file.fileName.toLowerCase(), file)
    }

    getFile(filename: string): VirtualFile {
        const lName = filename.toLowerCase()
        const file = this.files.get(lName)
        if (!file) throw new Error(`File "${filename}" (${lName}) not found`)
        return file
    }

    filterEntryNames(regexStr: string) {
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
