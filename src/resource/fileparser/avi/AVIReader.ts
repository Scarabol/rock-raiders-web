import { ByteStreamReader } from '../../../core/ByteStreamReader'
import { AVIParser } from './AVIParser'

export interface AVIItem {
    chunkType: string
    reader: AVIReader
}

export class AVIReader extends ByteStreamReader {
    readFourCC(): string {
        return this.readString(4)
    }

    readItem(): AVIItem {
        const chunkType: string = this.skipJunk()
        if (!chunkType) return null
        const chunkLength = this.read32()
        const dataEnd = this.offset + chunkLength
        const reader = new AVIReader(this.dataView, this.offset, dataEnd)
        this.offset = dataEnd
        this.offset += this.offset % 2 // padded to WORD boundary
        return {chunkType, reader}
    }

    private skipJunk(): string {
        let chunkType: string = null
        while (this.hasMoreData()) {
            chunkType = this.readFourCC()
            if (chunkType === AVIParser.CHUNK_TYPE_JUNK) {
                const chunkLength = this.read32()
                this.offset += chunkLength
                this.offset += this.offset % 2 // padded to WORD boundary
            } else {
                break
            }
        }
        return chunkType
    }

    readList(expectedListType: string): AVIReader {
        const list = this.readItem()
        if (list?.chunkType !== AVIParser.CHUNK_TYPE_LIST) throw new Error(`Unexpected chunk type; got ${list?.chunkType} instead of ${AVIParser.CHUNK_TYPE_LIST}`)
        const listType = list.reader.readFourCC()
        if (listType !== expectedListType) throw new Error(`Unexpected list type; got ${listType} instead of ${expectedListType}`)
        return list.reader
    }

    forEachItem(callback: (item: AVIItem) => void): void {
        let item = this.readItem()
        while (item) {
            callback(item)
            item = this.readItem()
        }
    }
}
