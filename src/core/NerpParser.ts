import { EntityManager } from '../game/EntityManager'
import { ResourceManager } from '../resource/ResourceManager'
import { NerpRunner } from './NerpRunner'

export class NerpParser {

    static parse(entityMgr: EntityManager, nerpScript: string): NerpRunner {
        const nerpRunner = new NerpRunner(entityMgr)
        const lines = nerpScript.split('\n').map(l => l
            .split('//')[0].trim() // before comment starts
            .split(';')[0].trim() // before preprocessor comment starts
            .replace(/_/g, '') // some preprocessor macros use this prefix
            .replace(/\bTRUE \? /, '') // some weird requirement of the original language
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
                const includedRunner = NerpParser.parse(entityMgr, ResourceManager.getResource('Levels/' + includeName))
                if (!includedRunner || !includedRunner.scriptLines || includedRunner.scriptLines.length < 1) {
                    throw new Error('Can\'t include unknown nerp script: ' + line)
                }
                nerpRunner.scriptLines = nerpRunner.scriptLines.concat(includedRunner.scriptLines)
                // copy macros from included file to current file
                nerpRunner.macrosByName = Object.assign({}, nerpRunner.macrosByName, includedRunner.macrosByName)
            } else if (line.startsWith('#define ')) { // parse C++ preprocessor macro
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
                nerpRunner.macrosByName[macroCall[0]] = {
                    args: macroCall[1].replace(/\)$/, '').split(','),
                    lines: macroLines,
                }
            } else {
                nerpRunner.scriptLines = nerpRunner.scriptLines.concat(this.replaceMacros(nerpRunner.macrosByName, line))
            }
        }
        // somewhat precompile the script and create syntax tree
        // must be done in separate block to make sure the script is complete and we can refer/rely on line numbers for label jumps
        for (let c = 0; c < nerpRunner.scriptLines.length; c++) {
            const line = nerpRunner.scriptLines[c]
            nerpRunner.statements[c] = line.replace(/\(\)/g, '') // now the macros are applied and obsolete empty "()" can be removed
                .split(' ? ')
            const labelMatch = line.match(/(\S+):/)
            if (nerpRunner.statements[c].length === 2) { // line contains condition (primary operator)
                nerpRunner.statements[c] = {
                    invoke: 'conditional',
                    args: [this.preProcess(nerpRunner.statements[c][0]), this.preProcess(nerpRunner.statements[c][1])],
                }
            } else if (labelMatch) { // keep label line number for later usage
                const labelName = labelMatch[1].toLowerCase()
                nerpRunner.labelsByName[labelName] = c
                nerpRunner.statements[c] = {label: labelName}
            } else if (nerpRunner.statements[c].length === 1) { // just a call
                nerpRunner.statements[c] = this.preProcess(nerpRunner.statements[c][0])
            } else { // lines contains more than 1 condition statement
                throw new Error('Can\'t deal with line: ' + line)
            }
        }
        return nerpRunner
    }

    static replaceMacros(macrosByName, line): string[] {
        // check if this line contains a macro
        const split = line.split('(') // not a very stable check though...
        const macro = macrosByName[split[0]]
        if (macro) {
            const argValues = split.splice(1).join('(').slice(0, -1).split(',')
            if (argValues.length !== macro.args.length) {
                throw new Error('Invalid number of args provided for macro in line ' + line)
            }
            const macroLines = []
            macro.lines.forEach((line) => {
                for (let c = 0; c < argValues.length; c++) {
                    line = line.replace(new RegExp('\\b' + macro.args[c] + '\\b'), argValues[c])
                }
                macroLines.push(...(this.replaceMacros(macrosByName, line)))
            })
            return macroLines
        } else {
            return [line]
        }
    }

    static preProcess(expression) {
        expression = expression.trim().replace(/^_/, '') // remove whitespace and leading underscore
        const number = parseInt(expression)
        if (!isNaN(number)) {
            return number
        }
        const opSplit = expression.split(/ (=) | (!=) | (>) | (<) /).filter(e => e !== undefined)
        const brackets = expression.match(/^(.+)\((.+)\)$/)
        const spaceSplit = expression.split(' ')
        const labelMatch = expression.match(/([^:]+):$/)
        const jumpMatch = expression.match(/^:([^:]+)$/)
        if (opSplit.length === 3) { // expression contains secondary operator
            return {left: this.preProcess(opSplit[0]), comparator: opSplit[1], right: this.preProcess(opSplit[2])}
        } else if (brackets) {
            const args = brackets[2].split(',').map(a => this.preProcess(a))
            return {invoke: brackets[1], args: args}
        } else if (spaceSplit.length > 1) { // space split must be the very last since most expressions contain space
            const args = spaceSplit.length === 2 ? [this.preProcess(spaceSplit[1])] : spaceSplit.splice(1).map(a => this.preProcess(a))
            return {invoke: spaceSplit[0], args: args}
        } else if (labelMatch) { // label definition
            return {label: labelMatch[1]}
        } else if (jumpMatch) { // jump to label
            return {jump: jumpMatch[1].toLowerCase()}
        } else { // function call without args
            if (expression.match(/[ =?><!]/)) {
                throw new Error('Invalid expression given, parsing must have failed before somewhere')
            }
            return {invoke: expression, args: []}
        }
    }

}
