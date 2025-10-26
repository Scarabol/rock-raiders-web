/** Function documentation mostly copied from the following URLs
 *
 * https://kb.rockraidersunited.com/User:Jessietail/NERPs_reference
 * https://web.archive.org/web/20131206122442/http://rru-stuff.org/nerpfuncs.html
 * https://kb.rockraidersunited.com/NERPs_documentation
 *
 */
import { WorldManager } from '../game/WorldManager'
import { EntityType } from '../game/model/EntityType'
import { GAME_RESULT_STATE } from '../game/model/GameResult'
import { GameState } from '../game/model/GameState'
import { NerpReturnType, NerpScript } from './NerpScript'
import { NERP_EXECUTION_INTERVAL } from '../params'
import { GameResultEvent, MaterialAmountChanged, MonsterEmergeEvent, NerpMessageEvent, NerpSuppressArrowEvent, RequestedRaidersChanged, WorldLocationEvent } from '../event/WorldEvents'
import { PositionComponent } from '../game/component/PositionComponent'
import { SurfaceType } from '../game/terrain/SurfaceType'
import { MonsterSpawner } from '../game/factory/MonsterSpawner'
import { AnimatedSceneEntityComponent } from '../game/component/AnimatedSceneEntityComponent'
import { ANIM_ENTITY_ACTIVITY, SLUG_ACTIVITY } from '../game/model/anim/AnimationActivity'
import { SLUG_BEHAVIOR_STATE, SlugBehaviorComponent } from '../game/component/SlugBehaviorComponent'
import { GameConfig } from '../cfg/GameConfig'
import { EventBroker } from '../event/EventBroker'
import { SoundManager } from '../audio/SoundManager'
import { EventKey } from '../event/EventKeyEnum'
import { GuiButtonBlinkEvent, ShowMissionBriefingEvent } from '../event/LocalEvents'
import { NerpMessage } from '../resource/fileparser/NerpMsgParser'
import { Surface } from '../game/terrain/Surface'
import { MaterialSpawner } from '../game/factory/MaterialSpawner'
import { PRIORITY_IDENTIFIER } from '../game/model/job/PriorityIdentifier'
import { BaseEvent } from '../event/EventTypeMap'
import { RaiderTrainings } from '../game/model/raider/RaiderTraining'
import { clearIntervalSafe, isNum } from '../core/Util'
import { RaiderTools } from '../game/model/raider/RaiderTool'
import { JOB_STATE } from '../game/model/job/JobState'
import { PRNG } from '../game/factory/PRNG'
import { SaveGameManager } from '../resource/SaveGameManager'

