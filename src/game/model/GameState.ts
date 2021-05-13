import { Vector3 } from 'three'
import { LevelRewardConfig } from '../../cfg/LevelsCfg'
import { EventBus } from '../../event/EventBus'
import { SelectionChanged } from '../../event/LocalEvents'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../../params'
import { BaseEntity } from './BaseEntity'
import { BuildingEntity } from './building/BuildingEntity'
import { BuildingSite } from './building/BuildingSite'
import { MaterialEntity } from './collect/MaterialEntity'
import { EntityType } from './EntityType'
import { PriorityList } from './job/PriorityList'
import { Surface } from './map/Surface'
import { Bat } from './monster/Bat'
import { SmallSpider } from './monster/SmallSpider'
import { Raider } from './raider/Raider'
import { RaiderTraining, RaiderTrainingSites, RaiderTrainingStatsProperty } from './raider/RaiderTraining'
import { Selectable, SelectionType } from './Selectable'

export enum GameResultState {

    RUNNING,
    COMPLETE,
    FAILED,

}

export class GameState {

    static resultState: GameResultState = GameResultState.RUNNING
    static numCrystal: number = 0
    static numOre: number = 0
    static numBrick: number = 0
    static usedCrystals: number = 0
    static neededCrystals: number = 0
    static airLevel: number = 1 // air level in percent from 0 to 1.0
    static selectedEntities: Selectable[] = []
    static selectionType: SelectionType = null
    static buildings: BuildingEntity[] = []
    static buildingsUndiscovered: BuildingEntity[] = []
    static raiders: Raider[] = []
    static raidersUndiscovered: Raider[] = []
    static requestedRaiders: number = 0
    static materials: MaterialEntity[] = []
    static materialsUndiscovered: MaterialEntity[] = []
    static buildingSites: BuildingSite[] = []
    static spiders: SmallSpider[] = []
    static spidersBySurface: Map<Surface, SmallSpider[]> = new Map()
    static bats: Bat[] = []
    static totalCrystals: number = 0
    static totalOres: number = 0
    static totalDiggables: number = 0
    static remainingDiggables: number = 0
    static totalCaverns: number = 0
    static discoveredCaverns: number = 0
    static levelStartTime: number = 0
    static levelStopTime: number = 0
    static rewardConfig: LevelRewardConfig = null
    static priorityList: PriorityList = new PriorityList()
    static oxygenRate: number = 0
    static buildModeSelection: BuildingEntity = null

    static reset() {
        this.resultState = GameResultState.RUNNING
        this.numCrystal = 0
        this.numOre = 0
        this.numBrick = 0
        this.usedCrystals = 0
        this.neededCrystals = 0
        this.airLevel = 1
        this.selectedEntities = []
        this.selectionType = null
        this.buildings = []
        this.buildingsUndiscovered = []
        this.raiders = []
        this.raidersUndiscovered = []
        this.requestedRaiders = 0
        this.materials = []
        this.materialsUndiscovered = []
        this.buildingSites = []
        this.spiders = []
        this.spidersBySurface = new Map()
        this.bats = []
        this.totalCrystals = 0
        this.totalOres = 0
        this.totalDiggables = 0
        this.remainingDiggables = 0
        this.totalCaverns = 0
        this.discoveredCaverns = 0
        this.levelStartTime = 0
        this.levelStopTime = 0
        this.rewardConfig = null
        this.priorityList = new PriorityList()
        this.oxygenRate = 0
        this.buildModeSelection = null
    }

    static getBuildingsByType(...buildingTypes: EntityType[]): BuildingEntity[] {
        return this.buildings.filter(b => b.isUsable() && buildingTypes.some(bt => b.entityType === bt))
    }

    static getClosestBuildingByType(position: Vector3, ...buildingTypes: EntityType[]): BuildingEntity {
        const targetBuildings = GameState.getBuildingsByType(...buildingTypes)
        let closest = null, minDist = null
        targetBuildings.forEach((b) => {
            const bPos = b.getDropPosition()
            const dist = position.distanceToSquared(bPos) // TODO better use pathfinding
            if (closest === null || dist < minDist) {
                closest = b
                minDist = dist
            }
        })
        return closest
    }

    static getTrainingSites(training: RaiderTraining): BuildingEntity[] {
        return this.buildings.filter((b) => b.entityType === RaiderTrainingSites[training] && b.isUsable() && b.stats[RaiderTrainingStatsProperty[training]][b.level])
    }

