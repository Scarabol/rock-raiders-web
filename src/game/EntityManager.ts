import { Vector2, Vector3 } from 'three'
import { EventKey } from '../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersAmountChangedEvent, SelectionChanged, UpdateRadarEntityEvent } from '../event/LocalEvents'
import { WorldLocationEvent } from '../event/WorldEvents'
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
import { GameEntity } from './ECS'
import { PositionComponent } from './component/PositionComponent'
import { AnimatedSceneEntityComponent } from './component/AnimatedSceneEntityComponent'
import { RockMonsterActivity } from './model/anim/AnimationActivity'
import { MonsterStatsComponent } from './component/MonsterStatsComponent'
import { WorldManager } from './WorldManager'
import { HealthComponent } from './component/HealthComponent'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from './component/MapMarkerComponent'
import { SlugBehaviorComponent, SlugBehaviorState } from './component/SlugBehaviorComponent'
import { EventBroker } from '../event/EventBroker'
import { BuildingEntityStats } from '../cfg/GameStatsCfg'
import { GameState } from './model/GameState'
import { SaveGameManager, SaveGameRaider } from '../resource/SaveGameManager'

export interface VehicleTarget {
    entity: GameEntity
    position: PositionComponent
}

export class EntityManager {
    selection: GameSelection = new GameSelection()
    // entity partitions
    buildings: BuildingEntity[] = []
    buildingsUndiscovered: BuildingEntity[] = []
    raiders: Raider[] = []
    raidersUndiscovered: Raider[] = []
    raidersInBeam: Raider[] = []
    materials: MaterialEntity[] = []
    materialsUndiscovered: MaterialEntity[] = []
    placedFences: MaterialEntity[] = []
    surfacesWithStuds: Surface[] = []
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
    birdScarer: GameEntity[] = []

