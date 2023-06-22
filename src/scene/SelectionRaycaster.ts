import { Object3D, Raycaster, Vector2 } from 'three'
import { GameSelection } from '../game/model/GameSelection'
import { VehicleEntity } from '../game/model/vehicle/VehicleEntity'
import { MaterialEntity } from '../game/model/material/MaterialEntity'
import { Surface } from '../game/terrain/Surface'
import { WorldManager } from '../game/WorldManager'
import { Terrain } from '../game/terrain/Terrain'
import { BuildingEntity } from '../game/model/building/BuildingEntity'
import { Raider } from '../game/model/raider/Raider'
import { BuildingSite } from '../game/model/building/BuildingSite'
import { EntityType } from '../game/model/EntityType'
import { SceneSelectionComponent, SceneSelectionUserData } from '../game/component/SceneSelectionComponent'
import { GameEntity } from '../game/ECS'
import { SelectionFrameComponent } from '../game/component/SelectionFrameComponent'

export interface CursorTarget {
    raider?: Raider
    vehicle?: VehicleEntity
    building?: BuildingEntity
    material?: MaterialEntity
    surface?: Surface
    intersectionPoint?: Vector2
    buildingSite?: BuildingSite
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
        selection.raiders.push(...raycaster.getEntities(this.worldMgr.entityMgr.raiders.filter((r) => !r.vehicle), false))
        if (selection.isEmpty()) selection.vehicles.push(...raycaster.getEntities(this.worldMgr.entityMgr.vehicles, true))
        if (selection.isEmpty()) selection.building = raycaster.getEntities(this.worldMgr.entityMgr.buildings, true)[0]
        if (selection.isEmpty()) selection.fence = raycaster.getEntities(this.worldMgr.entityMgr.placedFences, false)[0]
        if (selection.isEmpty() && this.terrain) selection.surface = raycaster.getSurfaceIntersection(this.terrain.floorGroup.children)?.surface
        return selection
    }

    getFirstCursorTarget(origin: Vector2, checkAll: boolean): CursorTarget {
        const raycaster = new SceneRaycaster(this.worldMgr, origin)
        if (checkAll) {
            const raider = raycaster.getFirstEntity(this.worldMgr.entityMgr.raiders)
            if (raider) return {raider: raider, entityType: raider.entityType}
        }
        const material = raycaster.getFirstEntity(this.worldMgr.entityMgr.materials)
        if (material) return {material: material, entityType: material.entityType}
        const vehicle = raycaster.getFirstEntity(this.worldMgr.entityMgr.vehicles)
        if (vehicle) return {vehicle: vehicle, entityType: vehicle.entityType}
        if (checkAll) {
            const building = raycaster.getFirstEntity(this.worldMgr.entityMgr.buildings)
            if (building) return {building: building, entityType: building.entityType}
        }
        if (this.terrain) {
            const surfaceIntersection = raycaster.getSurfaceIntersection(this.terrain.floorGroup.children)
            if (surfaceIntersection) return surfaceIntersection
        }
        return {}
    }
}

class SceneRaycaster {
    readonly raycaster: Raycaster

    constructor(readonly worldMgr: WorldManager, origin: Vector2) {
        this.raycaster = new Raycaster()
        this.raycaster.setFromCamera(origin, this.worldMgr.sceneMgr.camera)
    }

    getEntities<T extends { entity: GameEntity }>(entities: T[], allowDoubleSelection: boolean): any[] {
        const objects = entities.map((m) => this.worldMgr.ecs.getComponents(m.entity).get(SceneSelectionComponent).pickSphere).filter((p) => !!p)
        const intersection = this.raycaster.intersectObjects(objects, false)
        if (intersection.length < 1) return []
        const selection = []
        const gameEntity = (intersection[0].object.userData as SceneSelectionUserData)?.gameEntity
        if (gameEntity) {
            const selectionFrameComponent = this.worldMgr.ecs.getComponents(gameEntity).get(SelectionFrameComponent)
            if (!!selectionFrameComponent && (!selectionFrameComponent.isSelected() || allowDoubleSelection)) {
                const selectable = entities.find((e) => e.entity === gameEntity)
                if (selectable) {
                    selection.push(selectable)
                }
            }
        }
        return selection
    }

    getFirstEntity<T extends { entity: GameEntity }>(entities: T[]): T {
        const objects = entities.map((m) => this.worldMgr.ecs.getComponents(m.entity).get(SceneSelectionComponent).pickSphere).filter((p) => !!p)
        const intersection = this.raycaster.intersectObjects(objects, false)[0]
        const selectionUserData = intersection?.object?.userData as SceneSelectionUserData
        if (!selectionUserData) return null
        return entities.find((e) => e.entity === selectionUserData.gameEntity)
    }

    getSurfaceIntersection(surfaces: Object3D[]): { surface: Surface, intersectionPoint: Vector2 } {
        const intersection = this.raycaster.intersectObjects(surfaces, false)[0]
        if (intersection) return {surface: intersection?.object?.userData?.selectable, intersectionPoint: new Vector2(intersection.point.x, intersection.point.z)}
        return null
    }
}
