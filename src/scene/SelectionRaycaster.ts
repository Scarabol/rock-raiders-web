import { Object3D, Raycaster, Vector2, Vector3 } from 'three'
import { GameSelection } from '../game/model/GameSelection'
import { VehicleEntity } from '../game/model/vehicle/VehicleEntity'
import { MaterialEntity } from '../game/model/material/MaterialEntity'
import { Surface } from '../game/terrain/Surface'
import { WorldManager } from '../game/WorldManager'
import { Terrain } from '../game/terrain/Terrain'
import { BuildingEntity } from '../game/model/building/BuildingEntity'
import { Raider } from '../game/model/raider/Raider'
import { EntityType } from '../game/model/EntityType'
import { PickSphereMesh, SceneSelectionComponent } from '../game/component/SceneSelectionComponent'
import { GameEntity } from '../game/ECS'
import { SelectionFrameComponent } from '../game/component/SelectionFrameComponent'
import { ClickOnly, GameState } from '../game/model/GameState'
import { SurfaceMesh } from '../game/terrain/SurfaceMesh'
import { PositionComponent } from '../game/component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../game/component/AnimatedSceneEntityComponent'

export interface CursorTarget {
    raider?: Raider
    vehicle?: VehicleEntity
    monster?: { entity: GameEntity }
    fence?: MaterialEntity
    slug?: { entity: GameEntity }
    building?: BuildingEntity
    material?: MaterialEntity
    surface?: Surface
    intersectionPoint?: Vector3
    entityType?: EntityType
}

export class SelectionRaycaster {
    readonly terrain: Terrain

    constructor(readonly worldMgr: WorldManager) {
        this.terrain = worldMgr.sceneMgr.terrain
    }

    getSelectionByRay(origin: Vector2): GameSelection {
        const raycaster = new SceneRaycaster(this.worldMgr, origin)
        const selection = new GameSelection()
        const allowClicks = GameState.isWorldClickAllowed()
        if (allowClicks) selection.raiders.push(...raycaster.getEntities(this.getSelectableObjects(this.worldMgr.entityMgr.raiders.filter((r) => !r.vehicle)), false))
        if (selection.isEmpty() && allowClicks) selection.vehicles.push(...raycaster.getEntities(this.getSelectableObjects(this.worldMgr.entityMgr.vehicles), true))
        if (selection.isEmpty() && allowClicks) selection.building = raycaster.getEntities(this.getSelectableObjects(this.worldMgr.entityMgr.buildings), true)[0]
        if (selection.isEmpty() && allowClicks) selection.fence = raycaster.getEntities(this.getSelectableObjects(this.worldMgr.entityMgr.placedFences), false)[0]
        if (selection.isEmpty() && this.terrain && allowClicks) {
            selection.surface = raycaster.getSurfaceIntersection(
                this.worldMgr.sceneMgr.floorGroup.children,
                GameState.isObjectPointerRequired() ? (surface) => !!surface.mesh.objectPointer?.visible : undefined,
            )
        }
        return selection
    }

