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

    static parseObjectList(data: string) {
        const lines = data.split('\n')
        const objectList = []
        let currentObject = null
        for (let c = 0; c < lines.length; c++) {
            const line = lines[c].trim()
            const objectStartMatch = line.match(/(.+)\s+{/)
            const drivingMatch = line.match(/driving\s+(.+)/)
            if (line.length < 1 || line.startsWith(';') || line.startsWith('Lego*')) {
                // ignore empty lines, comments and the root object
            } else if (objectStartMatch) {
                currentObject = {}
                objectList[objectStartMatch[1]] = currentObject
            } else if (line === '}') {
                currentObject = null
            } else if (drivingMatch) {
                currentObject.driving = drivingMatch[1]
            } else {
                const split = line.split(/\s+/)
                if (split.length !== 2 || currentObject === null) {
                    throw new Error('Unexpected key value entry: ' + line)
                }
                const key = split[0]
                let val: any = split[1]
                if (key === 'xPos' || key === 'yPos' || key === 'heading') {
                    val = parseFloat(val)
                } else if (key !== 'type') {
                    throw new Error('Unexpected key value entry: ' + line)
                }
                currentObject[key] = val
            }
        }
        return objectList
    }

}
