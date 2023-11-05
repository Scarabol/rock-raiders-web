import { ObjectListEntryCfg } from '../../cfg/ObjectListEntryCfg'

export class WadParser {
    static parseMap(buffer: Uint8Array) {
        const map = {width: buffer[8], height: buffer[12], level: []}
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
        let currentObject = null
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
                let val: any = split[1]
                if (key === 'xPos' || key === 'yPos' || key === 'heading') {
                    val = parseFloat(val)
                } else if (key !== 'type') {
                    throw new Error(`Unexpected key value entry: ${line}`)
                }
                currentObject[key] = val
            }
        }
        return objectList
    }
}
