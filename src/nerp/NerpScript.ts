import { NerpRunner } from './NerpRunner'

export class NerpScript {
    lines: string[] = [] // contains human readable script strings
    statements: NerpStatement[] = [] // contains parsed statements for execution
    macrosByName: Map<string, { args: string[], lines: string[] }> = new Map()
    labelsByName: Map<string, number> = new Map()
}

export type NerpReturnType = void | number

export abstract class NerpStatement {
    abstract execute(nerpRunner: NerpRunner): NerpReturnType
}

export class NerpNumber extends NerpStatement {
    constructor(readonly value: number) {
        super()
    }

    execute(): NerpReturnType {
        return this.value
    }
}

export class NerpLabel extends NerpStatement {
    constructor(readonly name: string) {
        super()
    }

    execute(): NerpReturnType {
        // NOP just a number
    }
}

export class NerpJump extends NerpStatement {
    constructor(readonly target: string) {
        super()
    }

    execute(nerpRunner: NerpRunner): NerpReturnType {
        const jumpCounter = nerpRunner.script.labelsByName.get(this.target)
        if (jumpCounter === undefined) throw new Error(`Label '${this.target}' is unknown!`)
        nerpRunner.programCounter = jumpCounter
        if (NerpRunner.debug) console.log(`Jumping to label '${this.target}' in line ${nerpRunner.programCounter}`)
    }
}

export class NerpInvocation extends NerpStatement {
    constructor(readonly functionName: string, readonly args: NerpStatement[]) {
        super()
    }

    execute(nerpRunner: NerpRunner): NerpReturnType {
        const argValues = this.args.map((a) => a.execute(nerpRunner)).filter((v) => {
            const type = typeof v
            const isNum = type === 'number' // actual isNaN does not work for type void
            if (!isNum) console.error(`Invalid argument (${v}) type "${type}" given; number expected`)
            return isNum
        }) as number[]
        const result = nerpRunner.callMethod(this.functionName, argValues) // TODO Whitelist methods
        if (result !== undefined && NerpRunner.debug) {
            console.log(`Method ${this.functionName}(${JSON.stringify(argValues).slice(1, -1)}) returned: ${result}`)
        }
        return result
    }
}

export class NerpConditional extends NerpStatement {
    constructor(readonly check: NerpStatement, readonly truthy: NerpStatement) {
        super()
    }

    execute(nerpRunner: NerpRunner): NerpReturnType {
        if (this.check.execute(nerpRunner)) this.truthy.execute(nerpRunner)
    }
}

export class NerpComparator extends NerpStatement {
    constructor(readonly left: NerpStatement, readonly comparator: '=' | '!=' | '<' | '>', readonly right: NerpStatement) {
        super()
    }

    execute(nerpRunner: NerpRunner): NerpReturnType {
        const left: NerpReturnType = this.left.execute(nerpRunner)
        const right: NerpReturnType = this.right.execute(nerpRunner)
        if (left === undefined || right === undefined) {
            console.error(`Invalid values (${left}, ${right}) given for comparison with ${this.comparator}`)
            return
        }
        if (this.comparator === '=') {
            return left === right ? 1 : 0
        } else if (this.comparator === '!=') {
            return left !== right ? 1 : 0
        } else if (this.comparator === '<') {
            return left < right ? 1 : 0
        } else if (this.comparator === '>') {
            return left > right ? 1 : 0
        } else {
            throw new Error(`Unexpected comparator: ${this.comparator}`)
        }
    }
}
