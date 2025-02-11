import { getFilename } from '../../core/Util'

export class UVData {
    names: string[] = []
    mapNames: string[] = []
    uvs: number[][] = []
}

export class LWOUVParser {
    constructor(readonly verbose: boolean = false) {
    }

    parse(content: string): UVData {
        const result: UVData = new UVData()
        if (this.verbose) console.log(content)
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim())
        if (this.verbose) console.log(lines)
        let fileIndex = 0
        if (lines[fileIndex] !== '2') { // XXX What means 2 in first line?
            throw new Error(`first line is not 2, but ${lines[0]}`)
        }
        fileIndex++
        const numOfMats = parseInt(lines[fileIndex])
        if (this.verbose) console.log(`UV file should contain ${numOfMats} materials`)
        fileIndex++
        for (let c = 0; c < numOfMats; c++) {
            const matName = lines[fileIndex + c]
            if (this.verbose) console.log('Material name is ', matName)
            result.names.push(matName)
        }
        fileIndex += numOfMats
        for (let c = 0; c < numOfMats; c++) {
            const mapName = lines[fileIndex + c]
            if (this.verbose) console.log('Texture map name is ', mapName)
            result.mapNames.push(getFilename(mapName))
        }
        fileIndex += numOfMats
        const numOfCoords = parseInt(lines[fileIndex])
        if (this.verbose) console.log(`Expecting ${numOfCoords} coords`)
        fileIndex++
        for (let c = 0; c < numOfCoords; c++) {
            const tupleLine = lines[fileIndex]
            if (this.verbose) console.log('tupleLine', tupleLine)
            fileIndex++
            const [uvIndex, uvLength] = tupleLine.split(' ').map((n) => parseInt(n))
            result.uvs[uvIndex] = []
            if (this.verbose) console.log(`tuple index is ${uvIndex} and length is ${uvLength}`)
            for (let t = 0; t < uvLength; t++) {
                const uvLine = lines[fileIndex]
                if (this.verbose) console.log(uvLine)
                const [u, v, w] = uvLine.split(' ').map((n) => parseFloat(n))
                if (w !== 0) console.warn(`Unexpected non zero third UV value w = ${w} given`)
                result.uvs[uvIndex].push(u, v)
                fileIndex++
            }
        }
        for (let c = 0; c < numOfMats; c++) {
            const nextLine = lines[fileIndex]
            if (this.verbose) console.log('nextLine', nextLine)
            fileIndex++
            const tupleLength = parseInt(nextLine) // should be always 4
            if (tupleLength !== 4) {
                console.error(`Unexpected tuple length ${tupleLength}`)
                continue
            }
            // OXRot OYRot OZRot
            fileIndex++
            // XRotation YRotation ZRotation
            fileIndex++
            // XPosition YPosition ZPosition
            fileIndex++
            // XScale YScale ZScale
            fileIndex++
        }
        if (this.verbose) console.log(result)
        return result
    }
}
