import { encodeChar } from './EncodingHelper'

export class CfgFileParser {

    static parse(buffer): any {
        const result = {}
        const ancestry = []
        let activeObject = result
        let isComment = false
        let keyVal = 0 // 0 = looking for key, 1 = inside key, 1 = looking for value, 2 = inside value
        let key = ''
        let value = ''
        // debug output is a bad idea here, buffer size is about 232.611 characters and has 6781 lines
        for (let seek = 0; seek < buffer.length; seek++) {
            let charCode = buffer[seek]
            if (charCode === 123 && key === 'FullName') { // dirty workaround but in the original file { (123) was used instead of Ä (142)
                charCode = 142
            }
            let charStr = String.fromCharCode(encodeChar(charCode))
            if (charStr === ';' || charStr === '/') { // someone used // as a marker for a comment
                isComment = true
            } else if (charCode === 10 || charCode === 13) {
                isComment = false
            }
            if (!isComment) {
                if (charCode > 32) { // not a whitespace
                    if (keyVal === 0) { // looking for key
                        if (charStr === '}') {
                            activeObject = ancestry.pop()
                        } else {
                            keyVal++
                            key = charStr
                        }
                    } else if (keyVal === 1) { // inside key
                        key += charStr
                    } else if (keyVal === 2) { // looking for value
                        if (charStr === '{') { // start of a new object key is identifier
                            ancestry.push(activeObject)
                            activeObject = {}
                            ancestry[ancestry.length - 1][key] = activeObject
                            keyVal = 0 // start looking for a key again
                        } else {
                            keyVal++
                            value = charStr
                        }
                    } else if (keyVal === 3) { // inside value
                        value += charStr
                    }
                } else { // some whitespace
                    if (keyVal === 1) {
                        keyVal++
                    } else if (keyVal === 3) {
                        keyVal = 0
                        const parsed = CfgFileParser.parseValue(value)
                        if (activeObject.hasOwnProperty(key)) {
                            activeObject[key].push(parsed)
                        } else {
                            activeObject[key] = [parsed]
                        }
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
            if (val.includes(',')) {
                splitShrink.call(this, ',')
            } else if (val.includes(':')) {
                splitShrink.call(this, ':')
            } else if (val.includes('|')) {
                splitShrink.call(this, '|')
            }
            return val
        } else {
            return num
        }
    }

}
