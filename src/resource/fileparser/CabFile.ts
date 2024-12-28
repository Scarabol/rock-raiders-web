import { ByteStreamReader } from '../../core/ByteStreamReader'
import Pako from 'pako'
import { cacheGetData } from '../AssetCacheHelper'
import { VirtualFile } from './VirtualFile'

interface CabFileEntry {
    filePathName: string;
    dataOffset: number;
    compressedSize: number;
    expandedSize: number;
    compressed: boolean;
    fileDescriptorOffset: string;
}

interface CabFileGroup {
    name: string;
    firstFile: number;
    lastFile: number;
}

export class CabFile {
    static readonly CAB_SIGNATURE = 0x28635349
    static readonly FALLBACK_MAJOR_VERSION = 5
    static readonly MAX_FILE_GROUP_COUNT = 71
    static readonly FILE_COMPRESSED = 4
    static readonly FILE_INVALID = 8

    readonly volumeReader: ByteStreamReader
    readonly lowerFilePathNameToFile: Map<string, CabFileEntry> = new Map<string, CabFileEntry>()

    constructor(readonly cabHeaderContent: ArrayBuffer, cabVolumeContent: ArrayBuffer, readonly verbose: boolean = false) {
        this.volumeReader = new ByteStreamReader(new DataView(cabVolumeContent))
    }

    parse(): this {
        this.lowerFilePathNameToFile.clear()
        const reader = new ByteStreamReader(new DataView(this.cabHeaderContent))
        const signature = reader.read32()
        if (signature !== CabFile.CAB_SIGNATURE) throw new Error(`File signature ${signature.toString(16)} does not match ${CabFile.CAB_SIGNATURE.toString(16)}`)
        const version = reader.read32()
        if (this.verbose) console.log('version', version)
        const volumeInfo = reader.read32()
        if (this.verbose) console.log('volumeInfo', volumeInfo)
        const cabDescriptorOffset = reader.read32()
        if (this.verbose) console.log('cabDescriptorOffset', cabDescriptorOffset)
        const cabDescriptorSize = reader.read32()
        if (this.verbose) console.log('cabDescriptorSize', cabDescriptorSize)
        const majorVersion = CabFile.versionToMajorVersion(version)
        if (this.verbose) console.log('majorVersion', majorVersion)
        if (majorVersion !== 5) throw new Error(`Unexpected major version; expected 5 got ${majorVersion}`)

        // getCabDescriptor
        reader.seek(cabDescriptorOffset + 0xc)
        const fileTableOffset = reader.read32()
        if (this.verbose) console.log('fileTableOffset', fileTableOffset)
        reader.skip(4)
        const fileTableSize = reader.read32()
        if (this.verbose) console.log('fileTableSize', fileTableSize)
        const fileTableSize2 = reader.read32()
        if (this.verbose) console.log('fileTableSize2', fileTableSize2)
        const directoryCount = reader.read32()
        reader.skip(8)
        const fileCount = reader.read32()
        const fileTableOffset2 = reader.read32()
        if (this.verbose) console.log('fileTableOffset2', fileTableOffset2)

        // assert((p - (header->data + header->common.cab_descriptor_offset)) == 0x30);

        if (fileTableSize !== fileTableSize2) {
            console.warn('File table sizes do not match')
        }

        if (this.verbose) console.log(`Cabinet descriptor: ${fileTableOffset.toString(16)} ${fileTableSize} ${fileTableOffset2.toString(16)} ${fileTableSize2}`)

        if (this.verbose) console.log('Directory count: %i', directoryCount)
        if (this.verbose) console.log('File count: %i', fileCount)

        reader.skip(0xe)

        const fileGroupOffsets: number[] = []
        for (let c = 0; c < CabFile.MAX_FILE_GROUP_COUNT; c++) {
            fileGroupOffsets[c] = reader.read32()
        }
        if (this.verbose) console.log('fileGroupOffsets', fileGroupOffsets)

        // XXX parse component offsets from header

        // getFileTable
        reader.seek(cabDescriptorOffset + fileTableOffset)
        const fileOffsetsTable: number[] = []
        for (let c = 0; c < (directoryCount + fileCount); c++) {
            fileOffsetsTable[c] = reader.read32()
        }

        // XXX Parse components from header

        // getFileGroups
        const fileGroups: CabFileGroup[] = []
        for (let c = 0; c < CabFile.MAX_FILE_GROUP_COUNT; c++) {
            if (!fileGroupOffsets[c]) continue
            const list = {nameOffset: 0, descriptorOffset: 0, nextOffset: fileGroupOffsets[c]}
            while (list.nextOffset) {
                reader.seek(cabDescriptorOffset + list.nextOffset)
                list.nameOffset = reader.read32()
                list.descriptorOffset = reader.read32()
                list.nextOffset = reader.read32()
                if (this.verbose) console.log('File group descriptor offset: ', list.descriptorOffset.toString(16))
                reader.seek(cabDescriptorOffset + list.descriptorOffset)
                const nameOffset = reader.read32()
                reader.seek(cabDescriptorOffset + nameOffset)
                const name = reader.readStringNull()
                if (this.verbose) console.log(`File group name "${name}"`)
                reader.seek(cabDescriptorOffset + list.descriptorOffset + 4 + 0x48)
                const firstFile = reader.read32()
                const lastFile = reader.read32()
                fileGroups.push({name, firstFile, lastFile})
            }
        }
        if (this.verbose) console.log('fileGroups', fileGroups)

        for (let c = 0; c < fileGroups.length; c++) {
            const fileGroup = fileGroups[c]
            for (let i = fileGroup.firstFile; i <= fileGroup.lastFile; i++) {
                const fileDescriptorOffset = cabDescriptorOffset + fileTableOffset + fileOffsetsTable[directoryCount + i]
                reader.seek(fileDescriptorOffset)
                if (this.verbose) console.log(`File descriptor offset ${i}: ${fileDescriptorOffset.toString(16)}`)
                const nameOffset = reader.read32()
                if (!nameOffset) {
                    if (this.verbose) console.error('No name offset given')
                    continue
                }
                const directoryIndex = reader.read32()
                const flags = reader.read16()
                const compressed = !!(flags & CabFile.FILE_COMPRESSED)
                if (!compressed) {
                    if (this.verbose) console.log('file is not compressed')
                } else if (flags & CabFile.FILE_INVALID) {
                    if (this.verbose) console.error('Invalid file skipped')
                    continue
                }
                const expandedSize = reader.read32()
                const compressedSize = reader.read32()
                reader.skip(0x14)
                const dataOffset = reader.read32()
                if (!dataOffset) {
                    if (this.verbose) console.error('No data offset given')
                    continue
                }
                reader.seek(cabDescriptorOffset + fileTableOffset + fileOffsetsTable[directoryIndex])
                const dirname = reader.readStringNull()
                if (this.verbose) console.log('dirname', dirname)
                reader.seek(cabDescriptorOffset + fileTableOffset + nameOffset)
                const filename = reader.readStringNull()
                if (this.verbose) console.log('filename', filename)
                const filePathName = [fileGroup.name, dirname, filename]
                    .filter((s) => !!s)
                    .map((s) => s.replaceAll('\\', '/'))
                    .join('/')
                    .toLowerCase()
                if (this.verbose) console.log(filePathName)
                this.lowerFilePathNameToFile.set(filePathName.toLowerCase(), {
                    filePathName,
                    dataOffset,
                    compressedSize,
                    expandedSize,
                    compressed,
                    fileDescriptorOffset: fileDescriptorOffset.toString(16)
                })
            }
        }

        if (this.verbose) console.log(this.lowerFilePathNameToFile)

        return this
    }

