import { VERBOSE } from '../../params'
import { CfgEntry } from '../../cfg/CfgEntry'

const enum PARSING_STATE {
    LOOKING_FOR_KEY,
    INSIDE_KEY,
    LOOKING_FOR_VALUE,
    INSIDE_VALUE,
}

export type CfgValue = number[]

export interface CfgRecord extends Record<string, CfgRecord | CfgValue[]> {
}

export class CfgFileParser {
    static parse(buffer: Uint8Array): CfgEntry {
        const root: CfgRecord = {}
        const ancestry: CfgRecord[] = []
        let activeObject: CfgRecord = root
        let isComment = false
        let parsingState: PARSING_STATE = PARSING_STATE.LOOKING_FOR_KEY
        let key = ''
        let value: number[] = []
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
                    if (parsingState === PARSING_STATE.LOOKING_FOR_KEY) {
                        if (charCode === '}'.charCodeAt(0)) {
                            const lastElement = ancestry.pop()
                            if (!lastElement) throw new Error('Unexpected end of config ancestry stack')
                            activeObject = lastElement
                        } else {
                            key = String.fromCharCode(charCode)
                            if (key === '!') key = '' // XXX no clue what "!" at start of keys means...
                            parsingState = PARSING_STATE.INSIDE_KEY
                        }
                    } else if (parsingState === PARSING_STATE.INSIDE_KEY) {
                        key += String.fromCharCode(charCode)
                    } else if (parsingState === PARSING_STATE.LOOKING_FOR_VALUE) {
                        if (charCode === '{'.charCodeAt(0) && key !== 'FullName') { // start of a new object key is identifier
                            ancestry.push(activeObject)
                            activeObject = {}
                            ancestry[ancestry.length - 1][key] = activeObject
                            parsingState = PARSING_STATE.LOOKING_FOR_KEY
                        } else {
                            value = [charCode]
                            parsingState = PARSING_STATE.INSIDE_VALUE
                        }
                    } else if (parsingState === PARSING_STATE.INSIDE_VALUE) {
                        value.push(charCode)
                    }
                } else if (charCode === 9 || charCode === 10 || charCode === 13 || charCode === 32) { // some whitespace
                    if (parsingState === PARSING_STATE.INSIDE_KEY) {
                        parsingState = PARSING_STATE.LOOKING_FOR_VALUE
                    } else if (parsingState === PARSING_STATE.INSIDE_VALUE) {
                        if (activeObject.hasOwnProperty(key)) {
                            (activeObject[key] as unknown[]).push(value)
                        } else {
                            activeObject[key] = [value]
                        }
                        parsingState = PARSING_STATE.LOOKING_FOR_KEY
                    }
                } else {
                    throw new Error(`Unexpected character code found ${charCode} in config file`)
                }
            }
        }

        const entries = Object.values(root)
        if (entries.length > 1 && VERBOSE) console.warn(`Config file contains (${entries.length}) objects! Will proceed with first object '${Object.keys(root)[0]}' only`)
        return new CfgEntry(entries[0] as CfgRecord)
    }
}
