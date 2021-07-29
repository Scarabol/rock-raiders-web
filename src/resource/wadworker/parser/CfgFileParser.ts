import { encodeChar } from './EncodingHelper'

const enum PARSING_STATE {
    LOOKING_FOR_KEY,
    INSIDE_KEY,
    LOOKING_FOR_VALUE,
    INSIDE_VALUE,
}

export class CfgFileParser {
    static parse(buffer): any {
        const result = {}
        const ancestry = []
        let activeObject = result
        let isComment = false
        let parsingState: PARSING_STATE = PARSING_STATE.LOOKING_FOR_KEY
        let key = ''
        let value = ''
        // debug output is a bad idea here, buffer size is about 232.611 characters and has 6781 lines
        for (let seek = 0; seek < buffer.length; seek++) {
            let charCode = buffer[seek]
            if (charCode === 123 && key === 'FullName') { // dirty workaround but in the original file { (123) was used instead of Ä (142)
                charCode = 142
            }
            let charStr = String.fromCharCode(encodeChar[charCode])
            if (charStr === ';' || charStr === '/') { // someone used // as a marker for a comment
                isComment = true
            } else if (charCode === 10 || charCode === 13) {
                isComment = false
            }
            if (!isComment) {
                if (charCode > 32) { // not a whitespace
                    if (parsingState === PARSING_STATE.LOOKING_FOR_KEY) {
                        if (charStr === '}') {
                            activeObject = ancestry.pop()
                        } else {
                            key = charStr
                            parsingState = PARSING_STATE.INSIDE_KEY
                        }
                    } else if (parsingState === PARSING_STATE.INSIDE_KEY) {
                        key += charStr
                    } else if (parsingState === PARSING_STATE.LOOKING_FOR_VALUE) {
                        if (charStr === '{') { // start of a new object key is identifier
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
                } else { // some whitespace
                    if (parsingState === PARSING_STATE.INSIDE_KEY) {
                        parsingState = PARSING_STATE.LOOKING_FOR_VALUE
                    } else if (parsingState === PARSING_STATE.INSIDE_VALUE) {
                        const parsed = CfgFileParser.parseValue(value)
                        if (activeObject.hasOwnProperty(key)) {
                            activeObject[key].push(parsed)
                        } else {
                            activeObject[key] = [parsed]
                        }
                        parsingState = PARSING_STATE.LOOKING_FOR_KEY
                    }
                }
            }
        }

        const stack = [result]
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

        // apply some patches here
        Object.values(result['Lego*']['Levels']).forEach((levelConf) => {
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
        const dependencies = result['Lego*']['Dependencies']
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

        return result['Lego*']
    }

    static parseValue(val) {
        function splitShrink(sep) {
            val = val.split(sep).filter(val => val !== '').map(val => CfgFileParser.parseValue(val))
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
            if (val.includes(':')) { // XXX Dependencies uses separator , over : however icon panel entries use : over ,
                splitShrink.call(this, ':')
            } else if (val.includes(',')) {
                splitShrink.call(this, ',')
            } else if (val.includes('|')) {
                splitShrink.call(this, '|')
            }
            return val
        } else {
            return num
        }
    }
}