    static versionToMajorVersion(version: number): number {
        if ((version >> 24) === 1) {
            return (version >> 12) & 0xf
        } else if ((version >> 24) === 2 || (version >> 24) === 4) {
            let result = (version & 0xffff)
            if (result !== 0) {
                result = result / 100
            }
            return result
        }
        console.warn(`Could not determine major version using fallback version ${CabFile.FALLBACK_MAJOR_VERSION}`)
        return CabFile.FALLBACK_MAJOR_VERSION
    }

    async loadAllFiles(): Promise<VirtualFile[]> {
        const result: VirtualFile[] = []
        await Promise.all(
            Array.from(this.lowerFilePathNameToFile.keys()).map(async (fileName) => {
                const buffer = await this.getFileBuffer(fileName)
                let mappedFileName: string = fileName
                if (fileName.startsWith('program data files/')) {
                    mappedFileName = fileName.replace('program data files/', '')
                } else if (fileName.startsWith('0009-english files/')) { // TODO Implement language support for CAB files
                    mappedFileName = fileName.replace('0009-english files/', '')
                } else if (fileName.startsWith('0007-german files/')) { // TODO Implement language support for CAB files
                    mappedFileName = fileName.replace('0007-german files/', '')
                } else {
                    return
                }
                result.push(VirtualFile.fromBuffer(mappedFileName, buffer))
            })
        )
        return result
    }

    async getFileBuffer(fileName: string): Promise<ArrayBuffer> {
        if (!fileName) throw new Error('No filename given')
        const lName = fileName.toLowerCase()
        const file = this.lowerFilePathNameToFile.get(lName)
        if (!file) throw new Error(`File "${fileName}" not found`)
        if (this.verbose) console.log(file)
        const cached = await cacheGetData(file.filePathName)
        if (cached) return cached
        const fileData = new Uint8Array(file.expandedSize)
        let offset = 0
        this.volumeReader.seek(file.dataOffset)
        let bytesLeft = file.compressedSize // TODO Which size to use for uncompressed files?
        if (this.verbose) console.log('bytesLeft', bytesLeft)
        while (bytesLeft > 0) {
            const chunkSize = this.volumeReader.read16()
            if (this.verbose) console.log('chunkSize', chunkSize)
            bytesLeft -= 2
            const chunkBuffer = this.volumeReader.readBytes(chunkSize)
            if (this.verbose) console.log('chunkBuffer', chunkBuffer)
            if (file.compressed) {
                const inflated = Pako.inflate(chunkBuffer, {raw: true})
                if (this.verbose) console.log(`Inflated chunk from ${chunkBuffer.byteLength} to ${inflated.byteLength}`)
                fileData.set(inflated, offset)
                offset += inflated.byteLength
            } else {
                console.error('How to handle uncompressed files?', file) // TODO How to handle uncompressed files?
                fileData.set(chunkBuffer, offset)
                offset += chunkBuffer.byteLength
            }
            bytesLeft -= chunkSize
            if (this.verbose) console.log('bytesLeft', bytesLeft)
        }
        return fileData.buffer
    }
}
