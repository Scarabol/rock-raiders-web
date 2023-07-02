import { Vector2, Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersAmountChangedEvent, SelectionChanged } from '../event/LocalEvents'
import { RaiderDiscoveredEvent } from '../event/WorldLocationEvent'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../params'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingSite } from './model/building/BuildingSite'
import { EntityType } from './model/EntityType'
import { GameSelection } from './model/GameSelection'
import { Surface } from './terrain/Surface'
import { MaterialEntity } from './model/material/MaterialEntity'
import { PathTarget } from './model/PathTarget'
import { Raider } from './model/raider/Raider'
import { RaiderTraining } from './model/raider/RaiderTraining'
import { updateSafe } from './model/Updateable'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { ECS, GameEntity } from './ECS'
import { PositionComponent } from './component/PositionComponent'
import { AnimatedSceneEntityComponent } from './component/AnimatedSceneEntityComponent'

export class EntityManager {
    ecs: ECS
    selection: GameSelection = new GameSelection()
    buildings: BuildingEntity[] = []
    buildingsUndiscovered: BuildingEntity[] = []
    raiders: Raider[] = []
    raidersUndiscovered: Raider[] = []
    raidersInBeam: Raider[] = []
    materials: MaterialEntity[] = []
    materialsUndiscovered: MaterialEntity[] = []
    placedFences: MaterialEntity[] = []
    buildingSites: BuildingSite[] = []
    spiders: GameEntity[] = []
    undiscoveredSpiders: GameEntity[] = []
    bats: GameEntity[] = []
    undiscoveredBats: GameEntity[] = []
    rockMonsters: GameEntity[] = []
    undiscoveredRockMonsters: GameEntity[] = []
    slugs: GameEntity[] = []
    vehicles: VehicleEntity[] = []
    vehiclesUndiscovered: VehicleEntity[] = []
    vehiclesInBeam: VehicleEntity[] = []
    completedBuildingSites: BuildingSite[] = []
    recordedEntities: GameEntity[] = []
    raiderScare: PositionComponent[] = []

