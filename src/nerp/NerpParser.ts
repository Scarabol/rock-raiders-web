import { ResourceManager } from '../resource/ResourceManager'
import { NerpComparator, NerpConditional, NerpInvocation, NerpJump, NerpLabel, NerpNumber, NerpScript, NerpStatement } from './NerpScript'
import { isNum } from '../core/Util'

export class NerpParser {
    static parse(nerpScriptFile: string): NerpScript {
        const nerpScriptContent = ResourceManager.getResource(nerpScriptFile)
        if (!nerpScriptContent) {
            throw new Error(`Can't parse unknown nerp script: ${nerpScriptFile}`)
        }
        const result = new NerpScript()
        const lines = nerpScriptContent.split('\n').map((l: string) => l
            .split('//')[0].trim() // before comment starts
            .split(';')[0].trim() // before preprocessor comment starts
            .replace(/_/g, '') // some preprocessor macros use this prefix
            .replace(/\bTRUE \? /, '') // some weird requirement of the original language
            .replace(/\bFALSE \? .+/, '') // XXX Why did they add NOP statements?
            .replace(/[{}]/g, ''), // duplicate limit for macros using labels too
        )
        for (let c = 0; c < lines.length; c++) {
            const line = lines[c]
            if (line.length < 1) {
                continue // ignore empty lines, but important for macro closure
            }
            if (line.startsWith('#include ')) { // include other nerp scripts/headers
                const includeName = line.replace(/^#include /, '').trim().slice(1, -1)
                if (includeName === 'nerpdef.h') {
                    // trivial default header file, is applied by search and replace above
                    // see https://github.com/jgrip/legorr/blob/master/nerpdef.h
                    continue
                }
                const includedScript = NerpParser.parse(`Levels/${includeName}`)
                if (!includedScript || !includedScript.lines || includedScript.lines.length < 1) {
                    throw new Error(`Can't include unknown nerp script: ${line}`)
                }
                result.lines = result.lines.concat(includedScript.lines)
                // copy macros from included file to current file
                result.macrosByName = new Map([...result.macrosByName, ...includedScript.macrosByName])
            } else if (line.startsWith('#define ')) { // parse C++ style preprocessor macro
                const firstLine = line.replace(/^#define /, '').split(' ')
                const macroLines = [firstLine.splice(1).join(' ').replace(/\\$/, '').trim()]
                let mLine = line
                let append = false
                while (mLine.endsWith('\\') && c < lines.length - 1) {
                    c++
                    mLine = lines[c].trim()
                    const macroLine = mLine.replace(/\\$/, '').trim()
                    if (macroLine.length > 0) {
                        if (append) {
                            append = false
                            macroLines[macroLines.length - 1] += macroLine
                        } else {
                            macroLines.push(macroLine)
                        }
                    }
                    if (mLine.match(/:\\$/)) {
                        append = true
                    }
                }
                const macroCall = firstLine[0].split('(')
                result.macrosByName.set(macroCall[0], {
                    args: macroCall[1].replace(/\)$/, '').split(','),
                    lines: macroLines,
                })
            } else {
                result.lines = result.lines.concat(this.replaceMacros(result.macrosByName, line))
            }
        }
        // somewhat precompile the script and create syntax tree
        // must be done in separate block to make sure the script is complete, and we can refer/rely on line-numbers for label jumps
        result.statements = result.lines.map((line, c) => {
            const statement = line
                .replace(/\(\)/g, '') // now the macros are applied and obsolete empty "()" can be removed
                .split(' ? ')
            const labelMatch = line.match(/(\S+):/)
            if (statement.length === 2) { // line contains condition (primary operator)
                return new NerpConditional(this.readStatement(statement[0]), this.readStatement(statement[1]))
            } else if (labelMatch) { // keep label line number for later usage
                const labelName = labelMatch[1].toLowerCase()
                result.labelsByName.set(labelName, c)
                return new NerpLabel(labelName)
            } else if (statement.length === 1) { // just a call
                return this.readStatement(statement[0])
            } else { // line contains more than 1 condition statement
                throw new Error(`Can't deal with line: ${line}`)
            }
        })
        return result
    }

    private static replaceMacros(macrosByName: Map<string, { args: string[], lines: string[] }>, line: string): string[] {
        // check if this line contains a macro
        line = line.replace('goto(jump)', ':jump') // XXX Remove this workaround for level 14
        const split = line.split('(') // not a very stable check though...
        const macro = macrosByName.get(split[0])
        if (macro) {
            const argValues = split.splice(1).join('(').slice(0, -1).split(',')
            if (argValues.length !== macro.args.length) {
                throw new Error(`Invalid number of args provided for macro in line ${line}`)
            }
            const macroLines: string[] = []
            macro.lines.forEach((line) => {
                for (let c = 0; c < argValues.length; c++) {
                    line = line.replace(new RegExp(`\\b${macro.args[c]}\\b`), argValues[c])
                }
                macroLines.push(...(this.replaceMacros(macrosByName, line)))
            })
            return macroLines
        } else {
            return [line]
        }
    }

    private static readStatement(expression: string): NerpStatement {
        expression = expression.trim().replace(/^_/, '') // remove whitespace and leading underscore
        const number = parseInt(expression)
        if (isNum(number)) return new NerpNumber(number)
        const opSplit = expression.split(/ (=) | (!=) | (>) | (<) /).filter(e => e !== undefined)
        const brackets = expression.match(/^(.+)\((.+)\)$/)
        const spaceSplit = expression.split(' ')
        const labelMatch = expression.match(/([^:]+):$/)
        const jumpMatch = expression.match(/^:([^:]+)$/)
        if (opSplit.length === 3) { // expression contains secondary operator
            const op = opSplit[1] as '=' | '!=' | '<' | '>'
            return new NerpComparator(this.readStatement(opSplit[0]), op, this.readStatement(opSplit[2]))
        } else if (brackets) {
            const args: NerpStatement[] = brackets[2].split(',').map(a => this.readStatement(a))
            return new NerpInvocation(brackets[1], args)
        } else if (spaceSplit.length > 1) { // space split must be the very last since most expressions contain space
            const args = spaceSplit.length === 2 ? [this.readStatement(spaceSplit[1])] : spaceSplit.splice(1).map(a => this.readStatement(a))
            return new NerpInvocation(spaceSplit[0], args)
        } else if (labelMatch) { // label definition
            return new NerpLabel(labelMatch[1])
        } else if (jumpMatch) { // jump to label
            return new NerpJump(jumpMatch[1].toLowerCase())
        } else { // function call without args
            if (expression.match(/[ =?><!]/)) {
                throw new Error('Invalid expression given, parsing must have failed before somewhere')
            }
            return new NerpInvocation(expression, [])
        }
    }
}
