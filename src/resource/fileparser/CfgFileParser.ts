import { encodeChar } from './EncodingHelper'
import { VERBOSE } from '../../params'

const enum PARSING_STATE {
    LOOKING_FOR_KEY,
    INSIDE_KEY,
    LOOKING_FOR_VALUE,
    INSIDE_VALUE,
}

export class CfgFileParser {
    static parse(buffer: Uint8Array): object {
        const root = {}
        const ancestry = []
        let activeObject = root
        let isComment = false
        let parsingState: PARSING_STATE = PARSING_STATE.LOOKING_FOR_KEY
        let key = ''
        let value = ''
        // debug output is a bad idea here, buffer size is about 232.611 characters and has 6781 lines
        for (let seek = 0; seek < buffer.length; seek++) {
            const charCode = buffer[seek]
            if (charCode === ';'.charCodeAt(0) || charCode === '/'.charCodeAt(0)) { // someone used // as a marker for a comment
                isComment = true
            } else if (charCode === 10 || charCode === 13) {
                isComment = false
            }
            if (!isComment) {
                if (charCode > 32) { // not a whitespace
                    const charStr = String.fromCharCode(encodeChar[charCode])
                    if (parsingState === PARSING_STATE.LOOKING_FOR_KEY) {
                        if (charCode === '}'.charCodeAt(0)) {
                            activeObject = ancestry.pop()
                        } else {
                            key = charStr
                            parsingState = PARSING_STATE.INSIDE_KEY
                        }
                    } else if (parsingState === PARSING_STATE.INSIDE_KEY) {
                        key += charStr
                    } else if (parsingState === PARSING_STATE.LOOKING_FOR_VALUE) {
                        if (charCode === '{'.charCodeAt(0) && key !== 'FullName') { // start of a new object key is identifier
                            ancestry.push(activeObject)
                            activeObject = {}
                            ancestry[ancestry.length - 1][key] = activeObject
                            parsingState = PARSING_STATE.LOOKING_FOR_KEY
                        } else {
                            value = charStr
                            parsingState = PARSING_STATE.INSIDE_VALUE
                        }
                    } else if (parsingState === PARSING_STATE.INSIDE_VALUE) {
                        value += charStr
                    }
                } else if (charCode === 9 || charCode === 10 || charCode === 13 || charCode === 32) { // some whitespace
                    if (parsingState === PARSING_STATE.INSIDE_KEY) {
                        parsingState = PARSING_STATE.LOOKING_FOR_VALUE
                    } else if (parsingState === PARSING_STATE.INSIDE_VALUE) {
                        // XXX Only decode when necessary in the first place
                        const encoded = key !== 'FullName' ? value.replaceAll('Å', '|') : value // Revert decoding if not (German) level name
                        const parsed = CfgFileParser.parseValue(encoded, key !== 'FullName')
                        if (activeObject.hasOwnProperty(key)) {
                            activeObject[key].push(parsed)
                        } else {
                            activeObject[key] = [parsed]
                        }
                        parsingState = PARSING_STATE.LOOKING_FOR_KEY
                    }
                } else {
                    throw new Error(`Unexpected character code found ${charCode} in config file`)
                }
            }
        }

        const stack = [root]
        while (stack.length > 0) {
            const obj = stack.pop()
            Object.keys(obj).forEach((key) => {
                const val = obj[key]
                if (Array.isArray(val)) {
                    if (val.length === 1) {
                        obj[key] = val[0]
                    } else {
                        val.forEach((sub) => stack.push(sub))
                    }
                } else if (Object.keys(val).length > 1) {
                    stack.push(val)
                }
            })
        }

        const entries = Object.values(root)
        if (entries.length > 1 && VERBOSE) console.warn(`Config file contains (${entries.length}) objects! Will proceed with first object '${Object.keys(root)[0]}' only`)
        const result = entries[0] as object

        // apply some patches here
        Object.values(result['Levels']).forEach((levelConf) => {
            if (levelConf['CryoreMap']) {
                levelConf['CryOreMap'] = levelConf['CryoreMap']  // typos... typos everywhere
                delete levelConf['CryoreMap']
            }
            if (levelConf['CryOreMap']) {
                levelConf['CryOreMap'] = levelConf['CryOreMap'].replace('Cryo_', 'Cror_')
            }
            if (levelConf['PredugMap']) {
                levelConf['PreDugMap'] = levelConf['PredugMap']
                delete levelConf['PredugMap']
            }
            const textureSet = levelConf['TextureSet']
            if (Array.isArray(textureSet) && Array.isArray(textureSet[1])) {
                levelConf['TextureSet'] = textureSet[1]
            }
        })
        const dependencies = result['Dependencies']
        Object.keys(dependencies).forEach((key) => {
            const flatDeps = []
            dependencies[key].forEach((d) => {
                if (Array.isArray(d)) {
                    flatDeps.push(...d)
                } else {
                    flatDeps.push(d)
                }
            })
            dependencies[key] = flatDeps.reduce((result, value, index, array) => {
                if (index % 2 === 0)
                    result.push(array.slice(index, index + 2))
                return result
            }, [])
        })
        return result
    }

    static parseValue(val, isNoLevelName: boolean) {
        function splitShrink(sep) {
            val = val.split(sep).filter(val => val !== '').map(val => CfgFileParser.parseValue(val, isNoLevelName))
            if (val.length === 0) {
                val = ''
            } else if (val.length === 1) {
                val = val[0]
            }
        }

        const num = Number(val)
        if (isNaN(num)) {
            val = val.toString().replace(/\\/g, '/')
            const lVal = val.toLowerCase()
            if (lVal === 'true') return true
            if (lVal === 'false') return false
            if (lVal === 'null') return ''
            const hasReference = val.includes('::') // XXX actually these are references to other paths in the cfg file
            if (val.includes(':') && !hasReference && isNoLevelName) { // XXX Dependencies uses separator , over : however icon panel entries use : over , and French/Spanish use both characters in their level names
                splitShrink.call(this, /:+/)
            } else if (val.includes(',') && isNoLevelName) {
                splitShrink.call(this, ',')
            } else if (val.includes('|')) {
                splitShrink.call(this, '|')
            } else if (hasReference) {
                val = val.split(/:+/)[1]
            }
            return val
        } else {
            return num
        }
    }
}
