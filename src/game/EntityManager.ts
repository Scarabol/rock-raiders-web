import { Vector2, Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersChangedEvent, SelectionChanged, SelectPanelType } from '../event/LocalEvents'
import { JobCreateEvent } from '../event/WorldEvents'
import { RaiderDiscoveredEvent } from '../event/WorldLocationEvent'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../params'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingSite } from './model/building/BuildingSite'
import { EntityType } from './model/EntityType'
import { GameSelection } from './model/GameSelection'
import { Surface } from './model/map/Surface'
import { MaterialEntity } from './model/material/MaterialEntity'
import { Bat } from './model/monster/Bat'
import { RockMonster } from './model/monster/RockMonster'
import { SmallSpider } from './model/monster/SmallSpider'
import { Raider } from './model/raider/Raider'
import { RaiderTraining } from './model/raider/RaiderTraining'
import { updateSafe } from './model/Updateable'
import { VehicleEntity } from './model/vehicle/VehicleEntity'

export class EntityManager {

    selection: GameSelection = new GameSelection()
    buildings: BuildingEntity[] = []
    buildingsUndiscovered: BuildingEntity[] = []
    raiders: Raider[] = []
    raidersUndiscovered: Raider[] = []
    raidersInBeam: Raider[] = []
    materials: MaterialEntity[] = []
    materialsUndiscovered: MaterialEntity[] = []
    buildingSites: BuildingSite[] = []
    spiders: SmallSpider[] = []
    bats: Bat[] = []
    rockMonsters: RockMonster[] = []
    vehicles: VehicleEntity[] = []
    vehiclesUndiscovered: VehicleEntity[] = []

    constructor() {
        // event handler must be placed here, because only this class knows the "actual" selection instance
        EventBus.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            if (event.selectPanelType === SelectPanelType.NONE) this.selection.deselectAll()
        })
    }

    reset() {
        this.selection = new GameSelection()
        this.buildings = []
        this.buildingsUndiscovered = []
        this.raiders = []
        this.raidersUndiscovered = []
        this.raidersInBeam = []
        this.materials = []
        this.materialsUndiscovered = []
        this.buildingSites = []
        this.spiders = []
        this.bats = []
        this.rockMonsters = []
        this.vehicles = []
        this.vehiclesUndiscovered = []
    }

    update(elapsedMs: number) {
        this.raiders.forEach((r) => updateSafe(r, elapsedMs))
        this.raidersInBeam.forEach((r) => updateSafe(r, elapsedMs))
        this.buildings.forEach((b) => updateSafe(b, elapsedMs))
        this.raiders.forEach((r) => updateSafe(r, elapsedMs))
        this.spiders.forEach((s) => updateSafe(s, elapsedMs))
        this.bats.forEach((b) => updateSafe(b, elapsedMs))
    }

    stop() {
        this.buildings.forEach((b) => b.removeFromScene())
        this.buildingsUndiscovered.forEach((b) => b.removeFromScene())
        this.raiders.forEach((r) => r.removeFromScene())
        this.raidersUndiscovered.forEach((r) => r.removeFromScene())
        this.materials.forEach((m) => m.removeFromScene())
        this.materialsUndiscovered.forEach((m) => m.removeFromScene())
        this.spiders.forEach((m) => m.removeFromScene())
        this.bats.forEach((b) => b.removeFromScene())
    }

    getBuildingsByType(...buildingTypes: EntityType[]): BuildingEntity[] {
        return this.buildings.filter(b => b.isUsable() && buildingTypes.some(bt => b.entityType === bt))
    }

    getClosestBuildingByType(position: Vector3, ...buildingTypes: EntityType[]): BuildingEntity {
        return EntityManager.getClosestBuilding(this.getBuildingsByType(...buildingTypes), position)
    }

    getTrainingSites(training: RaiderTraining): BuildingEntity[] {
        return this.buildings.filter((b) => b.isTrainingSite(training))
    }

    getClosestTrainingSite(position: Vector3, training: RaiderTraining) {
        return EntityManager.getClosestBuilding(this.getTrainingSites(training), position)
    }

    private static getClosestBuilding(buildings: BuildingEntity[], position: Vector3) {
        let closest = null, minDist = null
        buildings.forEach((b) => {
            const bPos = b.sceneEntity.position.clone()
            const dist = position.distanceToSquared(bPos) // TODO better use pathfinding
            if (closest === null || dist < minDist) {
                closest = b
                minDist = dist
            }
        })
        return closest // TODO when using path finding, return path instead
    }

    getMaxRaiders(): number {
        return MAX_RAIDER_BASE + this.buildings.count((b) => b.isUsable() && b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE
        const numRaidersUndiscovered = this.raidersUndiscovered.length
        this.raidersUndiscovered = EntityManager.removeInRect(this.raidersUndiscovered, minX, maxX, minZ, maxZ, (r) => {
            r.entityMgr.raiders.push(r)
            EventBus.publishEvent(new RaiderDiscoveredEvent(r.sceneEntity.position.clone()))
        })
        if (numRaidersUndiscovered !== this.raidersUndiscovered.length) EventBus.publishEvent(new RaidersChangedEvent(this))
        this.buildingsUndiscovered = EntityManager.removeInRect(this.buildingsUndiscovered, minX, maxX, minZ, maxZ, (b) => {
            b.entityMgr.buildings.push(b)
            EventBus.publishEvent(new BuildingsChangedEvent(b.entityMgr))
        })
        this.materialsUndiscovered = EntityManager.removeInRect(this.materialsUndiscovered, minX, maxX, minZ, maxZ, (m) => {
            m.entityMgr.materials.push(m)
            EventBus.publishEvent(new JobCreateEvent(m.createCarryJob()))
        })
    }

    private static removeInRect<T extends Raider | BuildingEntity | MaterialEntity>(listing: T[], minX: number, maxX: number, minZ: number, maxZ: number, onRemove: (e: T) => any) {
        return listing.filter((e) => {
            const pos = e.sceneEntity.position2D.clone()
            const discovered = pos.x >= minX && pos.x < maxX && pos.y >= minZ && pos.y < maxZ
            if (discovered) {
                e.sceneEntity.visible = true
                onRemove(e)
            }
            return !discovered
        })
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.sceneEntity.addToScene(worldPosition, 0)
        if (item.sceneEntity.visible) {
            this.materials.push(item)
            EventBus.publishEvent(new JobCreateEvent(item.createCarryJob()))
        } else {
            this.materialsUndiscovered.push(item)
        }
        return item
    }

    getOxygenSum(): number {
        return this.raiders.map((r) => r.stats.OxygenCoef).reduce((l, r) => l + r, 0) +
            this.buildings.map((b) => b.isUsable() ? b.stats.OxygenCoef : 0).reduce((l, r) => l + r, 0)
    }

    hasMaxRaiders(): boolean {
        return this.raiders.length >= this.getMaxRaiders()
    }

    findTeleportBuilding(entityType: EntityType): BuildingEntity {
        return this.buildings.find((b) => b.canTeleportIn(entityType))
    }

}