    getFirstCursorTarget(origin: Vector2, forClick: boolean = false): CursorTarget {
        const raycaster = new SceneRaycaster(this.worldMgr, origin)
        const allowClicks = !forClick || GameState.isWorldClickAllowed()
        const objectPointerRequired = forClick && GameState.isObjectPointerRequired()
        if (allowClicks) {
            const raider = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.raiders.filter((r) => !r.vehicle), objectPointerRequired))
            if (raider) return { raider: raider, entityType: raider.entityType }
            const material = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.materials, objectPointerRequired))
            if (material) return { material: material, entityType: material.entityType }
            const vehicle = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.vehicles, objectPointerRequired))
            if (vehicle) return { vehicle: vehicle, entityType: vehicle.entityType }
            const monster = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.rockMonsters.map((m) => ({ entity: m })), objectPointerRequired))
            if (monster) return { monster: monster, entityType: EntityType.ROCK_MONSTER }
            const fence = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.placedFences, objectPointerRequired))
            if (fence) return { fence: fence, entityType: EntityType.ELECTRIC_FENCE }
            const slug = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.slugs.map((m) => ({ entity: m })), objectPointerRequired))
            if (slug) return { slug: slug, entityType: EntityType.SLUG }
            const building = raycaster.getFirstEntity(this.getSelectableObjects(this.worldMgr.entityMgr.buildings, objectPointerRequired))
            if (building) return { building: building, entityType: building.entityType }
        }
        if (this.terrain && allowClicks) {
            const intersections = raycaster.raycaster.intersectObjects<SurfaceMesh>(this.worldMgr.sceneMgr.floorGroup.children, true)
            const intersection = objectPointerRequired
                ? intersections.find(({ object }) => {
                    const surface = object.userData.selectable
                    return surface?.discovered && !!surface.mesh.objectPointer?.visible
                })
                : intersections[0]
            if (intersection) {
                const surface = intersection.object.userData.selectable
                if (surface?.discovered) {
                    if ((!forClick || GameState.clickOnly === ClickOnly.ANY) && surface.building && surface.pathBlockedByBuilding) {
                        return { building: surface.building, entityType: surface.building.entityType }
                    }
                    return { surface: surface, intersectionPoint: intersection.point }
                }
            }
        }
        return {}
    }

    private getSelectableObjects<T extends { entity: GameEntity }>(entities: T[], objectPointerRequired: boolean = GameState.isObjectPointerRequired()): T[] {
        if (!objectPointerRequired) return entities
        return entities.filter(({ entity }) => this.isObjectOnPointer(entity))
    }

    isObjectOnPointer(entity: GameEntity): boolean {
        const components = this.worldMgr.ecs.getComponents(entity)
        const surface = components.getOptional(PositionComponent)?.surface
        if (surface?.mesh.objectPointer?.visible) return true
        const sceneEntity = components.getOptional(AnimatedSceneEntityComponent)?.sceneEntity
        return !!sceneEntity && this.worldMgr.sceneMgr.objectPointer.visible && this.worldMgr.sceneMgr.objectPointer.parent === sceneEntity
    }
}

class SceneRaycaster {
    readonly raycaster: Raycaster

    constructor(readonly worldMgr: WorldManager, origin: Vector2) {
        this.raycaster = new Raycaster()
        this.raycaster.setFromCamera(origin, this.worldMgr.sceneMgr.cameraActive)
    }

    getEntities<T extends { entity: GameEntity }>(entities: T[], allowDoubleSelection: boolean): T[] {
        const objects = entities.map((m) => this.worldMgr.ecs.getComponents(m.entity).get(SceneSelectionComponent).pickSphere).filter((p) => !!p)
        const intersection = this.raycaster.intersectObjects<PickSphereMesh>(objects, false)[0]
        if (!intersection) return []
        const gameEntity = intersection.object.userData.gameEntity
        if (gameEntity) {
            const selectionFrameComponent = this.worldMgr.ecs.getComponents(gameEntity).getOptional(SelectionFrameComponent)
            if (!!selectionFrameComponent && (!selectionFrameComponent.isSelected() || allowDoubleSelection)) {
                const selectable = entities.find((e) => e.entity === gameEntity)
                if (selectable) return [selectable]
            }
        }
        return []
    }

    getFirstEntity<T extends { entity: GameEntity }>(entities: T[]): T | undefined {
        const objects = entities.map((m) => this.worldMgr.ecs.getComponents(m.entity).get(SceneSelectionComponent).pickSphere).filter((p) => !!p)
        const intersection = this.raycaster.intersectObjects<PickSphereMesh>(objects, false)[0]
        if (!intersection) return undefined
        const gameEntity = intersection.object.userData.gameEntity
        return entities.find((e) => e.entity === gameEntity)
    }

    getSurfaceIntersection(surfaces: Object3D[], isAllowed?: (surface: Surface) => boolean): Surface | undefined {
        for (const intersection of this.raycaster.intersectObjects<SurfaceMesh>(surfaces, true)) {
            const surface = intersection.object.userData.selectable
            if (surface && (!isAllowed || isAllowed(surface))) return surface
        }
        return undefined
    }
}
