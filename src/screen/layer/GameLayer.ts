import { Raycaster, Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { CancelBuildMode, ChangeCursor, EntityDeselected } from '../../event/LocalEvents'
import { BuildingSite } from '../../game/model/building/BuildingSite'
import { EntityType } from '../../game/model/EntityType'
import { FulfillerEntity } from '../../game/model/FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { Job } from '../../game/model/job/Job'
import { MoveJob } from '../../game/model/job/MoveJob'
import { Surface } from '../../game/model/map/Surface'
import { SurfaceType } from '../../game/model/map/SurfaceType'
import { Raider } from '../../game/model/raider/Raider'
import { SelectionType } from '../../game/model/Selectable'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { DEV_MODE } from '../../params'
import { Cursors } from '../Cursors'
import { ScreenLayer } from './ScreenLayer'

export class GameLayer extends ScreenLayer {

    worldMgr: WorldManager
    sceneMgr: SceneManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}
    private lastCursor: Cursors = Cursors.Pointer_Standard

    constructor() {
        super(false, false)
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
        this.lastCursor = Cursors.Pointer_Standard
    }

    hide() {
        super.hide()
        EventBus.publishEvent(new ChangeCursor(Cursors.Pointer_Standard))
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const buildMarker = this.sceneMgr.buildMarker
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            const intersectionPoint = this.getTerrainPositionFromEvent(event)
            if (intersectionPoint) this.sceneMgr.setTorchPosition(intersectionPoint)
            buildMarker.update(this.sceneMgr.terrain, intersectionPoint)
            this.updateCursor(event)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) {
                if (GameState.buildModeSelection && buildMarker.lastCheck) {
                    const building = GameState.buildModeSelection(this.worldMgr, this.sceneMgr)
                    buildMarker.visibleSurfaces.forEach((s) => {
                        s.surfaceType = SurfaceType.POWER_PATH_BUILDING
                        s.updateTexture()
                        s.neighbors.forEach((n) => n.updateTexture())
                    })
                    const barrierLocations = buildMarker.getBarrierLocations()
                    const stats = building.stats
                    const neededCrystals = stats?.CostCrystal || 0
                    const neededOre = stats?.CostOre || 0
                    const site = new BuildingSite(buildMarker.primarySurface, buildMarker.secondarySurface, building)
                    site.heading = buildMarker.heading
                    site.neededByType.set(EntityType.BARRIER, barrierLocations.length)
                    site.neededByType.set(EntityType.CRYSTAL, neededCrystals)
                    site.neededByType.set(EntityType.ORE, neededOre)
                    GameState.buildingSites.push(site)
                    const closestToolstation = GameState.getClosestBuildingByType(buildMarker.primarySurface.getCenterWorld(), EntityType.TOOLSTATION)
                    if (closestToolstation) {
                        closestToolstation.spawnBarriers(barrierLocations, site)
                        closestToolstation.spawnMaterials(EntityType.CRYSTAL, neededCrystals)
                        closestToolstation.spawnMaterials(EntityType.ORE, neededOre)
                    }
                    EventBus.publishEvent(new EntityDeselected())
                    EventBus.publishEvent(new CancelBuildMode())
                }
            } else if (event.button === MOUSE_BUTTON.SECONDARY) {
                const downUpDistance = Math.abs(event.clientX - this.rightDown.x) + Math.abs(event.clientY - this.rightDown.y)
                if (downUpDistance < 3 && (GameState.selectionType === SelectionType.RAIDER || GameState.selectionType === SelectionType.GROUP)) {
                    // TODO check for collectable entity first
                    const intersectionPoint = this.getTerrainPositionFromEvent(event)
                    if (intersectionPoint) {
                        const surface = this.sceneMgr.terrain.getSurfaceFromWorldXZ(intersectionPoint.x, intersectionPoint.y)
                        if (surface) {
                            if (surface.isDrillable()) {
                                this.assignSurfaceJob(surface.createDrillJob(), surface, intersectionPoint)
                            } else if (surface.hasRubble()) {
                                this.assignSurfaceJob(surface.createClearRubbleJob(), surface, intersectionPoint)
                            } else if (surface.isWalkable()) {
                                GameState.selectedEntities.forEach((raider: Raider) => raider.setJob(new MoveJob(intersectionPoint)))
                                if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected())
                            }
                        }
                    }
                } else {
                    GameState.buildModeSelection = null
                    buildMarker.hideAllMarker()
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.SECONDARY) {
                this.rightDown.x = event.clientX
                this.rightDown.y = event.clientY
            }
        }
        this.canvas.dispatchEvent(new PointerEvent(event.type, event))
        return true
    }

    updateCursor(event) {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        const raycaster = new Raycaster()
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneMgr.camera)
        const cursor = this.determineCursor(raycaster)
        if (cursor !== this.lastCursor) {
            this.lastCursor = cursor
            EventBus.publishEvent(new ChangeCursor(cursor))
        }
    }

    determineCursor(raycaster: Raycaster): Cursors {
        let intersects = raycaster.intersectObjects(GameState.raiders.map((r) => r.pickSphere))
        if (intersects.length > 0) {
            return Cursors.Pointer_Selected
        } else {
            let intersects = raycaster.intersectObjects(GameState.buildings.map((b) => b.pickSphere))
            if (intersects.length > 0) {
                return Cursors.Pointer_Selected
            } else {
                intersects = raycaster.intersectObjects(this.sceneMgr.terrain.floorGroup.children)
                if (intersects.length > 0) {
                    const userData = intersects[0].object.userData
                    if (userData && userData.hasOwnProperty('surface')) {
                        const surface = userData['surface'] as Surface
                        if (surface) {
                            return surface.surfaceType.cursor
                        }
                    }
                }
            }
        }
        return Cursors.Pointer_Standard
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP) {
            if (GameState.selectionType === SelectionType.SURFACE) {
                GameState.selectedEntities.forEach((s: Surface) => {
                    if (event.key === 'c') {
                        if (!s.surfaceType.floor) s.collapse()
                    } else if (event.key === 'f') {
                        const t = s.terrain.findFallInTarget(s.x, s.y)
                        if (!s.surfaceType.floor) s.createFallin(t[0], t[1])
                    }
                })
                EventBus.publishEvent(new EntityDeselected())
                return true
            }
        }
        return false
    }

    assignSurfaceJob(job: Job, surface: Surface, intersectionPoint: Vector2) {
        if (!job) return
        GameState.selectedEntities.forEach((e: FulfillerEntity) => {
            if (e.hasTool(job.getRequiredTool()) && e.hasTraining(job.getRequiredTraining())) {
                e.setJob(job)
            } else if (surface.isWalkable()) {
                e.setJob(new MoveJob(intersectionPoint))
            }
        })
        if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected())
    }

    getTerrainPositionFromEvent(event): Vector2 {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        return this.sceneMgr.getTerrainIntersectionPoint(rx, ry)
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        this.canvas.dispatchEvent(new WheelEvent(event.type, event))
        return true
    }

}
