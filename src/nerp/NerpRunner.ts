/** Function documentation mostly copied from the following URLs
 *
 * https://kb.rockraidersunited.com/User:Jessietail/NERPs_reference
 * https://web.archive.org/web/20131206122442/http://rru-stuff.org/nerpfuncs.html
 * https://kb.rockraidersunited.com/NERPs_documentation
 *
 */
import { EventBus } from '../event/EventBus'
import { NerpMessage } from '../event/LocalEvents'
import { WorldManager } from '../game/WorldManager'
import { EntityType } from '../game/model/EntityType'
import { GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { NerpParser } from './NerpParser'
import { NerpScript } from './NerpScript'
import { DEV_MODE, NERP_EXECUTION_INTERVAL } from '../params'
import { GameResultEvent } from '../event/WorldEvents'

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class NerpRunner {
    static debug = false

    readonly script: NerpScript

    timer: number = 0
    registers = new Array(8).fill(0)
    timers = new Array(4).fill(0)
    halted = false
    programCounter = 0
    messages: { txt: string, snd: string }[] = []
    // more state variables and switches
    messagePermit: boolean = null
    objectiveSwitch: boolean = true
    objectiveShowing: number = 0

    constructor(readonly worldMgr: WorldManager, nerpScriptFile: string) {
        this.script = NerpParser.parse(nerpScriptFile)
        this.checkSyntax()
    }

    update(elapsedMs: number) {
        this.timer += elapsedMs
        while (this.timer >= 0) {
            this.timer -= NERP_EXECUTION_INTERVAL
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
        EventBus.publishEvent(new GameResultEvent(GameResultState.COMPLETE))
    }

    /**
     * End the level as failure and show the score screen.
     */
    setLevelFail() {
        console.log(`NerpRunner marks level as failed; at line: ${this.script.lines[this.programCounter]}`)
        this.halted = true
        EventBus.publishEvent(new GameResultEvent(GameResultState.FAILED))
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
            if (!DEV_MODE) console.warn('NERP: setTutorialFlags not yet implemented', value)
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
        this.worldMgr.entityMgr.buildings.forEach(b => {
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
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TOOLSTATION)
    }

    /**
     * Gets the number of minifigures on the level. XXX it is NOT tested if this ignores minifigures in hidden caverns
     * @return {number}
     */
    getMinifiguresOnLevel() {
        return this.worldMgr.entityMgr.raiders.length
    }

    getMonstersOnLevel() {
        return this.worldMgr.entityMgr.rockMonsters.length
    }

    /**
     * Gets the number of crystals currently stored.
     * @return {number}
     */
    getCrystalsCurrentlyStored() {
        return GameState.numCrystal
    }

    setMessageTimerValues(arg1, arg2, arg3) {
        // TODO implement this
    }

    getMessageTimer() {
        if (!DEV_MODE) console.warn('getMessageTimer not implemented, immediately returning 0')
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
        if (msg.snd && !DEV_MODE) console.log(`TODO Load sounds from DATA and play message`, msg.snd) // TODO snd files reside in sounds/streamed/ which is not included in WAD files :(
    }

    setCameraGotoTutorial(arg1) {
        // TODO implement this
    }

    getTutorialBlockIsGround(tutoBlockId: number): number {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return tutoBlocks.count((s) => s.discovered && s.surfaceType.floor) // XXX must be non-zero at least, but what meaning exactly?
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

    getObjectiveSwitch(): boolean {
        return this.objectiveSwitch
    }

    getObjectiveShowing(): number {
        return this.objectiveShowing
    }

    addPoweredCrystals() {
        // TODO implement this
    }

    disallowAll() {
        // TODO implement this
    }

    getPoweredPowerStationsBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.POWER_STATION)
    }

    getPoweredBarracksBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.BARRACKS)
    }

    getRecordObjectAtTutorial(tutoBlockId: number): number {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        const recordedEntities = this.worldMgr.entityMgr.recordedEntities
        return recordedEntities.count((entity): boolean => {
            const position = this.worldMgr.entityMgr.raiders.find((r) => r.entity === entity)?.sceneEntity.position
                ?? this.worldMgr.entityMgr.vehicles.find((v) => v.entity === entity)?.sceneEntity.position
            if (!position) return false
            // TODO Use position component to determine entity surface
            const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(position)
            return !!surface && tutoBlocks.some((tutoBlock) => surface === tutoBlock)
        })
    }

    getHiddenObjectsFound() {
        return GameState.hiddenObjectsFound
    }

    getLevel1TeleportsBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TELEPORT_PAD && b.level >= 1)
    }

    getLevel2TeleportsBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TELEPORT_PAD && b.level >= 2)
    }

    getLevel1PowerStationsBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.POWER_STATION && b.level >= 1)
    }

    getLevel1BarracksBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.BARRACKS && b.level >= 1)
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
        if (NerpRunner.debug) {
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
            if (result !== undefined && NerpRunner.debug) {
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
            if (NerpRunner.debug) {
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
            if (NerpRunner.debug) {
                console.log(`Executing following script\\n${this.script.lines.join('\n')}`)
                console.log(`Registers: ${this.registers}`)
            }
            for (this.programCounter = 0; this.programCounter < this.script.statements.length && !this.halted; this.programCounter++) {
                const statement = this.script.statements[this.programCounter]
                if (NerpRunner.debug) {
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