    constructor(readonly worldMgr: WorldManager) {
        this.worldMgr.entityMgr = this
        // event handler must be placed here, because only this class knows the "actual" selection instance
        EventBroker.subscribe(EventKey.DESELECT_ALL, () => {
            this.selection.deselectAll()
            EventBroker.publish(new SelectionChanged(this))
        })
        EventBroker.subscribe(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
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
        this.surfacesWithStuds.length = 0
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
        this.birdScarer.length = 0
    }

    update(elapsedMs: number) {
        this.raiders.forEach((r) => updateSafe(r, elapsedMs))
        this.vehicles.forEach((v) => updateSafe(v, elapsedMs))
        this.completedBuildingSites.forEach((b) => updateSafe(b, elapsedMs))
    }

    disposeAll() {
        EntityManager.disposeAll(this.buildings)
        EntityManager.disposeAll(this.buildingsUndiscovered)
        EntityManager.disposeAll(this.raiders)
        EntityManager.disposeAll(this.raidersUndiscovered)
        EntityManager.disposeAll(this.raidersInBeam)
        EntityManager.disposeAll(this.materials)
        EntityManager.disposeAll(this.materialsUndiscovered)
        EntityManager.disposeAll(this.placedFences)
        EntityManager.disposeAll(this.vehicles)
        EntityManager.disposeAll(this.vehiclesUndiscovered)
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

    getClosestBuildingByType(position: Vector3, ...buildingTypes: EntityType[]): BuildingEntity | undefined {
        const buildings = this.getBuildingsByType(...buildingTypes)
        let closest: BuildingEntity | undefined, minDist: number = Infinity
        buildings.forEach((b) => {
            const bPos = b.getPosition()
            const dist = position.distanceToSquared(bPos)
            if (dist < minDist) {
                closest = b
                minDist = dist
            }
        })
        return closest
    }

    getGetToolTargets(): PathTarget[] {
        return this.getPoweredBuildingByStatsProperty('toolStore').map((b) => b.getToolPathTarget).filter((b) => !!b)
    }

    private getPoweredBuildingByStatsProperty(statsKey: keyof BuildingEntityStats) {
        return this.buildings.filter(b => b.isPowered() && b.stats[statsKey])
    }

    getBuildingCarryPathTargets(entityType: EntityType): PathTarget[] {
        return this.getBuildingsByType(entityType).map((b) => b.carryPathTarget).filter((b) => !!b)
    }

    getRaiderUpgradePathTarget(): PathTarget[] {
        return this.getPoweredBuildingByStatsProperty('toolStore').flatMap((b) => b.getTrainingTargets())
    }

    getRaiderEatPathTarget(): PathTarget[] {
        return this.getPoweredBuildingByStatsProperty('snaxULike').flatMap((b) => b.getTrainingTargets())
    }

    getVehicleUpgradePathTargets(): PathTarget[] {
        return this.getPoweredBuildingByStatsProperty('upgradeBuilding').map((b) => PathTarget.fromBuilding(b, b.getDropPosition2D(), 1, b.primarySurface.getCenterWorld2D()))
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
        return this.buildings.some((b) => b.isPowered() && b.stats.upgradeBuilding)
    }

    getRaiderFightTargets(): PathTarget[] {
        return [...this.rockMonsters, ...this.slugs]
            .map((m) => ({entity: m, components: this.worldMgr.ecs.getComponents(m)}))
            .filter((e) => {
                return e.components.get(HealthComponent).health > 0 &&
                    e.components.get(MonsterStatsComponent).stats.canBeShotAt &&
                    e.components.get(AnimatedSceneEntityComponent).sceneEntity.currentAnimation !== RockMonsterActivity.Unpowered &&
                    e.components.get(SlugBehaviorComponent)?.state !== SlugBehaviorState.EMERGE
            })
            .map((e) => {
                const pos = e.components.get(PositionComponent).surface.getCenterWorld2D()
                return PathTarget.fromEntity(e.entity, pos, TILESIZE * TILESIZE * 4)
            })
    }

    discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE
        const numRaidersUndiscovered = this.raidersUndiscovered.length
        this.raidersUndiscovered = EntityManager.removeInRect(this.raidersUndiscovered, minX, maxX, minZ, maxZ, (r) => {
            r.worldMgr.entityMgr.raiders.push(r)
            const positionComponent = r.worldMgr.ecs.getComponents(r.entity).get(PositionComponent)
            EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_RAIDER_DISCOVERED, positionComponent))
            this.worldMgr.ecs.addComponent(r.entity, new MapMarkerComponent(MapMarkerType.DEFAULT))
            EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, r.entity, MapMarkerChange.UPDATE, positionComponent.position))
        })
        if (numRaidersUndiscovered !== this.raidersUndiscovered.length) EventBroker.publish(new RaidersAmountChangedEvent(this))
        this.buildingsUndiscovered = EntityManager.removeInRect(this.buildingsUndiscovered, minX, maxX, minZ, maxZ, (b) => {
            b.updateEnergyState()
            b.worldMgr.entityMgr.buildings.push(b)
            EventBroker.publish(new BuildingsChangedEvent(b.worldMgr.entityMgr))
        })
        this.materialsUndiscovered = EntityManager.removeInRect(this.materialsUndiscovered, minX, maxX, minZ, maxZ, (m) => {
            m.worldMgr.entityMgr.materials.push(m)
            m.setupCarryJob()
            const positionComponent = m.worldMgr.ecs.getComponents(m.entity).get(PositionComponent)
            m.worldMgr.ecs.addComponent(m.entity, new MapMarkerComponent(MapMarkerType.MATERIAL))
            EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.MATERIAL, m.entity, MapMarkerChange.UPDATE, positionComponent.position))
        })
        this.vehiclesUndiscovered = EntityManager.removeInRect(this.vehiclesUndiscovered, minX, maxX, minZ, maxZ, (v) => {
            v.worldMgr.entityMgr.vehicles.push(v)
            const driver = v.driver
            if (driver) {
                driver.worldMgr.entityMgr.raidersUndiscovered.remove(driver)
                driver.sceneEntity.visible = true
                driver.worldMgr.entityMgr.raiders.push(driver)
                const positionComponent = driver.worldMgr.ecs.getComponents(driver.entity).get(PositionComponent)
                EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_RAIDER_DISCOVERED, positionComponent))
                this.worldMgr.ecs.addComponent(driver.entity, new MapMarkerComponent(MapMarkerType.DEFAULT))
                EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, driver.entity, MapMarkerChange.UPDATE, positionComponent.position))
            }
            const positionComponent = v.worldMgr.ecs.getComponents(v.entity).get(PositionComponent)
            this.worldMgr.ecs.addComponent(v.entity, new MapMarkerComponent(MapMarkerType.DEFAULT))
            EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.DEFAULT, v.entity, MapMarkerChange.UPDATE, positionComponent.position))
        })
        this.undiscoveredSpiders = this.removeInRectNew(this.undiscoveredSpiders, minX, maxX, minZ, maxZ, (m) => {
            this.spiders.push(m)
        })
        this.undiscoveredBats = this.removeInRectNew(this.undiscoveredBats, minX, maxX, minZ, maxZ, (m) => {
            this.bats.push(m)
            this.addMapMarker(m)
        })
        this.undiscoveredRockMonsters = this.removeInRectNew(this.undiscoveredRockMonsters, minX, maxX, minZ, maxZ, (m) => {
            this.rockMonsters.push(m)
            this.addMapMarker(m)
        })
    }

    private static removeInRect<T extends Raider | BuildingEntity | MaterialEntity | VehicleEntity>(listing: T[], minX: number, maxX: number, minZ: number, maxZ: number, onRemove: (e: T) => void) {
        return listing.filter((e) => {
            const pos = e.getPosition2D()
            const discovered = pos.x >= minX && pos.x < maxX && pos.y >= minZ && pos.y < maxZ
            if (discovered) {
                e.sceneEntity.visible = true
                onRemove(e)
            }
            return !discovered
        })
    }

    private removeInRectNew(listing: GameEntity[], minX: number, maxX: number, minZ: number, maxZ: number, onRemove: (e: GameEntity) => void) {
        return listing.filter((e) => {
            const pos = this.worldMgr.ecs.getComponents(e).get(PositionComponent).position
            const discovered = pos.x >= minX && pos.x < maxX && pos.z >= minZ && pos.z < maxZ
            if (discovered) {
                this.worldMgr.ecs.getComponents(e).get(AnimatedSceneEntityComponent).sceneEntity.visible = true
                onRemove(e)
            }
            return !discovered
        })
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.sceneEntity.addToScene(item.worldMgr.sceneMgr, worldPosition, undefined)
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

    hasProfessional(training: RaiderTraining) {
        return this.raiders.some((r) => r.hasTraining(training))
    }

    addEntity(entity: GameEntity, entityType: EntityType) {
        const discovered = this.worldMgr.ecs.getComponents(entity).get(PositionComponent)?.isDiscovered()
        switch (entityType) {
            case EntityType.BAT:
                if (discovered) {
                    this.bats.add(entity)
                    this.addMapMarker(entity)
                } else {
                    this.undiscoveredBats.add(entity)
                }
                break
            case EntityType.SMALL_SPIDER:
                if (discovered) this.spiders.add(entity)
                else this.undiscoveredSpiders.add(entity)
                break
            case EntityType.SLUG:
                if (!discovered) console.warn('Slugs should not spawn on undiscovered surfaces!')
                this.slugs.add(entity)
                this.addMapMarker(entity)
                break
            case EntityType.ROCK_MONSTER:
            case EntityType.ICE_MONSTER:
            case EntityType.LAVA_MONSTER:
                if (discovered) {
                    this.rockMonsters.add(entity)
                    this.addMapMarker(entity)
                } else {
                    this.undiscoveredRockMonsters.add(entity)
                }
                break
            case EntityType.ORE:
            case EntityType.CRYSTAL:
            case EntityType.BRICK:
            case EntityType.BARRIER:
            case EntityType.DYNAMITE:
            case EntityType.ELECTRIC_FENCE:
                // if (discovered) this.materials.add(entity) // TODO use game entities within entity manager
                // else this.materialsUndiscovered.add(entity) // TODO use game entities within entity manager
                break
            case EntityType.BIRD_SCARER:
                this.birdScarer.add(entity)
                break
        }
    }

    private addMapMarker(entity: number) {
        const positionComponent = this.worldMgr.ecs.getComponents(entity).get(PositionComponent)
        this.worldMgr.ecs.addComponent(entity, new MapMarkerComponent(MapMarkerType.MONSTER))
        EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.MONSTER, entity, MapMarkerChange.UPDATE, positionComponent.position))
    }

    removeEntity(entity: GameEntity) {
        const healthComponent = this.worldMgr.ecs.getComponents(entity).get(HealthComponent)
        const healthBarSprite = healthComponent?.healthBarSprite
        if (healthBarSprite) {
            healthBarSprite.visible = false
            this.worldMgr.sceneMgr.removeSprite(healthBarSprite)
        }
        const healthFontSprite = healthComponent?.healthFontSprite
        if (healthFontSprite) {
            healthFontSprite.visible = false
            this.worldMgr.sceneMgr.removeSprite(healthFontSprite)
        }
        this.buildings.removeAll((e) => e.entity === entity)
        this.buildingsUndiscovered.removeAll((e) => e.entity === entity)
        this.raiders.removeAll((e) => e.entity === entity)
        this.raidersUndiscovered.removeAll((e) => e.entity === entity)
        this.raidersInBeam.removeAll((e) => e.entity === entity)
        this.materials.removeAll((e) => e.entity === entity)
        this.materialsUndiscovered.removeAll((e) => e.entity === entity)
        this.placedFences.removeAll((e) => e.entity === entity)
        this.spiders.remove(entity)
        this.undiscoveredSpiders.remove(entity)
        this.bats.remove(entity)
        this.undiscoveredBats.remove(entity)
        this.rockMonsters.remove(entity)
        this.undiscoveredRockMonsters.remove(entity)
        this.slugs.remove(entity)
        this.vehicles.removeAll((e) => e.entity === entity)
        this.vehiclesUndiscovered.removeAll((e) => e.entity === entity)
        this.vehiclesInBeam.removeAll((e) => e.entity === entity)
        this.recordedEntities.remove(entity)
        this.birdScarer.remove(entity)
    }

    findVehicleInRange(position2d: Vector2, rangeSq: number): VehicleTarget | undefined {
        let result: VehicleTarget | undefined
        this.worldMgr.entityMgr.vehicles.some((v) => {
            const vPos = this.worldMgr.ecs.getComponents(v.entity).get(PositionComponent)
            if (vPos.getPosition2D().distanceToSquared(position2d) < rangeSq) {
                result = {entity: v.entity, position: vPos}
                return true
            }
            return false
        })
        return result
    }

    addRaiderToTeam(raider: Raider): SaveGameRaider {
        let unassigned = GameState.unassignedTeam.shift()
        if (!unassigned) {
            unassigned = new SaveGameRaider('', 0, [])
            SaveGameManager.currentTeam.push(unassigned)
        }
        GameState.raiderSaveGameMap.set(raider.entity, unassigned)
        raider.level = unassigned.level || 0
        ;(unassigned.trainings ?? []).map((t) => {
            switch (t.toLowerCase()) {
                case 'TrainDriver'.toLowerCase():
                    raider.addTraining(RaiderTraining.DRIVER)
                    break
                case 'TrainRepair'.toLowerCase():
                    raider.addTraining(RaiderTraining.ENGINEER)
                    break
                case 'TrainScanner'.toLowerCase():
                    raider.addTraining(RaiderTraining.GEOLOGIST)
                    break
                case 'TrainPilot'.toLowerCase():
                    raider.addTraining(RaiderTraining.PILOT)
                    break
                case 'TrainSailor'.toLowerCase():
                    raider.addTraining(RaiderTraining.SAILOR)
                    break
                case 'TrainDynamite'.toLowerCase():
                    raider.addTraining(RaiderTraining.DEMOLITION)
                    break
                default:
                    console.warn(`Unexpected raider training "${t}" given`)
                    break
            }
        })
        return unassigned
    }
}