    constructor() {
        // event handler must be placed here, because only this class knows the "actual" selection instance
        EventBus.registerEventListener(EventKey.DESELECT_ALL, () => {
            this.selection.deselectAll()
            EventBus.publishEvent(new SelectionChanged(this))
        })
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            this.buildings.forEach((b) => b.updateEnergyState())
        })
    }

    reset() {
        this.selection = new GameSelection()
        this.buildings.length = 0
        this.buildingsUndiscovered.length = 0
        this.raiders.length = 0
        this.raidersUndiscovered.length = 0
        this.raidersInBeam.length = 0
        this.materials.length = 0
        this.materialsUndiscovered.length = 0
        this.placedFences.length = 0
        this.buildingSites.length = 0
        this.spiders.length = 0
        this.undiscoveredSpiders.length = 0
        this.bats.length = 0
        this.undiscoveredBats.length = 0
        this.rockMonsters.length = 0
        this.undiscoveredRockMonsters.length = 0
        this.slugs.length = 0
        this.vehicles.length = 0
        this.vehiclesUndiscovered.length = 0
        this.vehiclesInBeam.length = 0
        this.completedBuildingSites.length = 0
        this.recordedEntities.length = 0
        this.raiderScare.length = 0
    }

    update(elapsedMs: number) {
        this.buildings.forEach((b) => updateSafe(b, elapsedMs))
        this.raiders.forEach((r) => updateSafe(r, elapsedMs))
        this.raidersInBeam.forEach((r) => updateSafe(r, elapsedMs))
        this.vehicles.forEach((v) => updateSafe(v, elapsedMs))
        this.vehiclesInBeam.forEach((v) => updateSafe(v, elapsedMs))
        this.completedBuildingSites.forEach((b) => updateSafe(b, elapsedMs))
    }

    stop() {
        EntityManager.disposeAll(this.buildings)
        EntityManager.disposeAll(this.buildingsUndiscovered)
        EntityManager.disposeAll(this.raiders)
        EntityManager.disposeAll(this.raidersUndiscovered)
        EntityManager.disposeAll(this.materials)
        EntityManager.disposeAll(this.materialsUndiscovered)
        EntityManager.disposeAll(this.placedFences)
        EntityManager.disposeAll(this.vehicles)
        EntityManager.disposeAll(this.vehiclesInBeam)
    }

    private static disposeAll(list: { disposeFromWorld: () => unknown }[]) {
        const copy = [...list]
        copy.forEach((e) => e.disposeFromWorld())
        list.length = 0
    }

    private getBuildingsByType(...buildingTypes: EntityType[]): BuildingEntity[] {
        return this.buildings.filter(b => b.isPowered() && buildingTypes.some(bt => b.entityType === bt))
    }

    getClosestBuildingByType(position: Vector3, ...buildingTypes: EntityType[]): BuildingEntity {
        return EntityManager.getClosestBuilding(this.getBuildingsByType(...buildingTypes), position)
    }

    getGetToolTargets(): PathTarget[] {
        return this.getBuildingsByType(EntityType.TOOLSTATION).map((b) => b.getToolPathTarget)
    }

    getBuildingCarryPathTargets(entityType: EntityType): PathTarget[] {
        return this.getBuildingsByType(entityType).map((b) => b.carryPathTarget)
    }

    getUpgradePathTargets(): PathTarget[] {
        return this.getBuildingsByType(EntityType.UPGRADE).map((b) => {
            // TODO can use drop/deposit target from upgrade building here?
            return PathTarget.fromBuilding(b, b.primaryPathSurface.getCenterWorld2D())
        })
    }

    hasBuilding(buildingType: EntityType): boolean {
        return this.buildings.some((b) => b.buildingType.entityType === buildingType)
    }

    getTrainingSiteTargets(training: RaiderTraining): PathTarget[] {
        const targets: PathTarget[] = []
        this.buildings.filter((b) => b.isTrainingSite(training)).map((b) => b.getTrainingTargets().forEach((t) => targets.push(t)))
        return targets
    }

    hasTrainingSite(training: RaiderTraining): boolean {
        return this.buildings.some((b) => b.isTrainingSite(training))
    }

    hasUpgradeSite(): boolean {
        return this.buildings.some((b) => b.isPowered() && b.entityType === EntityType.UPGRADE)
    }

    private static getClosestBuilding(buildings: BuildingEntity[], position: Vector3) {
        let closest: BuildingEntity = null, minDist: number = null
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
        return MAX_RAIDER_BASE + this.buildings.count((b) => b.isPowered() && b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE
        const numRaidersUndiscovered = this.raidersUndiscovered.length
        this.raidersUndiscovered = EntityManager.removeInRect(this.raidersUndiscovered, minX, maxX, minZ, maxZ, (r) => {
            r.worldMgr.entityMgr.raiders.push(r)
            EventBus.publishEvent(new RaiderDiscoveredEvent(r.sceneEntity.position.clone()))
        })
        if (numRaidersUndiscovered !== this.raidersUndiscovered.length) EventBus.publishEvent(new RaidersAmountChangedEvent(this))
        this.buildingsUndiscovered = EntityManager.removeInRect(this.buildingsUndiscovered, minX, maxX, minZ, maxZ, (b) => {
            b.updateEnergyState()
            b.worldMgr.entityMgr.buildings.push(b)
            EventBus.publishEvent(new BuildingsChangedEvent(b.worldMgr.entityMgr))
        })
        this.materialsUndiscovered = EntityManager.removeInRect(this.materialsUndiscovered, minX, maxX, minZ, maxZ, (m) => {
            m.worldMgr.entityMgr.materials.push(m)
            m.setupCarryJob()
        })
        this.vehiclesUndiscovered = EntityManager.removeInRect(this.vehiclesUndiscovered, minX, maxX, minZ, maxZ, (v) => {
            v.worldMgr.entityMgr.vehicles.push(v)
            const driver = v.driver
            if (driver) {
                driver.worldMgr.entityMgr.raidersUndiscovered.remove(driver)
                driver.sceneEntity.visible = true
                driver.worldMgr.entityMgr.raiders.push(driver)
                EventBus.publishEvent(new RaiderDiscoveredEvent(driver.sceneEntity.position.clone()))
            }
        })
        this.undiscoveredSpiders = this.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
            this.spiders.push(m)
        })
        this.undiscoveredBats = this.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
            this.bats.push(m)
        })
        this.undiscoveredRockMonsters = this.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
            this.rockMonsters.push(m)
        })
    }

    private static removeInRect<T extends Raider | BuildingEntity | MaterialEntity | VehicleEntity>(listing: T[], minX: number, maxX: number, minZ: number, maxZ: number, onRemove: (e: T) => any) {
        return listing.filter((e) => {
            const pos = e.sceneEntity.position2D
            const discovered = pos.x >= minX && pos.x < maxX && pos.y >= minZ && pos.y < maxZ
            if (discovered) {
                e.sceneEntity.visible = true
                onRemove(e)
            }
            return !discovered
        })
    }

    private removeInRectNew(listing: GameEntity[], minX: number, maxX: number, minZ: number, maxZ: number, onRemove: (e: GameEntity) => any) {
        return listing.filter((e) => {
            const pos = this.ecs.getComponents(e).get(PositionComponent).position
            const discovered = pos.x >= minX && pos.x < maxX && pos.z >= minZ && pos.z < maxZ
            if (discovered) {
                this.ecs.getComponents(e).get(AnimatedSceneEntityComponent).sceneEntity.visible = true
                onRemove(e)
            }
            return !discovered
        })
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.sceneEntity.addToScene(item.worldMgr.sceneMgr, worldPosition, null)
        if (item.sceneEntity.visible) {
            this.materials.push(item) // TODO use game entities within entity manager
            item.setupCarryJob()
        } else {
            this.materialsUndiscovered.push(item) // TODO use game entities within entity manager
        }
        return item
    }

    hasMaxRaiders(): boolean {
        return this.raiders.length >= MAX_RAIDER_BASE + this.buildings.count((b) => b.isPowered() && b.entityType === EntityType.BARRACKS) * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    findTeleportBuilding(entityType: EntityType): BuildingEntity {
        return this.buildings.find((b) => b.canTeleportIn(entityType))
    }

    hasProfessional(training: RaiderTraining) {
        return this.raiders.some((r) => r.hasTraining(training))
    }

    addEntity(entity: GameEntity, entityType: EntityType) {
        const discovered = this.ecs.getComponents(entity).get(PositionComponent)?.isDiscovered()
        switch (entityType) {
            case EntityType.BAT:
                if (discovered) this.bats.add(entity)
                else this.undiscoveredBats.add(entity)
                break
            case EntityType.SMALL_SPIDER:
                if (discovered) this.spiders.add(entity)
                else this.undiscoveredSpiders.add(entity)
                break
            case EntityType.ROCK_MONSTER:
            case EntityType.ICE_MONSTER:
            case EntityType.LAVA_MONSTER:
                if (discovered) this.rockMonsters.add(entity)
                else this.undiscoveredRockMonsters.add(entity)
                break
            case EntityType.ORE | EntityType.CRYSTAL | EntityType.BRICK | EntityType.BARRIER | EntityType.DYNAMITE | EntityType.ELECTRIC_FENCE:
                // if (discovered) this.materials.add(entity) // TODO use game entities within entity manager
                // else this.materialsUndiscovered.add(entity) // TODO use game entities within entity manager
                break
        }
    }

    removeEntity(entity: GameEntity, entityType: EntityType) {
        switch (entityType) {
            case EntityType.BAT:
                this.bats.remove(entity)
                this.undiscoveredBats.remove(entity)
                break
            case EntityType.SMALL_SPIDER:
                this.spiders.remove(entity)
                this.undiscoveredSpiders.remove(entity)
                break
            case EntityType.ROCK_MONSTER:
            case EntityType.ICE_MONSTER:
            case EntityType.LAVA_MONSTER:
                this.rockMonsters.remove(entity)
                this.undiscoveredRockMonsters.remove(entity)
                break
            case EntityType.ORE | EntityType.CRYSTAL | EntityType.BRICK | EntityType.BARRIER | EntityType.DYNAMITE | EntityType.ELECTRIC_FENCE:
                // if (discovered) this.materials.remove(entity) // TODO use game entities within entity manager
                // else this.materialsUndiscovered.remove(entity) // TODO use game entities within entity manager
                break
        }
    }
}