    static selectEntities(entities: Selectable[]) {
        this.selectedEntities = this.selectedEntities.filter((previouslySelected) => {
            const stillSelected = entities.indexOf(previouslySelected) !== -1
            if (!stillSelected) previouslySelected.deselect()
            return stillSelected
        })
        // add new entities that are selectable
        entities.forEach((freshlySelected) => {
            if (freshlySelected.select()) {
                this.selectedEntities.push(freshlySelected)
            }
        })
        // determine and set next selection type
        const len = this.selectedEntities.length
        if (len > 1) {
            this.selectionType = SelectionType.GROUP
        } else if (len === 1) {
            this.selectionType = this.selectedEntities[0].getSelectionType()
        } else if (this.selectionType !== null) {
            this.selectionType = SelectionType.NOTHING
        }
        // AFTER updating selected entities and selection type, publish all events
        EventBus.publishEvent(new SelectionChanged(this.selectionType, this.selectedSurface, this.selectedBuilding, this.selectedRaiders))
    }

    static getMaxRaiders(): number {
        return MAX_RAIDER_BASE + GameState.buildings.count((b) => b.isUsable() && b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    static discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE
        this.discoverEntities(this.raidersUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.buildingsUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.materialsUndiscovered, minX, maxX, minZ, maxZ)
    }

    static discoverEntities(undiscovered: BaseEntity[], minX, maxX, minZ, maxZ) {
        const discovered = []
        undiscovered.forEach((e) => {
            const pos = e.getPosition()
            if (pos.x >= minX && pos.x < maxX && pos.z >= minZ && pos.z < maxZ) {
                e.onDiscover()
                discovered.push(e)
            }
        })
        discovered.forEach((r) => undiscovered.remove(r))
    }

    static get gameTimeSeconds() {
        return Math.round((GameState.levelStopTime - GameState.levelStartTime) / 1000)
    }

    static get score() {
        if (!GameState.rewardConfig) return 0
        let quota = GameState.rewardConfig.quota
        let importance = GameState.rewardConfig.importance
        const scoreCrystals = GameState.numCrystal >= (quota.crystals || Infinity) ? importance.crystals : 0
        const scoreTimer = GameState.gameTimeSeconds <= (quota.timer || 0) ? importance.timer : 0
        const scoreCaverns = quota.caverns ? Math.min(1, GameState.discoveredCaverns / quota.caverns) * importance.caverns : 0
        const scoreConstructions = quota.constructions ? Math.min(1, GameState.buildings.length / quota.constructions * importance.constructions) : 0
        const scoreOxygen = GameState.airLevel * importance.oxygen
        const scoreFigures = GameState.raiders.length >= MAX_RAIDER_BASE ? importance.figures : 0
        return Math.round(scoreCrystals + scoreTimer + scoreCaverns + scoreConstructions + scoreOxygen + scoreFigures) / 100
    }

    static get selectedSurface(): Surface {
        return this.selectionType === SelectionType.SURFACE && this.selectedEntities.length > 0 ? this.selectedEntities[0] as Surface : null
    }

    static get selectedBuilding(): BuildingEntity {
        return this.selectionType === SelectionType.BUILDING && this.selectedEntities.length > 0 ? this.selectedEntities[0] as BuildingEntity : null
    }

    static get selectedRaiders(): Raider[] {
        return (this.selectionType === SelectionType.RAIDER || this.selectionType === SelectionType.GROUP) && this.selectedEntities.length > 0 ? this.selectedEntities as Raider[] : []
    }

    static get totalOre(): number {
        return this.numOre + this.numBrick * 5
    }

    static getNearbySpiders(entity: BaseEntity): SmallSpider[] {
        const terrain = entity.sceneMgr.terrain
        const currentSurface = terrain.getSurfaceFromWorld(entity.getPosition())
        const nearbySpiders: SmallSpider[] = []
        for (let x = currentSurface.x; x <= currentSurface.x + 1; x++) {
            for (let y = currentSurface.y; y <= currentSurface.y + 1; y++) {
                const surface = terrain.getSurface(x, y)
                nearbySpiders.push(...(GameState.spidersBySurface.get(surface) || []))
            }
        }
        return nearbySpiders
    }

}
