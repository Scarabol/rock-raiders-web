import { Vector2, Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { JobCreateEvent } from '../event/WorldEvents'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../params'
import { BaseEntity } from './model/BaseEntity'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingSite } from './model/building/BuildingSite'
import { EntityType } from './model/EntityType'
import { Surface } from './model/map/Surface'
import { MaterialEntity } from './model/material/MaterialEntity'
import { Bat } from './model/monster/Bat'
import { RockMonster } from './model/monster/RockMonster'
import { SmallSpider } from './model/monster/SmallSpider'
import { Raider } from './model/raider/Raider'
import { RaiderTraining } from './model/raider/RaiderTraining'
import { Selectable, SelectionType } from './model/Selectable'
import { VehicleEntity } from './model/vehicle/VehicleEntity'

export class EntityManager {

    selectedEntities: Selectable[] = []
    selectionType: SelectionType = null
    buildings: BuildingEntity[] = []
    buildingsUndiscovered: BuildingEntity[] = []
    raiders: Raider[] = []
    raidersUndiscovered: Raider[] = []
    materials: MaterialEntity[] = []
    materialsUndiscovered: MaterialEntity[] = []
    buildingSites: BuildingSite[] = []
    spiders: SmallSpider[] = []
    bats: Bat[] = []
    rockMonsters: RockMonster[] = []
    vehicles: VehicleEntity[] = []
    vehiclesUndiscovered: VehicleEntity[] = []

    reset() {
        this.selectedEntities = []
        this.selectionType = null
        this.buildings = []
        this.buildingsUndiscovered = []
        this.raiders = []
        this.raidersUndiscovered = []
        this.materials = []
        this.materialsUndiscovered = []
        this.buildingSites = []
        this.spiders = []
        this.bats = []
        this.rockMonsters = []
        this.vehicles = []
        this.vehiclesUndiscovered = []
    }

    start() {

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
        const targetBuildings = this.getBuildingsByType(...buildingTypes)
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

    getTrainingSites(training: RaiderTraining): BuildingEntity[] {
        return this.buildings.filter((b) => b.isTrainingSite(training))
    }

    getMaxRaiders(): number {
        return MAX_RAIDER_BASE + this.buildings.count((b) => b.isUsable() && b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE
        this.discoverEntities(this.raidersUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.buildingsUndiscovered, minX, maxX, minZ, maxZ)
        this.discoverEntities(this.materialsUndiscovered, minX, maxX, minZ, maxZ)
    }

    discoverEntities(undiscovered: BaseEntity[], minX, maxX, minZ, maxZ) {
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

    get selectedSurface(): Surface {
        return this.selectionType === SelectionType.SURFACE && this.selectedEntities.length > 0 ? this.selectedEntities[0] as Surface : null
    }

    get selectedBuilding(): BuildingEntity {
        return this.selectionType === SelectionType.BUILDING && this.selectedEntities.length > 0 ? this.selectedEntities[0] as BuildingEntity : null
    }

    get selectedRaiders(): Raider[] {
        return (this.selectionType === SelectionType.RAIDER || this.selectionType === SelectionType.GROUP) && this.selectedEntities.length > 0 ? this.selectedEntities as Raider[] : []
    }

    get selectedVehicle(): VehicleEntity {
        return (this.selectionType === SelectionType.VEHICLE_MANED || this.selectionType === SelectionType.VEHICLE_EMPTY) && this.selectedEntities.length > 0 ? this.selectedEntities[0] as VehicleEntity : null
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.addToScene(worldPosition, 0)
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

}
