/** Function documentation mostly copied from the following URLs
 *
 * https://kb.rockraidersunited.com/User:Jessietail/NERPs_reference
 * https://web.archive.org/web/20131206122442/http://rru-stuff.org/nerpfuncs.html
 * https://kb.rockraidersunited.com/NERPs_documentation#Labels
 *
 */
import { EventBus } from '../event/EventBus'
import { NerpMessage } from '../event/LocalEvents'
import { EntityManager } from '../game/EntityManager'
import { EntityType } from '../game/model/EntityType'
import { GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { NerpParser } from './NerpParser'
import { NerpScript } from './NerpScript'

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class NerpRunner {
    readonly script: NerpScript
    debug = false

    timer: number = 0
    registers = new Array(8).fill(0)
    timers = new Array(4).fill(0)
    halted = false
    programCounter = 0
    messages: { txt: string, snd: string }[] = []
    // more state variables and switches
    messagePermit: boolean = null

    constructor(nerpScriptFile: string, readonly entityMgr: EntityManager) {
        this.script = NerpParser.parse(nerpScriptFile)
        this.checkSyntax()
    }

    update(elapsedMs: number) {
        for (this.timer += elapsedMs; this.timer >= 2000; this.timer -= 2000) {
            this.execute()
        }
    }

    /**
     * Internally used to validate and parse a register number.
     * @param register
     * @return {number}
     */
    checkRegister(register) {
        const num = parseInt(register)
        if (isNaN(num) || num < 0 || num > this.registers.length) throw new Error(`Invalid register (${register}) provided`)
        return num
    }

    /**
     * Internally used to validate and parse a value before setting or adding it with a register.
     * @param value
     * @return {number}
     */
    checkRegisterValue(value) {
        const num = parseInt(value)
        if (isNaN(num)) throw new Error(`Invalid register value (${value}) provided`)
        return num
    }

    /**
     * Gets the value currently stored in the given register, internally used to handle all registers with one method.
     * @param register the register to read
     * @return {number} returns the value currently stored in the register
     */
    getR(register) {
        register = this.checkRegister(register)
        return this.registers[register]
    }

    /**
     * Sets the given value for the given register, internally used to handle all registers with one method.
     * @param register the register to set
     * @param value the value to set for the given register
     */
    setR(register, value) {
        register = this.checkRegister(register)
        value = this.checkRegisterValue(value)
        this.registers[register] = value
    }

    /**
     * Adds the given value to the given register, internally used to handle all registers with one method.
     * @param register the register to add to
     * @param value the value to add to the given register
     */
    addR(register, value) {
        register = this.checkRegister(register)
        value = this.checkRegisterValue(value)
        this.registers[register] += value
    }

    /**
     * Subtracts the given value from the given register, internally used to handle all registers with one method.
     * @param register the register to subtract from
     * @param value the value to subtract from the given register
     */
    subR(register, value) {
        register = this.checkRegister(register)
        value = this.checkRegisterValue(value)
        this.registers[register] -= value
    }

    /**
     * Set the respective timer to the given numerical value. Units are in milliseconds.
     * @param timer
     * @param value
     */
    setTimer(timer, value) {
        const num = parseInt(value)
        if (isNaN(num)) throw new Error(`Can't set timer to NaN value: ${value}`)
        this.timers[timer] = new Date().getTime() + num
    }

    /**
     * Gets the value of the respective timer. Units are in milliseconds.
     * @param timer
     * @return {number}
     */
    getTimer(timer) {
        return new Date().getTime() - this.timers[timer]
    }

    /**
     * End the level successfully and show the score screen.
     */
    setLevelCompleted() {
        console.log('Nerp runner marks level as complete')
        this.halted = true
        GameState.gameResult = GameResultState.COMPLETE
    }

    /**
     * End the level as failure and show the score screen.
     */
    setLevelFail() {
        console.log(`NerpRunner marks level as failed; at line: ${this.script.lines[this.programCounter]}`)
        this.halted = true
        GameState.gameResult = GameResultState.FAILED
    }

    /**
     * Sets tutorial flags
     * @param value a bitmask to set flags with
     */
    setTutorialFlags(value) {
        // seems like value must be interpreted bitwise and sets a certain flag on each bit
        // seen so far:
        // 0 = 0x00 allow any click anywhere anytime
        // 3 = 0x11 disallow invalid clicks
        // 4095 = 0x111111111111 set all flags? (seen in Tutorial01 level)
        if (value !== 0) { // holds for all known levels
            console.warn('NERP: setTutorialFlags not yet implemented', value)
        }
    }

    /**
     * This is used to make messages come up/not come up.
     * @param messagesAllowed
     */
    setMessagePermit(messagesAllowed) {
        this.messagePermit = !messagesAllowed
    }

    setBuildingsUpgradeLevel(typeName: EntityType, level: number) {
        this.entityMgr.buildings.forEach(b => {
            if (b.entityType === typeName) b.setLevel(level)
        })
    }

    setToolStoreLevel(level: number) {
        this.setBuildingsUpgradeLevel(EntityType.TOOLSTATION, level)
    }

    setTeleportPadLevel(level: number) {
        this.setBuildingsUpgradeLevel(EntityType.TELEPORT_PAD, level)
    }

    setPowerStationLevel(level: number) {
        this.setBuildingsUpgradeLevel(EntityType.POWER_STATION, level)
    }

    setBarracksLevel(level: number) {
        this.setBuildingsUpgradeLevel(EntityType.BARRACKS, level)
    }

    /**
     * Gets the number of tool stores currently built. NOT the total ever built.
     * @return {number}
     */
    getToolStoresBuilt() {
        return this.entityMgr.buildings.count((b) => b.entityType === EntityType.TOOLSTATION)
    }

    /**
     * Gets the number of minifigures on the level. XXX it is NOT tested if this ignores minifigures in hidden caverns
     * @return {number}
     */
    getMinifiguresOnLevel() {
        return this.entityMgr.raiders.length
    }

    getMonstersOnLevel() {
        return this.entityMgr.rockMonsters.length
    }

    /**
     * Gets the number of crystals currently stored.
     * @return {number}
     */
    getCrystalsCurrentlyStored() {
        return GameState.numCrystal
    }

    getObjectiveSwitch() {
        // TODO implement this
        return false
    }

    setMessageTimerValues(arg1, arg2, arg3) {
        // TODO implement this
    }

    getMessageTimer() {
        console.warn('getMessageTimer not implemented, immediately returning 0')
        return 0 // TODO return remaining amount of time needed to fully play WAV message
    }

    cameraUnlock() {
        // TODO implement this
    }

    setMessage(messageNumber: number, arrowDisabled) {
        if (!this.messagePermit) return
        if (messageNumber < 1) {
            console.warn(`Unexpected message number ${messageNumber} given`)
            return
        }
        const msg = this.messages[messageNumber - 1]
        if (msg.txt) EventBus.publishEvent(new NerpMessage(msg.txt))
        if (msg.snd) console.log(`TODO Load sounds from DATA and play message`, msg.snd) // TODO snd files reside in sounds/streamed/ which is not included in WAD files :(
    }

    setCameraGotoTutorial(arg1) {
        // TODO implement this
    }

    getTutorialBlockIsGround(blockNum) {
        return 0 // TODO return true if given block is ground
    }

    getTutorialBlockIsPath(blockNum) {
        return 0 // TODO return true if given block is a path
    }

    getUnitAtBlock(blockNum) {
        return 0 // TODO return number of units on given block
    }

    getOxygenLevel() {
        return GameState.airLevel * 100
    }

    getObjectiveShowing() {
        // TODO implement this
        return false
    }

    addPoweredCrystals() {
        // TODO implement this
    }

    disallowAll() {
        // TODO implement this
    }

    getPoweredPowerStationsBuilt() {
        return this.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.POWER_STATION)
    }

    getPoweredBarracksBuilt() {
        return this.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.BARRACKS)
    }

    getRecordObjectAtTutorial() {
        // TODO implement this
    }

    getHiddenObjectsFound() {
        return GameState.hiddenObjectsFound
    }

    getLevel1PowerStationsBuilt() {
        return this.entityMgr.buildings.count((b) => b.entityType === EntityType.POWER_STATION && b.level >= 1)
    }

    getRandom100(): number {
        return Math.randomInclusive(100)
    }

    getSlugsOnLevel(): number {
        return 0 // TODO implement slugs
    }

    generateSlug() {
        console.warn('Slugs not yet implemented') // TODO implement slugs
    }

    callMethod(methodName: string, methodArgs: any[]) {
        if (methodName === 'Stop') {
            throw new Error('Stop')
        } else if (methodName === 'TRUE') {
            return true
        } else if (methodName === 'FALSE') {
            return false
        }
        const setRegisterMatch = methodName.match(/^SetR([0-7])$/)
        if (setRegisterMatch) {
            return this.setR(setRegisterMatch[1], methodArgs[0])
        }
        const addRegisterMatch = methodName.match(/^AddR([0-7])$/)
        if (addRegisterMatch) {
            return this.addR(addRegisterMatch[1], methodArgs[0])
        }
        const subRegisterMatch = methodName.match(/^SubR([0-7])$/)
        if (subRegisterMatch) {
            return this.subR(subRegisterMatch[1], methodArgs[0])
        }
        const getRegisterMatch = methodName.match(/^GetR([0-7])$/)
        if (getRegisterMatch) {
            return this.getR(getRegisterMatch[1])
        }
        const setTimerMatch = methodName.match(/^SetTimer([0-3])$/)
        if (setTimerMatch) {
            return this.setTimer(setTimerMatch[1], methodArgs[0])
        }
        const getTimerMatch = methodName.match(/^GetTimer([0-3])$/)
        if (getTimerMatch) {
            return this.getTimer(getTimerMatch[1])
        }
        const lMethodName = methodName.toLowerCase()
        const memberName = Object.getOwnPropertyNames(NerpRunner.prototype).find((name) => name.toLowerCase() === lMethodName)
        if (memberName) return this[memberName].apply(this, methodArgs)
        throw new Error(`Undefined method: ${methodName}`)
    }

    conditional(left, right) {
        const conditionResult = this.executeStatement(left)
        if (this.debug) {
            console.log(`Condition evaluated to ${conditionResult}`)
        }
        if (conditionResult) {
            this.executeStatement(right)
        }
    }

    executeStatement(expression) {
        if (expression.invoke) {
            const argValues = expression.invoke !== 'conditional' ? expression.args.map(e => this.executeStatement(e)) : expression.args
            const result = this.callMethod(expression.invoke, argValues)
            if (result !== undefined && this.debug) {
                console.log(`Method ${expression.invoke}(${JSON.stringify(expression.args).slice(1, -1)}) returned: ${result}`)
            }
            return result
        } else if (expression.comparator) {
            const left = this.executeStatement(expression.left)
            const right = this.executeStatement(expression.right)
            if (expression.comparator === '=') {
                return left === right
            } else if (expression.comparator === '!=') {
                return left !== right
            } else if (expression.comparator === '<') {
                return left < right
            } else if (expression.comparator === '>') {
                return left > right
            } else {
                console.log(expression)
                throw new Error(`Unknown comparator: ${expression.comparator}`)
            }
        } else if (!isNaN(expression)) { // just a number
            return expression
        } else if (expression.jump) {
            this.programCounter = this.script.labelsByName.get(expression.jump)
            if (this.programCounter === undefined) {
                throw new Error(`Label '${expression.jump}' is unknown!`)
            }
            if (this.debug) {
                console.log(`Jumping to label '${expression.jump}' in line ${this.programCounter}`)
            }
        } else {
            console.log(expression)
            throw new Error(`Unknown expression in line ${this.programCounter}: ${expression}`)
        }
    }

    execute() {
        if (this.halted) return
        try {
            if (this.debug) {
                console.log(`Executing following script\\n${this.script.lines.join('\n')}`)
                console.log(`Registers: ${this.registers}`)
            }
            for (this.programCounter = 0; this.programCounter < this.script.statements.length && !this.halted; this.programCounter++) {
                const statement = this.script.statements[this.programCounter]
                if (this.debug) {
                    console.log(`${this.programCounter}: ${this.script.lines[this.programCounter]}`)
                    console.log(statement)
                }
                if (!statement.label) { // do nothing for label markers
                    this.executeStatement(statement)
                }
            }
        } catch (e) {
            if ((e as Error).message === 'Stop') {
                return
            }
            console.error(e)
            console.error('FATAL ERROR! Script execution failed! You can NOT win anymore!')
            this.halted = true
        }
    }

    checkSyntax() {
        this.script.statements.forEach((statement) => {
            const memberName = Object.getOwnPropertyNames(NerpRunner.prototype).find((name) => name.equalsIgnoreCase(statement.invoke))
            if (!statement.label && !statement.jump && !this[memberName] && statement.invoke !== 'Stop' && !statement.invoke?.startsWith('AddR') && !statement.invoke?.startsWith('SubR') && !statement.invoke?.startsWith('SetR') && !statement.invoke?.startsWith('SetTimer')) {
                console.warn(`Unknown statement ${statement.invoke} found, NERP execution may fail!`)
            }
        })
    }
}
