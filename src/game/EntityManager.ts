import { Vector2, Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersAmountChangedEvent, SelectionChanged } from '../event/LocalEvents'
import { JobCreateEvent } from '../event/WorldEvents'
import { RaiderDiscoveredEvent } from '../event/WorldLocationEvent'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../params'
import { AnimatedSceneEntityComponent } from './component/common/AnimatedSceneEntityComponent'
import { PositionComponent } from './component/common/PositionComponent'
import { AbstractGameEntity } from './entity/AbstractGameEntity'
import { AnimationGroup } from './model/anim/AnimationGroup'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingPathTarget } from './model/building/BuildingPathTarget'
import { BuildingSite } from './model/building/BuildingSite'
import { Disposable } from './model/Disposable'
import { EntityType } from './model/EntityType'
import { GameSelection } from './model/GameSelection'
import { BuildingCarryPathTarget } from './model/job/carry/BuildingCarryPathTarget'
import { Surface } from './model/map/Surface'
import { ElectricFence } from './model/material/ElectricFence'
import { MaterialEntity } from './model/material/MaterialEntity'
import { Raider } from './model/raider/Raider'
import { RaiderTraining } from './model/raider/RaiderTraining'
import { updateSafe } from './model/Updateable'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { SceneManager } from './SceneManager'

export class EntityManager {
    sceneMgr: SceneManager
    selection: GameSelection = new GameSelection()
    buildings: BuildingEntity[] = []
    buildingsUndiscovered: BuildingEntity[] = []
    raiders: Raider[] = []
    raidersUndiscovered: Raider[] = []
    raidersInBeam: Raider[] = []
    materials: MaterialEntity[] = []
    materialsUndiscovered: MaterialEntity[] = []
    tickingDynamite: Vector2[] = []
    placedFences: ElectricFence[] = []
    buildingSites: BuildingSite[] = []
    spiders: AbstractGameEntity[] = []
    undiscoveredSpiders: AbstractGameEntity[] = []
    bats: AbstractGameEntity[] = []
    undiscoveredBats: AbstractGameEntity[] = []
    rockMonsters: AbstractGameEntity[] = []
    undiscoveredRockMonsters: AbstractGameEntity[] = []
    vehicles: VehicleEntity[] = []
    vehiclesUndiscovered: VehicleEntity[] = []
    vehiclesInBeam: VehicleEntity[] = []
    completedBuildingSites: BuildingSite[] = []
    miscAnims: AnimationGroup[] = []

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
        this.buildings = [] // TODO separate from entities and move to BuildingManager or BaseManager
        this.buildingsUndiscovered = []
        this.raiders = []
        this.raidersUndiscovered = []
        this.raidersInBeam = []
        this.materials = []
        this.materialsUndiscovered = []
        this.tickingDynamite = []
        this.placedFences = []
        this.buildingSites = []
        this.spiders = []
        this.vehicles = []
        this.vehiclesUndiscovered = []
        this.vehiclesInBeam = []
        this.completedBuildingSites = []
        this.miscAnims = []
    }

    update(elapsedMs: number) {
        this.buildings.forEach((b) => updateSafe(b, elapsedMs))
        this.raiders.forEach((r) => updateSafe(r, elapsedMs))
        this.raidersInBeam.forEach((r) => updateSafe(r, elapsedMs))
        this.materials.forEach((m) => updateSafe(m, elapsedMs))
        this.placedFences.forEach((f) => updateSafe(f, elapsedMs))
        this.vehicles.forEach((v) => updateSafe(v, elapsedMs))
        this.vehiclesInBeam.forEach((v) => updateSafe(v, elapsedMs))
        this.completedBuildingSites.forEach((b) => updateSafe(b, elapsedMs))
        this.miscAnims.forEach((m) => updateSafe(m, elapsedMs))
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
        EntityManager.disposeAll(this.miscAnims)
    }

    private static disposeAll(list: Disposable[]) {
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

    getGetToolTargets(): BuildingPathTarget[] {
        return this.getBuildingsByType(EntityType.TOOLSTATION).map((b) => b.getToolPathTarget)
    }

    getBuildingCarryPathTargets(entityType: EntityType): BuildingCarryPathTarget[] {
        return this.getBuildingsByType(entityType).map((b) => b.carryPathTarget)
    }

    getTrainingSiteTargets(training: RaiderTraining): BuildingPathTarget[] {
        const targets: BuildingPathTarget[] = []
        this.buildings.filter((b) => b.isTrainingSite(training)).map((b) => b.getTrainingTargets().forEach((t) => targets.push(t)))
        return targets
    }

    hasTrainingSite(training: RaiderTraining): boolean {
        return this.buildings.some((b) => b.isTrainingSite(training))
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
            EventBus.publishEvent(new JobCreateEvent(m.createCarryJob()))
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
        this.undiscoveredSpiders = EntityManager.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
            this.spiders.push(m)
        })
        this.undiscoveredBats = EntityManager.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
            this.bats.push(m)
        })
        this.undiscoveredRockMonsters = EntityManager.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
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

    private static removeInRectNew(listing: AbstractGameEntity[], minX: number, maxX: number, minZ: number, maxZ: number, onRemove: (e: AbstractGameEntity) => any) {
        return listing.filter((e) => {
            const pos = e.getComponent(PositionComponent).getPosition2D()
            const discovered = pos.x >= minX && pos.x < maxX && pos.y >= minZ && pos.y < maxZ
            if (discovered) {
                e.getComponent(AnimatedSceneEntityComponent).makeVisible()
                onRemove(e)
            }
            return !discovered
        })
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.sceneEntity.addToScene(worldPosition, null)
        if (item.sceneEntity.visible) {
            this.materials.push(item)
            EventBus.publishEvent(new JobCreateEvent(item.createCarryJob()))
        } else {
            this.materialsUndiscovered.push(item)
        }
        return item
    }

    getOxygenCoefSum(): number {
        return this.raiders.map((r) => r.stats.OxygenCoef).reduce((l, r) => l + r, 0) +
            this.buildings.map((b) => b.isPowered() ? b.stats.OxygenCoef : 0).reduce((l, r) => l + r, 0)
    }

    hasMaxRaiders(): boolean {
        return this.raiders.length >= this.getMaxRaiders()
    }

    findTeleportBuilding(entityType: EntityType): BuildingEntity {
        return this.buildings.find((b) => b.canTeleportIn(entityType))
    }

    addMiscAnim(lwsFilename: string, position: Vector3, heading: number): AnimationGroup {
        const grp = new AnimationGroup(lwsFilename, this.sceneMgr.listener)
        grp.position.copy(position)
        grp.rotateOnAxis(new Vector3(0, 1, 0), heading)
        this.sceneMgr.scene.add(grp)
        this.miscAnims.push(grp)
        grp.startAnimation(() => {
            this.sceneMgr.scene.remove(grp)
            this.miscAnims.remove(grp)
        })
        return grp
    }

    hasProfessional(training: RaiderTraining) {
        return this.raiders.some((r) => r.hasTraining(training))
    }

    addEntity(entity: AbstractGameEntity) {
        const discovered = entity.getComponent(PositionComponent).isDiscovered()
        switch (entity.entityType) {
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
        }
    }

    removeEntity(entity: AbstractGameEntity) {
        switch (entity.entityType) {
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
        }
    }
}
