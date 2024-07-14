/** Function documentation mostly copied from the following URLs
 *
 * https://kb.rockraidersunited.com/User:Jessietail/NERPs_reference
 * https://web.archive.org/web/20131206122442/http://rru-stuff.org/nerpfuncs.html
 * https://kb.rockraidersunited.com/NERPs_documentation
 *
 */
import { WorldManager } from '../game/WorldManager'
import { EntityType } from '../game/model/EntityType'
import { GameResultState } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { NerpScript } from './NerpScript'
import { DEV_MODE, NERP_EXECUTION_INTERVAL } from '../params'
import { GameResultEvent, JobCreateEvent, MaterialAmountChanged, MonsterEmergeEvent, NerpMessageEvent, NerpSuppressArrowEvent } from '../event/WorldEvents'
import { PositionComponent } from '../game/component/PositionComponent'
import { SurfaceType } from '../game/terrain/SurfaceType'
import { MonsterSpawner } from '../game/factory/MonsterSpawner'
import { SlugEmergeEvent } from '../event/WorldLocationEvent'
import { AnimatedSceneEntityComponent } from '../game/component/AnimatedSceneEntityComponent'
import { AnimEntityActivity, SlugActivity } from '../game/model/anim/AnimationActivity'
import { SlugBehaviorComponent, SlugBehaviorState } from '../game/component/SlugBehaviorComponent'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'
import { SoundManager } from '../audio/SoundManager'
import { EventKey } from '../event/EventKeyEnum'
import { GuiButtonBlinkEvent, ShowMissionBriefingEvent } from '../event/LocalEvents'
import { NerpMessage } from '../resource/fileparser/NerpMsgParser'
import { Surface } from '../game/terrain/Surface'
import { MaterialSpawner } from '../game/factory/MaterialSpawner'
import { PriorityIdentifier } from '../game/model/job/PriorityIdentifier'
import { RaiderTool } from '../game/model/raider/RaiderTool'

