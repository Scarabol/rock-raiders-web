import { ObjectListEntryCfg } from '../../cfg/ObjectListEntryCfg'
import { VirtualFile } from './VirtualFile'

export class WadParser {
    static parseFileList(data: ArrayBufferLike): VirtualFile[] {
        const dataView = new DataView(data)
        const textDecoder = new TextDecoder()
        if (textDecoder.decode(new Uint8Array(data, 0, 4)) !== 'WWAD') {
            throw new Error('Invalid WAD file provided')
        }
        const numberOfEntries = dataView.getInt32(4, true)
        const lEntryNames: string[] = []
        let pos = 8
        let bufferStart = pos
        for (let entryIndex = 0; entryIndex < numberOfEntries; pos++) {
            if (dataView.getUint8(pos) !== 0) continue
            const len = pos - bufferStart
            const array = new Uint8Array(data, bufferStart, len)
            lEntryNames[entryIndex] = textDecoder.decode(array).replace(/\\/g, '/').toLowerCase()
            bufferStart = pos + 1
            entryIndex++
        }
        for (let entryIndex = 0; entryIndex < numberOfEntries; pos++) {
            if (dataView.getUint8(pos) !== 0) continue
            entryIndex++
        }
        const result: VirtualFile[] = []
        for (let entryIndex = 0; entryIndex < numberOfEntries; entryIndex++) {
            const fileLength = dataView.getInt32(pos + 8, true)
            const fileStartOffset = dataView.getInt32(pos + 12, true)
            const buffer = data.slice(fileStartOffset, fileStartOffset + fileLength)
            result.push(new VirtualFile(lEntryNames[entryIndex], buffer))
            pos += 16
        }
        return result
    }

    static parseMap(buffer: Uint8Array) {
        const map: { width: number, height: number, level: number[][] } = {width: buffer[8], height: buffer[12], level: []}
        let row = []
        for (let seek = 16; seek < buffer.length; seek += 2) {
            row.push(buffer[seek])
            if (row.length >= map.width) {
                map.level.push(row)
                row = []
            }
        }
        return map
    }

    static parseObjectList(data: string): Map<string, ObjectListEntryCfg> {
        const lines = data.split('\n')
        const objectList = new Map<string, ObjectListEntryCfg>()
        let currentObject: ObjectListEntryCfg = null
        for (let c = 0; c < lines.length; c++) {
            const line = lines[c].trim()
            const objectStartMatch = line.match(/(.+)\s+{/)
            const drivingMatch = line.match(/driving\s+(.+)/i)
            if (line.length < 1 || line.startsWith(';') || line.match(/\S\*\s*\{/)) {
                // ignore empty lines, comments and the root object
            } else if (objectStartMatch) {
                currentObject = new ObjectListEntryCfg()
                objectList.set(objectStartMatch[1].toLowerCase(), currentObject)
            } else if (line === '}') {
                currentObject = null
            } else if (drivingMatch) {
                currentObject.driving = drivingMatch[1].toLowerCase()
            } else {
                const split = line.split(/\s+/)
                if (split.length !== 2 || currentObject === null) {
                    throw new Error(`Unexpected key value entry: ${line}`)
                }
                const key = split[0]
                let val = split[1]
                if (key === 'xPos' || key === 'yPos' || key === 'heading') {
                    currentObject[key] = parseFloat(val)
                } else if (key === 'type') {
                    currentObject[key] = val
                } else {
                    throw new Error(`Unexpected key value entry: ${line}`)
                }
            }
        }
        return objectList
    }
}
