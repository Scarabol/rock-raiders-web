/** Function documentation mostly copied from the following URLs
 *
 * https://kb.rockraidersunited.com/User:Jessietail/NERPs_reference
 * https://web.archive.org/web/20131206122442/http://rru-stuff.org/nerpfuncs.html
 * https://kb.rockraidersunited.com/NERPs_documentation
 *
 */
import { EventBus } from '../event/EventBus'
import { NerpMessageEvent } from '../event/LocalEvents'
import { WorldManager } from '../game/WorldManager'
import { EntityType } from '../game/model/EntityType'
import { GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { NerpParser } from './NerpParser'
import { NerpScript } from './NerpScript'
import { NERP_EXECUTION_INTERVAL, VERBOSE } from '../params'
import { GameResultEvent } from '../event/WorldEvents'
import { PositionComponent } from '../game/component/PositionComponent'
import { SurfaceType } from '../game/terrain/SurfaceType'
import { MonsterSpawner } from '../game/entity/MonsterSpawner'
import { SlugEmergeEvent } from '../event/WorldLocationEvent'
import { AnimatedSceneEntityComponent } from '../game/component/AnimatedSceneEntityComponent'
import { AnimEntityActivity, SlugActivity } from '../game/model/anim/AnimationActivity'
import { SlugBehaviorComponent, SlugBehaviorState } from '../game/component/SlugBehaviorComponent'
import { GameConfig } from '../cfg/GameConfig'

window['nerpDebugToggle'] = () => NerpRunner.debug = !NerpRunner.debug

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class NerpRunner {
    static debug = false
    static timeAddedAfterSample = 0

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
    sampleLengthMultiplier: number = 0
    timeForNoSample: number = 0
    messageTimer: number = 0

    constructor(readonly worldMgr: WorldManager, nerpScriptFile: string) {
        NerpRunner.timeAddedAfterSample = 0
        this.script = NerpParser.parse(nerpScriptFile)
        this.checkSyntax()
        if (NerpRunner.debug) console.log(`Executing following script\n${this.script.lines.join('\n')}`)
    }

    update(elapsedMs: number) {
        this.timer += elapsedMs
        this.messageTimer = this.messageTimer > 0 ? this.messageTimer - elapsedMs : 0
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
            if (VERBOSE) console.warn('NERP: setTutorialFlags not yet implemented', value)
        }
    }

    setTutorialPointer(unknown1: number, unknown2: number) {
        // XXX Only used in tutorials
    }

    /**
     * This is used to make messages come up/not come up.
     * @param blockMessages
     */
    setMessagePermit(blockMessages: number) {
        this.messagePermit = !blockMessages
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

    setDocksLevel(level: number) {
        this.setBuildingsUpgradeLevel(EntityType.DOCKS, level)
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
    getToolStoresBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TOOLSTATION)
    }

    /**
     * Gets the number of minifigures on the level. XXX it is NOT tested if this ignores minifigures in hidden caverns
     * @return {number}
     */
    getMiniFiguresOnLevel(): number {
        return this.worldMgr.entityMgr.raiders.length
    }

    getMonstersOnLevel(): number {
        return this.worldMgr.entityMgr.rockMonsters.length
    }

    getSmallHelicoptersOnLevel(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.SMALL_HELI)
    }

    getSlugsOnLevel(): number {
        return this.worldMgr.entityMgr.slugs.length
    }

    generateSlug() {
        const slugHole = this.worldMgr.sceneMgr.terrain.slugHoles.random()
        if (!slugHole) return
        const slug = MonsterSpawner.spawnMonster(this.worldMgr, EntityType.SLUG, slugHole.getRandomPosition(), Math.random() * 2 * Math.PI)
        const behaviorComponent = this.worldMgr.ecs.addComponent(slug, new SlugBehaviorComponent())
        const components = this.worldMgr.ecs.getComponents(slug)
        const sceneEntity = components.get(AnimatedSceneEntityComponent)
        sceneEntity.sceneEntity.setAnimation(SlugActivity.Emerge, () => {
            sceneEntity.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            behaviorComponent.state = SlugBehaviorState.IDLE
        })
        EventBus.publishEvent(new SlugEmergeEvent(components.get(PositionComponent)))
    }

    /**
     * Gets the number of crystals currently stored.
     * @return {number}
     */
    getCrystalsCurrentlyStored() {
        return GameState.numCrystal
    }

    setMessageTimerValues(sampleLengthMultiplier: number, timeAddedAfterSample: number, timeForNoSample: number) {
        this.sampleLengthMultiplier = sampleLengthMultiplier
        NerpRunner.timeAddedAfterSample = timeAddedAfterSample
        this.timeForNoSample = timeForNoSample
    }

    getMessageTimer() { // XXX return remaining amount of time needed to fully play WAV message
        return this.messageTimer // XXX workaround until sounds from DATA directory are implemented
    }

    cameraUnlock() {
        this.worldMgr.sceneMgr.controls.unlockCamera()
    }

    cameraLockOnObject(recordedEntity: number) {
        // XXX Only used in tutorials, lock camera to recorded entity
    }

    setMessage(messageNumber: number, arrowDisabled: number) {
        if (!this.messagePermit) return
        if (messageNumber === 0) messageNumber = 1 // XXX Remove workaround for level 07
        if (messageNumber < 1) {
            console.warn(`Unexpected message number ${messageNumber} given`)
            return
        }
        this.supressArrow(arrowDisabled)
        const msg = this.messages[messageNumber - 1]
        if (!msg) {
            console.warn(`Message ${messageNumber} not found in [${this.messages.map((m) => m.txt)}]`)
            return
        }
        const sampleLength = this.timeForNoSample / 1000 // XXX workaround until sounds from DATA directory are implemented
        const messageTimeoutMs = sampleLength * this.sampleLengthMultiplier + NerpRunner.timeAddedAfterSample
        if (msg.txt) EventBus.publishEvent(new NerpMessageEvent(msg.txt, messageTimeoutMs || GameConfig.instance.main.textPauseTimeMs))
        if (msg.snd) { // XXX snd files reside in sounds/streamed/ which is not included in WAD files :(
            if (VERBOSE) console.warn(`Sounds from DATA directory not yet implemented`, msg.snd)
        }
        this.messageTimer = this.timeForNoSample // XXX workaround until sounds from DATA directory are implemented
    }

    setRockMonsterAtTutorial(tutoBlockId: number) {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => this.worldMgr.sceneMgr.terrain.emergeFromSurface(t))
    }

    setCongregationAtTutorial(tutoBlockId: number) {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} to move camera to, using first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return
        GameState.monsterCongregation = targetBlock.getCenterWorld2D()
    }

    setCameraGotoTutorial(tutoBlockId: number) {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} to move camera to, using first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return
        this.worldMgr.sceneMgr.controls.forceMoveToTarget(targetBlock.getCenterWorld())
    }

    setTutorialBlockIsGround(tutoBlockId: number, state: number): void {
        if (state === 1) {
            const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
            tutoBlocks.forEach((s) => s.setSurfaceType(SurfaceType.GROUND))
        } else {
            console.warn(`Unexpected state (${state}) given for setTutorialBlockIsGround`)
        }
    }

    getTutorialBlockIsGround(tutoBlockId: number): number {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return tutoBlocks.count((s) => s.discovered && s.surfaceType.floor) // XXX must be non-zero at least, but what meaning exactly?
    }

    getTutorialBlockIsPath(tutoBlockId): number {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} to move camera to, using first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return 0
        return targetBlock.discovered && targetBlock.isPath() ? 1 : 0
    }

    getUnitAtBlock(tutoBlockId): number {
        const tutoBlocks = this.worldMgr.sceneMgr.terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return [...this.worldMgr.entityMgr.raiders, ...this.worldMgr.entityMgr.vehicles].count((e): boolean => {
            const surface = this.worldMgr.ecs.getComponents(e.entity).get(PositionComponent).surface
            return tutoBlocks.some((tutoBlock) => tutoBlock.discovered && surface === tutoBlock)
        })
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

    addPoweredCrystals() { // XXX Only used in tutorials
    }

    disallowAll() { // XXX Only used in tutorials
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
            const surface = this.worldMgr.ecs.getComponents(entity).get(PositionComponent).surface
            return tutoBlocks.some((tutoBlock) => surface === tutoBlock)
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

    supressArrow(state: number): void {
        // XXX Implement tutorial function to enable/disable helper arrow
    }

    setGameSpeed(speed: number, unknown: number): void {
        // XXX Only used in tutorials, implement changeable game speed first
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
            if (NerpRunner.debug) console.log(`Starting execution with registers set to ${this.registers}`)
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
