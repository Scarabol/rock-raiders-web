import { Camera, Intersection, Object3D, Raycaster, Vector2 } from 'three'
import { GameSelection } from '../game/model/GameSelection'
import { Selectable } from '../game/model/Selectable'
import { VehicleEntity } from '../game/model/vehicle/VehicleEntity'
import { MaterialEntity } from '../game/model/material/MaterialEntity'
import { Surface } from '../game/terrain/Surface'
import { WorldManager } from '../game/WorldManager'
import { Terrain } from '../game/terrain/Terrain'
import { BuildingEntity } from '../game/model/building/BuildingEntity'
import { Raider } from '../game/model/raider/Raider'
import { SceneEntity } from './SceneEntity'
import { BuildingSite } from '../game/model/building/BuildingSite'
import { EntityType } from '../game/model/EntityType'

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
        const raycaster = new SceneRaycaster(this.worldMgr.sceneMgr.camera, origin)
        const selection = new GameSelection()
        selection.raiders.push(...raycaster.getEntities(this.worldMgr.entityMgr.raiders.map((r) => r.sceneEntity.pickSphere), false))
        if (selection.isEmpty()) selection.vehicles.push(...raycaster.getEntities(this.worldMgr.entityMgr.vehicles.map((v) => v.sceneEntity.pickSphere), true))
        if (selection.isEmpty()) selection.building = raycaster.getEntities(this.worldMgr.entityMgr.buildings.map((b) => b.sceneEntity.pickSphere), true)[0]
        if (selection.isEmpty()) selection.fence = raycaster.getEntities(this.worldMgr.entityMgr.placedFences.map((f) => f.sceneEntity.pickSphere), false)[0]
        if (selection.isEmpty() && this.terrain) selection.surface = raycaster.getEntities(this.terrain.floorGroup.children, false)[0]
        return selection
    }

    getFirstCursorTarget(origin: Vector2, checkAll: boolean): CursorTarget {
        const raycaster = new SceneRaycaster(this.worldMgr.sceneMgr.camera, origin)
        if (checkAll) {
            const raider = raycaster.getFirstEntity(this.worldMgr.entityMgr.raiders)
            if (raider) return {raider: raider, entityType: raider.entityType}
        }
        const vehicle = raycaster.getFirstEntity(this.worldMgr.entityMgr.vehicles)
        if (vehicle) return {vehicle: vehicle, entityType: vehicle.entityType}
        if (checkAll) {
            const building = raycaster.getFirstEntity(this.worldMgr.entityMgr.buildings)
            if (building) return {building: building, entityType: building.entityType}
        }
        const material = raycaster.getFirstEntity(this.worldMgr.entityMgr.materials)
        if (material) return {material: material, entityType: material.entityType}
        if (this.terrain) {
            const surfaceIntersection = raycaster.getSurfaceIntersection(this.terrain.floorGroup.children)
            if (surfaceIntersection) return surfaceIntersection
        }
        return {}
    }
}

class SceneRaycaster {
    readonly raycaster: Raycaster

    constructor(camera: Camera, origin: Vector2) {
        this.raycaster = new Raycaster()
        this.raycaster.setFromCamera(origin, camera)
    }

    getEntities(entities: Object3D[], allowDoubleSelection: boolean): any[] {
        const intersection = this.raycaster.intersectObjects(entities, false)
        return this.getSelection(intersection, allowDoubleSelection)
    }

    private getSelection(intersects: Intersection[], allowDoubleSelection: boolean): any[] {
        if (intersects.length < 1) return []
        const selection = []
        const userData = intersects[0].object.userData
        if (userData && userData.hasOwnProperty('selectable')) {
            const selectable = userData['selectable'] as Selectable
            if (selectable?.isInSelection() || (selectable?.selected && allowDoubleSelection)) selection.push(selectable)
        }
        return selection
    }

    getFirstEntity<T extends { sceneEntity: SceneEntity }>(entities: T[]): T {
        const objects = entities.map((m) => m.sceneEntity.pickSphere).filter((p) => !!p)
        const intersection = this.raycaster.intersectObjects(objects, false)[0]
        return intersection?.object?.userData?.selectable || intersection?.object?.userData?.materialEntity
    }

    getSurfaceIntersection(surfaces: Object3D[]): { surface: Surface, intersectionPoint: Vector2 } {
        const intersection = this.raycaster.intersectObjects(surfaces, false)[0]
        if (intersection) return {surface: intersection?.object?.userData?.selectable, intersectionPoint: new Vector2(intersection.point.x, intersection.point.z)}
        return null
    }
}