interface IconClickedEntry {
    iconName: string
    buttonType: string
    eventKey?: EventKey
}

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class NerpRunner {
    static readonly iconClickedConfig: IconClickedEntry[] = [
        {iconName: 'dig', buttonType: 'Interface_MenuItem_Dig', eventKey: EventKey.COMMAND_CREATE_DRILL_JOB},
        {iconName: 'dynamite', buttonType: 'Interface_MenuItem_Dynamite', eventKey: EventKey.COMMAND_CREATE_DYNAMITE_JOB},
        {iconName: 'goBack', buttonType: 'InterfaceBackButton', eventKey: EventKey.GUI_GO_BACK_BUTTON_CLICKED},
        {iconName: 'teleport', buttonType: 'Interface_MenuItem_TeleportMan'},
        {iconName: 'layPath', buttonType: 'Interface_MenuItem_LayPath', eventKey: EventKey.COMMAND_CREATE_POWER_PATH},
        {iconName: 'placeFence', buttonType: 'Interface_MenuItem_PlaceFence', eventKey: EventKey.COMMAND_PLACE_FENCE},
        {iconName: 'mount', buttonType: 'Interface_MenuItem_GetIn', eventKey: EventKey.COMMAND_VEHICLE_GET_MAN},
        {iconName: 'dismount', buttonType: 'Interface_MenuItem_GetOut', eventKey: EventKey.COMMAND_VEHICLE_DRIVER_GET_OUT},
        {iconName: 'upgradeBuilding', buttonType: 'Interface_MenuItem_UpgradeBuilding', eventKey: EventKey.COMMAND_UPGRADE_BUILDING},
        {iconName: 'build', buttonType: 'Interface_MenuItem_BuildBuilding', eventKey: EventKey.GUI_BUILD_BUILDING_BUTTON_CLICKED},
        {iconName: 'teleportPad', buttonType: EntityType.TELEPORT_PAD},
        {iconName: 'powerStation', buttonType: EntityType.POWER_STATION},
        {iconName: 'barracks', buttonType: EntityType.BARRACKS},
        {iconName: 'geodome', buttonType: EntityType.GEODOME},
        {iconName: 'gunStation', buttonType: EntityType.GUNSTATION},
        {iconName: 'vehicleTransport', buttonType: EntityType.TELEPORT_BIG},
        {iconName: 'dynamite', buttonType: 'Interface_MenuItem_Dynamite'},
        {iconName: 'getTool', buttonType: 'Interface_MenuItem_GetTool', eventKey: EventKey.GUI_GET_TOOL_BUTTON_CLICKED},
        {iconName: 'getPusher', buttonType: 'Interface_MenuItem_GetPusherGun'}, // XXX Complete list and track all tool types here
        {iconName: 'getSonicBlaster', buttonType: 'Interface_MenuItem_GetBirdScarer'},
        {iconName: 'dropSonicBlaster', buttonType: 'Interface_MenuItem_DropBirdScarer'},
        {iconName: 'train', buttonType: 'Interface_MenuItem_TrainSkill', eventKey: EventKey.GUI_TRAIN_RAIDER_BUTTON_CLICKED},
        {iconName: 'trainDriver', buttonType: 'Interface_MenuItem_TrainDriver'}, // XXX Complete list and track all raider trainings here
        {iconName: 'trainSailor', buttonType: 'Interface_MenuItem_TrainSailor'},
        {iconName: 'trainPilot', buttonType: 'Interface_MenuItem_TrainPilot'},
        {iconName: 'callToArms', buttonType: 'PanelButton_TopPanel_CallToArms'},
    ]

    static debug = false
    static timeAddedAfterSample = 0

    readonly registers = new Array(8).fill(0)
    readonly timers = new Array(4).fill(0)
    interval?: NodeJS.Timeout
    programCounter: number = 0
    // more state variables and switches
    messagePermit: boolean = true
    objectiveSwitch: boolean = true
    objectiveShowing: boolean = true
    sampleLengthMultiplier: number = 0
    timeForNoSample: number = 0
    currentMessage: number = -1
    messageTimerMs: number = 0
    messageSfx?: AudioBufferSourceNode
    tutoBlocksById: Map<number, Surface[]> = new Map()
    iconClicked: Map<string, number> = new Map()
    buildingsTeleported: number = 0
    numRequestedRaiders: number = 0

    constructor(readonly worldMgr: WorldManager, readonly script: NerpScript, readonly messages: NerpMessage[]) {
        NerpRunner.timeAddedAfterSample = 0
        if (NerpRunner.debug) console.log(`Executing following script\n${this.script.lines.join('\n')}`)
        EventBroker.subscribe(EventKey.NERP_MESSAGE_NEXT, () => {
            this.currentMessage = -1
            this.messageTimerMs = 0
            this.messageSfx?.stop()
            this.messageSfx = undefined
        })
        EventBroker.subscribe(EventKey.GAME_RESULT_STATE, () => {
            this.stop()
        })
        EventBroker.subscribe(EventKey.SHOW_MISSION_BRIEFING, (event: ShowMissionBriefingEvent) => {
            this.objectiveShowing = event.isShowing
            this.objectiveSwitch = this.objectiveSwitch && event.isShowing
        })
        NerpRunner.iconClickedConfig.forEach((iconCLickedEntry: IconClickedEntry) => {
            if (!iconCLickedEntry.eventKey) return
            EventBroker.subscribe(iconCLickedEntry.eventKey, () => {
                const iconName = iconCLickedEntry.iconName.toLowerCase()
                this.iconClicked.upsert(iconName, (current) => (current || 0) + 1)
            })
        })
        EventBroker.subscribe(EventKey.REQUESTED_RAIDERS_CHANGED, (event: RequestedRaidersChanged) => {
            const increased = event.numRequested > this.numRequestedRaiders
            this.numRequestedRaiders = event.numRequested
            if (!increased) return
            this.iconClicked.upsert('teleport', (current) => (current || 0) + 1)
        })
        EventBroker.subscribe(EventKey.COMMAND_SELECT_BUILD_MODE, (event) => {
            const iconConfig = NerpRunner.iconClickedConfig.find((c) => c.buttonType.toLowerCase() === event.entityType.toLowerCase())
            if (iconConfig) this.iconClicked.upsert(iconConfig.iconName.toLowerCase(), (current) => (current || 0) + 1)
        })
        EventBroker.subscribe(EventKey.COMMAND_PICK_TOOL, (event) => {
            const itemKey = RaiderTools.toInterfaceItemKey(event.tool)
            const iconClickedEntry = NerpRunner.iconClickedConfig.find((cfg) => cfg.buttonType.toLowerCase() === itemKey.toLowerCase())
            if (!iconClickedEntry) return
            this.iconClicked.upsert(iconClickedEntry.iconName.toLowerCase(), (current) => (current || 0) + 1)
        })
        EventBroker.subscribe(EventKey.COMMAND_TRAIN_RAIDER, (event) => {
            const iconName = RaiderTrainings.toStatsProperty(event.training).toLowerCase()
            this.iconClicked.upsert(iconName, (current) => (current || 0) + 1)
        })
        EventBroker.subscribe(EventKey.TOGGLE_ALARM, (event) => {
            this.iconClicked.upsert('callToArms'.toLowerCase(), (current) => (current || 0) + 1)
        })
    }

    start() {
        this.interval = setInterval(() => this.execute(), NERP_EXECUTION_INTERVAL)
    }

    stop() {
        this.interval = clearIntervalSafe(this.interval)
    }

    /**
     * Internally used to validate and parse a register number.
     * @param register
     * @return {number}
     */
    checkRegister(register: string): number {
        const num = Number(register)
        if (!isNum(num) || num < 0 || num > this.registers.length) throw new Error(`Invalid register (${register}) provided`)
        return num
    }

    /**
     * Internally used to validate and parse a value before setting or adding it with a register.
     * @param value
     * @return {number}
     */
    checkRegisterValue(value: number): number {
        if (!isNum(value)) throw new Error(`Invalid register value (${value}) provided`)
        return value
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
    setR(register: string, value: number): void {
        const regNum = this.checkRegister(register)
        this.registers[regNum] = this.checkRegisterValue(value)
    }

    /**
     * Adds the given value to the given register, internally used to handle all registers with one method.
     * @param register the register to add to
     * @param value the value to add to the given register
     */
    addR(register: string, value: number): void {
        const regNum = this.checkRegister(register)
        this.registers[regNum] += this.checkRegisterValue(value)
    }

    /**
     * Subtracts the given value from the given register, internally used to handle all registers with one method.
     * @param register the register to subtract from
     * @param value the value to subtract from the given register
     */
    subR(register: string, value: number): void {
        const regNum = this.checkRegister(register)
        this.registers[regNum] -= this.checkRegisterValue(value)
    }

    /**
     * Set the respective timer to the given numerical value. Units are in milliseconds.
     * @param timer
     * @param value
     */
    setTimer(timer: number, value: number): void {
        if (isNaN(value)) throw new Error(`Can't set timer to NaN value: ${value}`)
        this.timers[timer] = new Date().getTime() + value
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
    setLevelCompleted(): void {
        console.log('Nerp runner marks level as complete')
        EventBroker.publish(new GameResultEvent(GAME_RESULT_STATE.complete))
    }

    /**
     * End the level as failure and show the score screen.
     */
    setLevelFail(): void {
        console.log(`NerpRunner marks level as failed; at line: ${this.script.lines[this.programCounter]}`)
        EventBroker.publish(new GameResultEvent(GAME_RESULT_STATE.failed))
    }

    /**
     * Sets tutorial flags
     * @param value a bitmask to set flags with
     */
    setTutorialFlags(value: number): void {
        // seems like value must be interpreted bitwise and sets a certain flag on each bit
        // seen so far:
        // 0 = 0x00 allow any click anywhere anytime
        // 3 = 0x11 disallow invalid clicks
        // 4095 = 0x111111111111 set all flags? (seen in Tutorial01 level)
        if (value === 4095) {
            // TODO Only used in tutorials
        } else if (value === 0) {
            // TODO Reset all flags?
        } else {
            console.warn('NERP function "setTutorialFlags" not yet implemented', value)
        }
    }

    setTutorialPointer(tutoBlockId: number, enabled: number): void {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            if (enabled) {
                t.mesh.objectPointer?.setTargetPosition(t.getCenterWorld(), t)
            } else {
                t.mesh.objectPointer?.hide()
            }
        })
    }

    setMessagePermit(allowMessages: number): void {
        this.messagePermit = !!allowMessages
    }

    setBuildingsUpgradeLevel(typeName: EntityType, level: number): void {
        this.worldMgr.entityMgr.buildings.forEach(b => {
            if (b.entityType === typeName) b.setLevel(level)
        })
    }

    setToolStoreLevel(level: number): void {
        this.setBuildingsUpgradeLevel(EntityType.TOOLSTATION, level)
    }

    setTeleportPadLevel(level: number): void {
        this.setBuildingsUpgradeLevel(EntityType.TELEPORT_PAD, level)
    }

    setDocksLevel(level: number): void {
        this.setBuildingsUpgradeLevel(EntityType.DOCKS, level)
    }

    setPowerStationLevel(level: number): void {
        this.setBuildingsUpgradeLevel(EntityType.POWER_STATION, level)
    }

    setBarracksLevel(level: number): void {
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

    generateSlug(): void {
        const slugHole = PRNG.nerp.sample(this.worldMgr.sceneMgr.terrain.slugHoles)
        if (!slugHole) return
        const slug = MonsterSpawner.spawnMonster(this.worldMgr, EntityType.SLUG, slugHole.getRandomPosition(), PRNG.animation.random() * 2 * Math.PI)
        const behaviorComponent = this.worldMgr.ecs.addComponent(slug, new SlugBehaviorComponent())
        const components = this.worldMgr.ecs.getComponents(slug)
        const sceneEntity = components.get(AnimatedSceneEntityComponent)
        sceneEntity.sceneEntity.setAnimation(SLUG_ACTIVITY.emerge, () => {
            sceneEntity.sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.stand)
            behaviorComponent.state = SLUG_BEHAVIOR_STATE.idle
        })
        EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_SLUG_EMERGE, components.get(PositionComponent)))
    }

    /**
     * Gets the number of crystals currently stored.
     * @return {number}
     */
    getCrystalsCurrentlyStored(): number {
        return GameState.numCrystal
    }

    getOreCurrentlyStored(): number {
        return GameState.numOreValue
    }

    setMessageTimerValues(sampleLengthMultiplier: number, timeAddedAfterSample: number, timeForNoSample: number): void {
        this.sampleLengthMultiplier = sampleLengthMultiplier
        NerpRunner.timeAddedAfterSample = timeAddedAfterSample
        this.timeForNoSample = timeForNoSample
    }

    getMessageTimer(): number {
        return this.messageTimerMs
    }

    cameraUnlock(): void {
        this.worldMgr.sceneMgr.birdViewControls.unlockCamera()
    }

    cameraLockOnObject(recordedEntity: number): void {
        const entity = this.worldMgr.entityMgr.recordedEntities[recordedEntity - 1]
        if (!entity) {
            console.warn(`Invalid recorded entity index ${recordedEntity} given`, this.worldMgr.entityMgr.recordedEntities)
            return
        }
        const sceneEntity = this.worldMgr.ecs.getComponents(entity).get(AnimatedSceneEntityComponent)?.sceneEntity
        if (!sceneEntity) {
            console.warn(`Given entity ${entity} has no scene entity to jump to`)
            return
        }
        this.worldMgr.sceneMgr.birdViewControls.lockOnObject(sceneEntity)
    }

    cameraLockOnMonster(monster: number): void {
        if (monster < 1) return
        const entity = this.worldMgr.entityMgr.rockMonsters[monster - 1]
        if (!entity) {
            console.warn(`Invalid monster entity index ${monster} given`, this.worldMgr.entityMgr.rockMonsters)
            return
        }
        const sceneEntity = this.worldMgr.ecs.getComponents(entity).get(AnimatedSceneEntityComponent)?.sceneEntity
        if (!sceneEntity) {
            console.warn(`Given entity ${entity} has no scene entity to jump to`)
            return
        }
        this.worldMgr.sceneMgr.birdViewControls.lockOnObject(sceneEntity)
    }

    setMessage(messageNumber: number, arrowDisabled: number): void {
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
        if (!SaveGameManager.preferences.muteDevSounds && msg.snd) {
            this.messageSfx = SoundManager.playVoice(msg.snd) || this.messageSfx
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
        EventBroker.publish(new BaseEvent(EventKey.NERP_MESSAGE_NEXT))
    }

    setRockMonsterAtTutorial(tutoBlockId: number): void {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            EventBroker.publish(new MonsterEmergeEvent(t))
        })
    }

    setCongregationAtTutorial(tutoBlockId: number): void {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} as congregation, using only first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return
        GameState.monsterCongregation = targetBlock.getCenterWorld2D()
    }

    setCameraGotoTutorial(tutoBlockId: number): void {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        if (tutoBlocks.length > 1) console.warn(`Invalid amount (${tutoBlocks.length}) of tuto blocks with id ${tutoBlockId} to move camera to, using only first one`)
        const targetBlock = tutoBlocks[0]
        if (!targetBlock) return
        this.worldMgr.sceneMgr.birdViewControls.forceMoveToTarget(targetBlock.getCenterWorld())
    }

    setTutorialBlockIsGround(tutoBlockId: number, state: number): void {
        if (state !== 1) console.warn(`Unexpected state (${state}) given for setTutorialBlockIsGround`)
        this.setTutorialBlock(tutoBlockId, SurfaceType.GROUND)
    }

    setTutorialBlockIsPath(tutoBlockId: number, state: number): void {
        if (state !== 1) console.warn(`Unexpected state (${state}) given for setTutorialBlockIsPath`)
        this.setTutorialBlock(tutoBlockId, SurfaceType.POWER_PATH)
    }

    private setTutorialBlock(tutoBlockId: number, surfaceType: SurfaceType): void {
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
        return GameState.tutoBlockClicks.getOrUpdate(tutoBlockId, () => 0)
    }

    setTutorialBlockClicks(tutoBlockId: number, numClicks: number): void {
        GameState.tutoBlockClicks.set(tutoBlockId, numClicks)
    }

    getUnitAtBlock(tutoBlockId: number): number {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return [...this.worldMgr.entityMgr.raiders, ...this.worldMgr.entityMgr.vehicles].count((e): boolean => {
            const surface = this.worldMgr.ecs.getComponents(e.entity).get(PositionComponent).surface
            return tutoBlocks.some((tutoBlock) => tutoBlock.discovered && surface === tutoBlock)
        })
    }

    getOxygenLevel(): number {
        return Math.round(GameState.airLevel * 100)
    }

    getObjectiveSwitch(): number {
        return this.objectiveSwitch ? 1 : 0
    }

    getObjectiveShowing(): number {
        return this.objectiveShowing ? 1 : 0
    }

    addPoweredCrystals(numCrystals: number): void {
        GameState.numCrystal += numCrystals
        EventBroker.publish(new MaterialAmountChanged())
    }

    addStoredOre(numOre: number): void {
        GameState.numOre += numOre
        EventBroker.publish(new MaterialAmountChanged())
    }

    disallowAll(): void {
        // TODO Only used in tutorials
    }

    getPoweredPowerStationsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.POWER_STATION)
    }

    getPoweredBarracksBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.isPowered() && b.entityType === EntityType.BARRACKS)
    }

    getRecordObjectAtTutorial(tutoBlockId: number): number {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        return this.worldMgr.entityMgr.recordedEntities.findIndex((entity): boolean => {
            const surface = this.worldMgr.ecs.getComponents(entity).get(PositionComponent).surface
            return tutoBlocks.some((tutoBlock) => surface === tutoBlock)
        }) + 1
    }

    getRecordObjectAmountAtTutorial(tutoBlockId: number): number {
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

    getHiddenObjectsFound(): number {
        return GameState.hiddenObjectsFound
    }

    getTeleportsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TELEPORT_PAD)
    }

    getLevel1TeleportsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TELEPORT_PAD && b.level >= 1)
    }

    getLevel2TeleportsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TELEPORT_PAD && b.level >= 2)
    }

    getLevel1PowerStationsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.POWER_STATION && b.level >= 1)
    }

    getBarracksBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.BARRACKS)
    }

    getLevel1BarracksBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.BARRACKS && b.level >= 1)
    }

    getVehicleTeleportsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.TELEPORT_BIG)
    }

    getGunStationsBuilt(): number {
        return this.worldMgr.entityMgr.buildings.count((b) => b.entityType === EntityType.GUNSTATION)
    }

    getRandom100(): number {
        return PRNG.nerp.randInt(100)
    }

    // noinspection SpellCheckingInspection
    supressArrow(state: number): void {
        EventBroker.publish(new NerpSuppressArrowEvent(!!state))
    }

    setGameSpeed(speed: number, unknown: number): void {
        if (unknown) console.warn(`Unexpected value (${unknown}) for second parameter given`)
        GameState.gameSpeedMultiplier = speed / 100
    }

    setRecordObjectPointer(recordedEntity: number): void {
        if (recordedEntity < 1) {
            this.worldMgr.sceneMgr.objectPointer.hide()
            return
        }
        const entity = this.worldMgr.entityMgr.recordedEntities[recordedEntity - 1]
        if (!entity) {
            console.warn(`Invalid entity ${recordedEntity} given`)
            return
        }
        const sceneEntity = this.worldMgr.ecs.getComponents(entity).get(AnimatedSceneEntityComponent)?.sceneEntity
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
    clickOnlyObjects(): void {
        // TODO Only used in tutorials
        console.warn('NERP function "clickOnlyObjects" not yet implemented')
    }

    /**
     * Tutorial01
     * - Allow to select only surfaces
     */
    clickOnlyMap(): void {
        // TODO Only used in tutorials
        console.warn('NERP function "clickOnlyMap" not yet implemented')
    }

    /**
     * Tutorial08
     */
    clickOnlyCallToArms(): void {
        // TODO Only used in tutorials
        console.warn('NERP function "clickOnlyMap" not yet implemented')
    }

    setCallToArms(args: any[]): void {
        // TODO Only used in tutorials
        console.warn('NERP function "setCallToArms" not yet implemented', args)
    }

    setTutorialCrystals(tutoBlockId: number, numOfCrystals: number): void {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            for (let c = 0; c < numOfCrystals; c++) {
                const crystal = MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, t.getRandomPosition(), PRNG.animation.random() * 2 * Math.PI)
                if (crystal.carryJob) crystal.carryJob.jobState = JOB_STATE.canceled
            }
        })
    }

    setCrystalPriority(targetIndex: number): void {
        GameState.priorityList.setPriorityIndex(PRIORITY_IDENTIFIER.crystal, 0)
    }

    cameraZoomOut(zoomLevel: number): void {
        if (zoomLevel < 0 || zoomLevel > 100) {
            console.warn(`Invalid camera zoom out level ${zoomLevel}`)
            return
        }
        const targetZoom = Math.round(zoomLevel / 100 * GameConfig.instance.main.maxDist)
        this.worldMgr.sceneMgr.birdViewControls.setZoom(targetZoom)
    }

    cameraZoomIn(zoomLevel: number): void {
        if (zoomLevel < GameConfig.instance.main.minDist || zoomLevel > GameConfig.instance.main.maxDist) {
            console.warn(`Unexpected camera zoom in level ${zoomLevel}. Must be in range from ${GameConfig.instance.main.minDist} to ${GameConfig.instance.main.maxDist}`)
            return
        }
        // XXX This should be consistent with cameraZoomOut
        this.worldMgr.sceneMgr.birdViewControls.setZoom(zoomLevel)
    }

    makeSomeoneOnThisBlockPickUpSomethingOnThisBlock(tutoBlockId: number): void {
        const tutoBlocks = this.tutoBlocksById.getOrUpdate(tutoBlockId, () => [])
        tutoBlocks.forEach((t) => {
            const raider = PRNG.nerp.sample(this.worldMgr.entityMgr.raiders.filter((r) => r.getSurface() === t && r.isReadyToTakeAJob()))
            if (!raider) return
            const material = PRNG.nerp.sample(this.worldMgr.entityMgr.materials.filter((m) => m.getSurface() === t && !m.carryJob?.hasFulfiller()))
            if (!material) return
            raider.setJob(material.setupCarryJob())
        })
    }

    setBuildingsTeleported(numBuildings: number): void {
        this.buildingsTeleported = numBuildings
    }

    getBuildingsTeleported(): number {
        return this.buildingsTeleported
    }

    getMiniFigureSelected(): number {
        return this.worldMgr.entityMgr.selection.raiders.length
    }

    getSmallDiggerSelected(): number {
        return this.worldMgr.entityMgr.selection.vehicles.count((v) => v.entityType === EntityType.SMALL_DIGGER)
    }

    getSmallTruckSelected(): number {
        return this.worldMgr.entityMgr.selection.vehicles.count((v) => v.entityType === EntityType.SMALL_TRUCK)
    }

    getRapidRiderSelected(): number {
        return this.worldMgr.entityMgr.selection.vehicles.count((v) => v.entityType === EntityType.SMALL_CAT)
    }

    getSmallHelicopterSelected(): number {
        return this.worldMgr.entityMgr.selection.vehicles.count((v) => v.entityType === EntityType.SMALL_HELI)
    }

    getGraniteGrinderSelected(): number {
        return this.worldMgr.entityMgr.selection.vehicles.count((v) => v.entityType === EntityType.WALKER_DIGGER)
    }

    getChromeCrusherSelected(): number {
        return this.worldMgr.entityMgr.selection.vehicles.count((v) => v.entityType === EntityType.LARGE_DIGGER)
    }

    getToolStoreSelected(): number {
        return this.worldMgr.entityMgr.selection.building?.entityType === EntityType.TOOLSTATION ? 1 : 0
    }

    getTeleportPadSelected(): number {
        return this.worldMgr.entityMgr.selection.building?.entityType === EntityType.TELEPORT_PAD ? 1 : 0
    }

    getPowerStationSelected(): number {
        return this.worldMgr.entityMgr.selection.building?.entityType === EntityType.POWER_STATION ? 1 : 0
    }

    getBarracksSelected(): number {
        return this.worldMgr.entityMgr.selection.building?.entityType === EntityType.BARRACKS ? 1 : 0
    }

    getMiniFigureInSmallDigger(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.SMALL_DIGGER && !!v.driver)
    }

    getMiniFigureInSmallTruck(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.SMALL_TRUCK && !!v.driver)
    }

    getMiniFigureInRapidRider(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.SMALL_CAT && !!v.driver)
    }

    getMiniFigureInSmallHelicopter(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.SMALL_HELI && !!v.driver)
    }

    getMiniFigureInGraniteGrinder(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.WALKER_DIGGER && !!v.driver)
    }

    getMiniFigureInChromeCrusher(): number {
        return this.worldMgr.entityMgr.vehicles.count((v) => v.entityType === EntityType.LARGE_DIGGER && !!v.driver)
    }

    setMonsterAttackPowerStation(state: number): void {
        GameState.monsterAttackPowerStation = state === 1
    }

    setMonsterAttackNowT(args: any[]): void {
        // TODO Only used in tutorials
        console.warn('NERP function "setMonsterAttackNowT" not yet implemented', args)
    }

    callMethod(methodName: string, methodArgs: number[]): NerpReturnType {
        if (methodName === 'Stop') {
            throw new Error('Stop')
        } else if (methodName === 'TRUE') {
            return 1
        } else if (methodName === 'FALSE') {
            return 0
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
            const timer = Number(setTimerMatch[1])
            return this.setTimer(timer, methodArgs[0])
        }
        const getTimerMatch = methodName.match(/^GetTimer([0-3])$/)
        if (getTimerMatch) {
            const timer = Number(getTimerMatch[1])
            return this.getTimer(timer)
        }
        const flashIconMatch = methodName.match(/^Flash(.+)Icon$/)
        if (flashIconMatch) {
            const iconName = flashIconMatch[1]
            const iconClickedEntry = NerpRunner.iconClickedConfig.find((c) => c.iconName.toLowerCase() === iconName.toLowerCase())
            if (iconClickedEntry) {
                EventBroker.publish(new GuiButtonBlinkEvent(iconClickedEntry.buttonType, methodArgs[0] === 1))
                return
            } else {
                console.warn(`Could not flash icon "${iconName}"`)
            }
        }
        const setIconClickedMatch = methodName.match(/^Set(.+?)(?:Icon)?(?:Button)?Clicked$/)
        if (setIconClickedMatch) {
            const iconName = setIconClickedMatch[1]
            const iconClickedEntry = NerpRunner.iconClickedConfig.find((c) => c.iconName.toLowerCase() === iconName.toLowerCase())
            if (iconClickedEntry) {
                this.iconClicked.set(iconClickedEntry.iconName.toLowerCase(), methodArgs[0])
                return
            } else {
                console.warn(`Could not set icon "${iconName}" clicked`)
            }
        }
        const getIconClickedMatch = methodName.match(/^Get(.+?)(?:Icon)?(?:Button)?Clicked$/)
        if (getIconClickedMatch) {
            const iconName = getIconClickedMatch[1]
            const iconClickedEntry = NerpRunner.iconClickedConfig.find((c) => c.iconName.toLowerCase() === iconName.toLowerCase())
            if (iconClickedEntry) {
                return this.iconClicked.getOrUpdate(iconClickedEntry.iconName.toLowerCase(), () => 0)
            } else {
                console.warn(`Could not get icon "${iconName}" clicked`)
            }
        }
        const lMethodName = methodName.toLowerCase()
        const memberName = Object.getOwnPropertyNames(NerpRunner.prototype).find((name) => name.toLowerCase() === lMethodName) as keyof NerpRunner
        if (memberName) return (this[memberName] as Function)?.apply(this, methodArgs)
        throw new Error(`Undefined method: ${methodName}`)
    }

    execute() {
        try {
            this.messageTimerMs = this.messageTimerMs > 0 ? this.messageTimerMs - NERP_EXECUTION_INTERVAL : 0
            if (NerpRunner.debug) console.log(`Starting execution with registers set to ${this.registers}`)
            for (this.programCounter = 0; this.programCounter < this.script.statements.length; this.programCounter++) {
                const statement = this.script.statements[this.programCounter]
                if (NerpRunner.debug) {
                    console.log(`${this.programCounter}: ${this.script.lines[this.programCounter]}`)
                    console.log(statement)
                }
                statement.execute(this)
            }
        } catch (e) {
            if ((e as Error).message === 'Stop') {
                return
            }
            console.error(e)
            console.error('FATAL ERROR! Script execution failed! You can NOT win anymore!')
            this.stop()
        }
    }
}
