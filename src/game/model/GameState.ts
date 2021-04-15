import { BuildingEntity } from '../../scene/model/BuildingEntity'
import { Building } from './entity/building/Building'
import { Selectable, SelectionType } from './Selectable'
import { Raider } from '../../scene/model/Raider'
import { VehicleEntity } from '../../scene/model/VehicleEntity'
import { CollectableEntity, CollectableType } from '../../scene/model/collect/CollectableEntity'
import { Vector3 } from 'three'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../../main'
import { Surface } from '../../scene/model/map/Surface'
import { BaseEntity } from '../../scene/model/BaseEntity'
import { EventBus } from '../../event/EventBus'
import { EntityDeselected } from '../../event/LocalEvents'
import { BuildingSite } from '../../scene/model/BuildingSite'
import { Dynamite } from '../../scene/model/collect/Dynamite'
import { Crystal } from '../../scene/model/collect/Crystal'
import { Ore } from '../../scene/model/collect/Ore'
import { LevelRewardConfig } from '../../cfg/LevelsCfg'
import { PriorityList } from './job/PriorityList'
import { SmallSpider } from './entity/monster/SmallSpider'
import { Bat } from './entity/monster/Bat'
import { removeFromArray } from '../../core/Util'

export enum GameResultState {

    RUNNING,
    COMPLETE,
    FAILED,

}

export class GameState {

    static resultState: GameResultState = GameResultState.RUNNING
    static levelFullName: string = ''
    static numCrystal: number = 0
    static numOre: number = 0
    static numBrick: number = 0
    static usedCrystals: number = 0
    static neededCrystals: number = 0
    static airlevel: number = 1 // airlevel in percent from 0 to 1.0
    static selectedEntities: Selectable[] = []
    static selectionType: SelectionType = null
    static buildings: BuildingEntity[] = []
    static buildingsUndiscovered: BuildingEntity[] = []
    static raiders: Raider[] = []
    static raidersUndiscovered: Raider[] = []
    static requestedRaiders: number = 0
    static vehicles: VehicleEntity[] = []
    static vehiclesUndiscovered: VehicleEntity[] = []
    static collectables: CollectableEntity[] = []
    static collectablesUndiscovered: CollectableEntity[] = []
    static buildingSites: BuildingSite[] = []
    static spiders: SmallSpider[] = []
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
    static priorityList: PriorityList = null

    static reset() {
        this.resultState = GameResultState.RUNNING
        this.levelFullName = ''
        this.numCrystal = 0
        this.numOre = 0
        this.numBrick = 0
        this.usedCrystals = 0
        this.neededCrystals = 0
        this.airlevel = 1
        this.selectedEntities = []
        this.selectionType = null
        this.buildings = []
        this.buildingsUndiscovered = []
        this.raiders = []
        this.raidersUndiscovered = []
        this.requestedRaiders = 0
        this.vehicles = []
        this.vehiclesUndiscovered = []
        this.collectables = []
        this.collectablesUndiscovered = []
        this.buildingSites = []
        this.spiders = []
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
        this.priorityList = null
    }

    static getBuildingsByType(...buildingTypes: Building[]): BuildingEntity[] {
        return this.buildings.filter(b => b.isPowered() && buildingTypes.some(bt => b.type === bt))
    }

    static getClosestBuildingByType(position: Vector3, ...buildingTypes: Building[]): BuildingEntity {
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

    static getClosestSiteThatRequires(position: Vector3, collectableType: CollectableType): BuildingSite {
        let closest = null, minDist = null
        this.buildingSites.forEach((b) => {
            const bPos = b.getPosition()
            const dist = position.distanceToSquared(bPos)
            if ((closest === null || dist < minDist) && b.needs(collectableType)) {
                closest = b
                minDist = dist
            }
        })
        return closest
    }

    static hasBuildingWithUpgrades(building: Building, upgrades: number): boolean {
        return this.buildings.some((b) => b.type === building && b.level >= upgrades)
    }

    static hasVehicleWithSkill(skillName: string): boolean {
        return false // TODO implement vehicles
    }

    static getClosestTrainingSite(position: Vector3, training: string): BuildingEntity {
        if (training === 'demolition') { // FIXME refactor this
            const targetBuildings = this.buildings.filter((b) => {
                return b.stats.TrainDynamite && b.stats.TrainDynamite[b.level]
            })
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
        return null
    }

    static selectEntities(entities: Selectable[]) {
        this.selectedEntities = this.selectedEntities.filter((previouslySelected) => {
            const stillSelected = entities.indexOf(previouslySelected) !== -1
            if (!stillSelected) previouslySelected.deselect()
            return stillSelected
        })
        // add new entities that are selectable
        const selectionEvents = []
        entities.forEach((freshlySelected) => {
            const selectionEvent = freshlySelected.select()
            if (selectionEvent) {
                this.selectedEntities.push(freshlySelected)
                selectionEvents.push(selectionEvent)
            }
        })
        // determine and set next selection type
        const len = this.selectedEntities.length
        if (len > 1) {
            this.selectionType = SelectionType.GROUP
        } else if (len === 1) {
            this.selectionType = this.selectedEntities[0].getSelectionType()
        } else if (this.selectionType !== null) {
            this.selectionType = null
            EventBus.publishEvent(new EntityDeselected())
        }
        // AFTER updating selected entities and selection type, publish all events
        selectionEvents.forEach((event) => EventBus.publishEvent(event))
    }

    static getMaxRaiders(): number {
        return MAX_RAIDER_BASE + this.getBuildingsByType(Building.BARRACKS).length * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    static discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE
        this.discoverEntities(this.raidersUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.buildingsUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.vehiclesUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.collectablesUndiscovered, minX, maxX, minZ, maxZ)
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
        discovered.forEach((r) => removeFromArray(undiscovered, r))
    }

    static dropMaterial(type: CollectableType, quantity: number): CollectableEntity[] {
        const result = []
        if (type === CollectableType.DYNAMITE) {
            for (let c = 0; c < quantity; c++) result.push(new Dynamite())
        } else if (type === CollectableType.CRYSTAL) {
            while (GameState.numCrystal > 0 && result.length < quantity) {
                GameState.numCrystal--
                result.push(new Crystal())
            }
        } else if (type === CollectableType.ORE) {
            while (GameState.numOre > 0 && result.length < quantity) {
                GameState.numOre--
                result.push(new Ore())
            }
        } else {
            console.error('Material drop not yet implemented: ' + type)
        }
        return result
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
        const scoreOxygen = GameState.airlevel * importance.oxygen
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
        return (this.selectionType === SelectionType.PILOT || this.selectionType === SelectionType.GROUP) && this.selectedEntities.length > 0 ? this.selectedEntities as Raider[] : []
    }

}