window['nerpDebugToggle'] = () => NerpRunner.debug = !NerpRunner.debug

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class NerpRunner {
    static debug = false
    static timeAddedAfterSample = 0

    readonly registers = new Array(8).fill(0)
    readonly timers = new Array(4).fill(0)
    timer: number = 0
    halted = false
    programCounter = 0
    // more state variables and switches
    messagePermit: boolean = true
    objectiveSwitch: boolean = true
    objectiveShowing: number = 1
    sampleLengthMultiplier: number = 0
    timeForNoSample: number = 0
    currentMessage: number = -1
    messageTimerMs: number = 0
    messageSfx: AudioBufferSourceNode = null
    tutoBlocksById: Map<number, Surface[]> = new Map()
    digIconClicked: number = 0
    goBackIconClicked: number = 0

    constructor(readonly worldMgr: WorldManager, readonly script: NerpScript, readonly messages: NerpMessage[]) {
        NerpRunner.timeAddedAfterSample = 0
        this.script.statements.forEach((statement) => this.checkSyntax(statement))
        if (NerpRunner.debug) console.log(`Executing following script\n${this.script.lines.join('\n')}`)
        EventBroker.subscribe(EventKey.NERP_MESSAGE_NEXT, () => {
            this.currentMessage = -1
            this.messageTimerMs = 0
            this.messageSfx?.stop()
            this.messageSfx = null
            this.execute()
        })
        EventBroker.subscribe(EventKey.GAME_RESULT_STATE, () => {
            this.halted = true
        })
        EventBroker.subscribe(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            this.objectiveShowing = event.isShowing ? 1 : 0
            this.objectiveSwitch = this.objectiveSwitch && event.isShowing
        })
        EventBroker.subscribe(EventKey.JOB_CREATE, (event: JobCreateEvent) => {
            if (event.job.requiredTool === RaiderTool.DRILL) { // XXX Find better way to identify drill jobs
                this.digIconClicked++
            }
        })
        EventBroker.subscribe(EventKey.GUI_GO_BACK_BUTTON_CLICKED, () => {
            this.goBackIconClicked++
        })
    }

    update(elapsedMs: number) {
        this.timer += elapsedMs
        this.messageTimerMs = this.messageTimerMs > 0 ? this.messageTimerMs - elapsedMs : 0
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
    checkRegister(register: string): number {
        const num = parseInt(register)
        if (isNaN(num) || num < 0 || num > this.registers.length) throw new Error(`Invalid register (${register}) provided`)
        return num
    }

    /**
     * Internally used to validate and parse a value before setting or adding it with a register.
     * @param value
     * @return {number}
     */
    checkRegisterValue(value: string): number {
        const num = parseInt(value)
        if (isNaN(num)) throw new Error(`Invalid register value (${value}) provided`)
        return num
    }

    /**
     * Gets the value currently stored in the given register, internally used to handle all registers with one method.
     * @param register the register to read
     * @return {number} returns the value currently stored in the register
     */
    getR(register: string): number {
        const regNum = this.checkRegister(register)
        return this.registers[regNum]
    }

    /**
     * Sets the given value for the given register, internally used to handle all registers with one method.
     * @param register the register to set
     * @param value the value to set for the given register
     */
    setR(register: string, value: string): void {
        const regNum = this.checkRegister(register)
        this.registers[regNum] = this.checkRegisterValue(value)
    }

    /**
     * Adds the given value to the given register, internally used to handle all registers with one method.
     * @param register the register to add to
     * @param value the value to add to the given register
     */
    addR(register: string, value: string): void {
        const regNum = this.checkRegister(register)
        this.registers[regNum] += this.checkRegisterValue(value)
    }

    /**
     * Subtracts the given value from the given register, internally used to handle all registers with one method.
     * @param register the register to subtract from
     * @param value the value to subtract from the given register
     */
    subR(register: string, value: string): void {
        const regNum = this.checkRegister(register)
        this.registers[regNum] -= this.checkRegisterValue(value)
    }

    /**
     * Set the respective timer to the given numerical value. Units are in milliseconds.
     * @param timer
     * @param value
     */
    setTimer(timer: number, value: string): void {
        const num = parseInt(value)
        if (isNaN(num)) throw new Error(`Can't set timer to NaN value: ${value}`)
        this.timers[timer] = new Date().getTime() + num
    }

    /**
     * Gets the value of the respective timer. Units are in milliseconds.
     * @param timer
     * @return {number}
     */
    getTimer(timer: number): number {
        return new Date().getTime() - this.timers[timer]
    }

    /**
     * End the level successfully and show the score screen.
     */
    setLevelCompleted() {
        console.log('Nerp runner marks level as complete')
        EventBroker.publish(new GameResultEvent(GameResultState.COMPLETE))
    }

    /**
     * End the level as failure and show the score screen.
     */
    setLevelFail() {
        console.log(`NerpRunner marks level as failed; at line: ${this.script.lines[this.programCounter]}`)
        EventBroker.publish(new GameResultEvent(GameResultState.FAILED))
    }

    /**
     * Sets tutorial flags
     * @param value a bitmask to set flags with
     */
    setTutorialFlags(value: number) {
        // seems like value must be interpreted bitwise and sets a certain flag on each bit
        // seen so far:
        // 0 = 0x00 allow any click anywhere anytime
        // 3 = 0x11 disallow invalid clicks
        // 4095 = 0x111111111111 set all flags? (seen in Tutorial01 level)
        if (value !== 0) { // holds for all known levels
            // TODO Only used in tutorials
            console.warn('NERP function "setTutorialFlags" not yet implemented', value)
        } else {
            // TODO Reset all flags?
        }
    }

    setTutorialPointer(tutoBlockId: number, enabled: number) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            if (enabled) {
                t.mesh.objectPointer?.setTargetPosition(t.getCenterWorld(), t.mesh)
            } else {
                t.mesh.objectPointer?.hide()
            }
        })
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
     * Gets the number of mini-figures on the level. XXX it is NOT tested if this ignores mini-figures in hidden caverns
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
        EventBroker.publish(new SlugEmergeEvent(components.get(PositionComponent)))
    }

    /**
     * Gets the number of crystals currently stored.
     * @return {number}
     */
    getCrystalsCurrentlyStored(): number {
        return GameState.numCrystal
    }

    setMessageTimerValues(sampleLengthMultiplier: number, timeAddedAfterSample: number, timeForNoSample: number) {
        this.sampleLengthMultiplier = sampleLengthMultiplier
        NerpRunner.timeAddedAfterSample = timeAddedAfterSample
        this.timeForNoSample = timeForNoSample
    }

    getMessageTimer() {
        return this.messageTimerMs
    }

    cameraUnlock() {
        this.worldMgr.sceneMgr.birdViewControls.unlockCamera()
    }

    cameraLockOnObject(recordedEntity: number) {
        const entity = this.worldMgr.entityMgr.recordedEntities[recordedEntity - 1]
        if (!entity) {
            console.warn(`Invalid entity ${recordedEntity} given`)
            return
        }
        const sceneEntity = this.worldMgr.ecs.getComponents(entity)?.get(AnimatedSceneEntityComponent)?.sceneEntity
        if (!sceneEntity) {
            console.warn(`Given entity ${entity} has no scene entity to jump to`)
            return
        }
        this.worldMgr.sceneMgr.birdViewControls.lockOnObject(sceneEntity)
    }

    setMessage(messageNumber: number, arrowDisabled: number) {
        if (!this.messagePermit) return
        if (messageNumber === 0) messageNumber = 1 // XXX Remove workaround for level 07
        if (messageNumber < 1) {
            console.warn(`Unexpected message number ${messageNumber} given`)
            return
        }
        const msg = this.messages[messageNumber - 1]
        if (!msg) {
            console.warn(`Message ${messageNumber} not found in [${this.messages.map((m) => m.txt)}]`)
            return
        }
        let sampleLength = this.timeForNoSample / 1000
        if (!DEV_MODE && msg.snd) {
            this.messageSfx = SoundManager.playSound(msg.snd, true) || this.messageSfx
            sampleLength = this.messageSfx?.buffer?.duration || sampleLength
        }
        const sampleTimeoutMs = sampleLength * this.sampleLengthMultiplier + NerpRunner.timeAddedAfterSample
        this.messageTimerMs = sampleTimeoutMs || GameConfig.instance.main.textPauseTimeMs
        if (messageNumber !== this.currentMessage) {
            this.currentMessage = messageNumber
            if (msg.txt) EventBroker.publish(new NerpMessageEvent(msg.txt, this.messageTimerMs, !!arrowDisabled))
        }
        if (!arrowDisabled) this.messageTimerMs = Infinity
    }

    advanceMessage(): void {
        // TODO Only used in tutorials
        if (this.currentMessage < 0) return
        console.warn('NERP function "advanceMessage" not yet implemented', this.messagePermit, this.currentMessage, this.messageTimerMs)
        EventBroker.publish(new NerpSuppressArrowEvent(false))
    }

    setRockMonsterAtTutorial(tutoBlockId: number) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            EventBroker.publish(new MonsterEmergeEvent(t))
        })
    }

    setCongregationAtTutorial(tutoBlockId: number) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} as congregation, using only first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return
        GameState.monsterCongregation = targetBlock.getCenterWorld2D()
    }

    setCameraGotoTutorial(tutoBlockId: number) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} to move camera to, using only first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return
        this.worldMgr.sceneMgr.birdViewControls.forceMoveToTarget(targetBlock.getCenterWorld())
    }

    setTutorialBlockIsGround(tutoBlockId: number, state: number): void {
        if (state !== 1) console.warn(`Unexpected state (${state}) given for setTutorialBlockIsGround`)
        const surfaceType = SurfaceType.GROUND
        this.setTutorialBlock(tutoBlockId, surfaceType)
    }

    setTutorialBlockIsPath(tutoBlockId: number, state: number) {
        if (state !== 1) console.warn(`Unexpected state (${state}) given for setTutorialBlockIsPath`)
        this.setTutorialBlock(tutoBlockId, SurfaceType.POWER_PATH)
    }

    private setTutorialBlock(tutoBlockId: number, surfaceType: SurfaceType) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((s) => {
            s.setSurfaceType(surfaceType)
            s.needsMeshUpdate = true
            s.discover()
        })
        this.worldMgr.sceneMgr.terrain.updateSurfaceMeshes()
    }

    getTutorialBlockIsGround(tutoBlockId: number): number {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return tutoBlocks.count((s) => s.discovered && s.surfaceType.floor)
    }

    getTutorialBlockIsPath(tutoBlockId: number): number {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return tutoBlocks.count((s) => s.discovered && s.isPath())
    }

    getTutorialBlockClicks(tutoBlockId: number): number {
        return GameState.tutoBlockClicks.getOrDefault(tutoBlockId, 0)
    }

    setTutorialBlockClicks(tutoBlockId: number) {
        GameState.tutoBlockClicks.set(tutoBlockId, 0)
    }

    getUnitAtBlock(tutoBlockId: number): number {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
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

    addPoweredCrystals(numCrystals: number) {
        GameState.numCrystal += numCrystals
        EventBroker.publish(new MaterialAmountChanged())
    }

    addStoredOre(numOre: number) {
        GameState.numOre += numOre
        EventBroker.publish(new MaterialAmountChanged())
    }

    /**
     * Tutorial01
     * - Raider should pick up shovel to clear rubble, but not automatically start clearing it
     * - Once job assigned by player, raider should continue and clear rubble
     * Tutorial02
     * - Raider should start drilling when drill job created
     */
    disallowAll() {
        GameState.disallowAll = true
    }

    getPoweredPowerStationsBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.POWER_STATION)
    }

    getPoweredBarracksBuilt() {
        return this.worldMgr.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.BARRACKS)
    }

    getRecordObjectAtTutorial(tutoBlockId: number): number {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        const recordedEntities = this.worldMgr.entityMgr.recordedEntities
        return recordedEntities.count((entity): boolean => {
            const surface = this.worldMgr.ecs.getComponents(entity).get(PositionComponent).surface
            return tutoBlocks.some((tutoBlock) => surface === tutoBlock)
        })
    }

    /**
     * Tutorial01
     * - If no unit is selected, 0 should be returned
     * - The return value is stored in register 1 and later compared to the list of recorded objects
     */
    getSelectedRecordObject(): number {
        const recordedIndex = this.worldMgr.entityMgr.recordedEntities.findIndex((entity) => {
            return !![...this.worldMgr.entityMgr.selection.raiders, ...this.worldMgr.entityMgr.selection.vehicles]
                .find((e) => e.entity === entity)
        })
        return recordedIndex >= 0 ? recordedIndex + 1 : 0
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

    // noinspection SpellCheckingInspection
    supressArrow(state: number): void {
        EventBroker.publish(new NerpSuppressArrowEvent(!!state))
    }

    setGameSpeed(speed: number, unknown: number): void {
        if (unknown) console.warn(`Unexpected value (${unknown}) for second parameter given`)
        this.worldMgr.gameSpeedMultiplier = speed / 100
    }

    setRecordObjectPointer(recordedEntity: number) {
        if (recordedEntity < 1) {
            this.worldMgr.sceneMgr.objectPointer.hide()
            return
        }
        const entity = this.worldMgr.entityMgr.recordedEntities[recordedEntity - 1]
        if (!entity) {
            console.warn(`Invalid entity ${recordedEntity} given`)
            return
        }
        const sceneEntity = this.worldMgr.ecs.getComponents(entity)?.get(AnimatedSceneEntityComponent)?.sceneEntity
        if (!sceneEntity) {
            console.warn(`Given entity ${entity} has no scene entity to point to`)
            return
        }
        this.worldMgr.sceneMgr.objectPointer.setTargetObject(sceneEntity)
    }

    /**
     * Tutorial01
     * - Allow to select only raiders
     */
    clickOnlyObjects() {
        // TODO Only used in tutorials
        console.warn('NERP function "clickOnlyObjects" not yet implemented')
    }

    /**
     * Tutorial01
     * - Allow to select only surfaces
     */
    clickOnlyMap() {
        // TODO Only used in tutorials
        console.warn('NERP function "clickOnlyMap" not yet implemented')
    }

    setTutorialCrystals(tutoBlockId: number, numOfCrystals: number) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            for (let c = 0; c < numOfCrystals; c++) {
                MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, t.getRandomPosition(), Math.random() * 2 * Math.PI)
            }
        })
    }

    setCrystalPriority(targetIndex: number) {
        GameState.priorityList.setPriorityIndex(PriorityIdentifier.CRYSTAL, 0)
    }

    cameraZoomOut(zoomLevel: number) {
        if (zoomLevel < 0 || zoomLevel > 100) {
            console.warn(`Invalid camera zoom out level ${zoomLevel}`)
            return
        }
        const targetZoom = Math.round(zoomLevel / 100 * GameConfig.instance.main.maxDist)
        this.worldMgr.sceneMgr.birdViewControls.setZoom(targetZoom)
    }

    cameraZoomIn(zoomLevel: number) {
        if (zoomLevel < GameConfig.instance.main.minDist || zoomLevel > GameConfig.instance.main.maxDist) {
            console.warn(`Unexpected camera zoom in level ${zoomLevel}. Must be in range from ${GameConfig.instance.main.minDist} to ${GameConfig.instance.main.maxDist}`)
            return
        }
        // XXX This should be consistent with cameraZoomOut
        this.worldMgr.sceneMgr.birdViewControls.setZoom(zoomLevel)
    }

    makeSomeoneOnThisBlockPickUpSomethingOnThisBlock(tutoBlockId: number) {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            const raider = this.worldMgr.entityMgr.raiders.filter((r) => r.getSurface() === t && r.isReadyToTakeAJob()).random()
            if (!raider) return
            const material = this.worldMgr.entityMgr.materials.filter((m) => m.getSurface() === t && !m.carryJob?.hasFulfiller()).random()
            if (!material) return
            raider.setJob(material.setupCarryJob())
        })
    }

    setDigIconClicked(num: number) {
        this.digIconClicked = num
    }

    /**
     * Tutorial02
     * - Return 1, when surface drill icon was clicked
     */
    getDigIconClicked(): number {
        return this.digIconClicked
    }

    flashDigIcon(flash: number) {
        EventBroker.publish(new GuiButtonBlinkEvent('Interface_MenuItem_Dig', flash === 1))
    }

    setGoBackIconClicked(num: number) {
        this.goBackIconClicked = num
    }

    getGoBackIconClicked(): number {
        return this.goBackIconClicked
    }

    flashGoBackIcon(flash: number) {
        EventBroker.publish(new GuiButtonBlinkEvent('InterfaceBackButton', flash === 1))
    }

    setBuildingsTeleported(...args: any[]) {
        // TODO Only used in tutorials
        console.warn('NERP function "setBuildingsTeleported" not yet implemented', args)
    }

    getMiniFigureSelected(): number {
        return this.worldMgr.entityMgr.selection.raiders.length
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
            const timer = parseInt(setTimerMatch[1])
            return this.setTimer(timer, methodArgs[0])
        }
        const getTimerMatch = methodName.match(/^GetTimer([0-3])$/)
        if (getTimerMatch) {
            const timer = parseInt(getTimerMatch[1])
            return this.getTimer(timer)
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
            const argValues = expression.invoke !== 'conditional' ? expression.args.map((e) => this.executeStatement(e)) : expression.args
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

    private checkSyntax(statement: any) {
        const memberName = Object.getOwnPropertyNames(NerpRunner.prototype).find((name) => name.equalsIgnoreCase(statement.invoke))
        if (!statement.label &&
            !statement.jump &&
            !statement.comparator &&
            isNaN(statement) &&
            statement.invoke !== 'Stop' &&
            !statement.invoke?.startsWith('GetR') &&
            !statement.invoke?.startsWith('AddR') &&
            !statement.invoke?.startsWith('SubR') &&
            !statement.invoke?.startsWith('SetR') &&
            !statement.invoke?.startsWith('SetTimer') &&
            !this[memberName]
        ) {
            console.warn(`Unexpected invocation "${statement.invoke}" found, NERP execution may fail!`, statement)
        }
        if (Array.isArray(statement.args)) {
            statement.args.forEach((arg: any) => this.checkSyntax(arg))
        }
    }
}
