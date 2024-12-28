import { VirtualFile } from './VirtualFile'
import { ByteStreamReader } from '../../core/ByteStreamReader'
import { CabFile } from './CabFile'
import { VERBOSE } from '../../params'

export class IsoFileParser {
    readonly files: VirtualFile[] = []
    readonly reader: ByteStreamReader
    logicalBlockSize: number = 2048

    constructor(readonly buffer: ArrayBuffer) {
        this.reader = new ByteStreamReader(new DataView(buffer))
    }

    async loadAllFiles(): Promise<VirtualFile[]> {
        console.time('Parsing ISO file directory entries')
        for (let offset = 32 * 1024; offset < this.buffer.byteLength; offset += 2048) { // skip first 32 kB for system area
            this.reader.seek(offset)
            const volumeDescriptorTypeCode = this.reader.read8()
            if (volumeDescriptorTypeCode === VolumeDescriptorTypeCode.PRIMARY_VOLUME_DESCRIPTOR) {
                this.reader.seek(offset + 128)
                this.logicalBlockSize = this.reader.read16()
                if (this.logicalBlockSize !== 2048) console.warn(`Unexpected logical block size (${this.logicalBlockSize})`)
                this.reader.seek(offset + 132)
                this.readDirectoryEntry(offset + 156, '') // start reading root directory entry
            } else if (volumeDescriptorTypeCode === VolumeDescriptorTypeCode.SUPPLEMENTARY_VOLUME_DESCRIPTOR) {
                if (VERBOSE) console.warn('Parsing supplementary volume descriptor not yet implemented')
            } else if (volumeDescriptorTypeCode === VolumeDescriptorTypeCode.VOLUME_DESCRIPTOR_SET_TERMINATOR) {
                break
            } else {
                console.warn(`Unexpected ISO volume descriptor type code ${volumeDescriptorTypeCode}`)
            }
        }
        console.timeEnd('Parsing ISO file directory entries')
        console.time('Extracting CAB files from ISO file listing')
        const fileNames = this.files.map((f) => f.fileName)
        const cabHeaderFile = this.files.find((f) => f.fileName === 'data1.hdr')
        if (!cabHeaderFile) throw new Error(`Invalid ISO file without data1.hdr file given in ${fileNames.join(', ')}`)
        const cabVolumeFile = this.files.find((f) => f.fileName === 'data1.cab')
        if (!cabVolumeFile) throw new Error(`Invalid ISO file without data1.cab file given in ${fileNames.join(', ')}`)
        console.timeEnd('Extracting CAB files from ISO file listing')
        console.time('Parsing CAB header and volume files')
        const cabFile = new CabFile(cabHeaderFile.toBuffer(), cabVolumeFile.toBuffer()).parse()
        console.timeEnd('Parsing CAB header and volume files')
        console.time('Loading all files from CAB file listing')
        const cabFiles = await cabFile.loadAllFiles()
        console.timeEnd('Loading all files from CAB file listing')
        return [...this.files, ...cabFiles]
    }

    readDirectoryEntry(offset: number, parentName: string) {
        this.reader.seek(offset)
        const lenDirRecord = this.reader.read8()
        if (lenDirRecord < 1) return
        this.reader.read8() // Extended Attribute Record Length
        const locExt = this.reader.read32()
        this.reader.seek(offset + 10)
        const dataLen = this.reader.read32()
        this.reader.seek(offset + 25)
        const flags = this.reader.read8()
        const isDirectory = !!(flags & 0x2)
        this.reader.seek(offset + 32)
        const lenFileIdentifier = this.reader.read8()
        const fileIdentifierRaw = this.reader.readString(lenFileIdentifier).toLowerCase()
        const firstCharCode = fileIdentifierRaw.charCodeAt(0)
        const indexDelimiter = fileIdentifierRaw.indexOf(';')
        const fileIdentifier = firstCharCode === 0 ? '.' : (firstCharCode === 1 ? '..' : (indexDelimiter >= 0 ? fileIdentifierRaw.slice(0, indexDelimiter) : fileIdentifierRaw))
        const filePathIdentifier = [parentName, fileIdentifier].filter((n) => !!n).join('/')
        const startOffset = locExt * this.logicalBlockSize
        const filename = filePathIdentifier.startsWith('./') ? filePathIdentifier.slice(2) : filePathIdentifier
        if (!isDirectory) {
            this.files.push(VirtualFile.fromBuffer(filename, this.buffer.slice(startOffset, startOffset + dataLen)))
        }
        if (lenFileIdentifier % 2 === 0) this.reader.skip(1) // padding
        if (isDirectory && (parentName === '' || fileIdentifier !== '.') && fileIdentifier !== '..') {
            this.readDirectoryEntry(startOffset, filePathIdentifier)
        }
        this.readDirectoryEntry(offset + lenDirRecord, parentName)
    }
}

enum VolumeDescriptorTypeCode {
    PRIMARY_VOLUME_DESCRIPTOR = 1,
    SUPPLEMENTARY_VOLUME_DESCRIPTOR = 2,
    VOLUME_DESCRIPTOR_SET_TERMINATOR = 255,
}
