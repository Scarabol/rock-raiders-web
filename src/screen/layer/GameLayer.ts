import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { CancelBuildMode, EntityDeselected } from '../../event/LocalEvents'
import { JobCreateEvent } from '../../event/WorldEvents'
import { Building } from '../../game/model/building/Building'
import { BuildingSite } from '../../game/model/BuildingSite'
import { BarrierPathTarget } from '../../game/model/collect/BarrierPathTarget'
import { CollectableType } from '../../game/model/collect/CollectableType'
import { FulfillerEntity } from '../../game/model/FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { MoveJob } from '../../game/model/job/MoveJob'
import { ClearRubbleJob } from '../../game/model/job/surface/ClearRubbleJob'
import { DrillJob } from '../../game/model/job/surface/DrillJob'
import { SurfaceJob } from '../../game/model/job/surface/SurfaceJob'
import { Surface } from '../../game/model/map/Surface'
import { SurfaceType } from '../../game/model/map/SurfaceType'
import { Raider } from '../../game/model/raider/Raider'
import { SelectionType } from '../../game/model/Selectable'
import { WorldManager } from '../../game/WorldManager'
import { DEV_MODE } from '../../params'
import { ScreenLayer } from './ScreenLayer'

export class GameLayer extends ScreenLayer {

    private worldMgr: WorldManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}

    constructor() {
        super(false, false)
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
    }

    setWorldManager(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
    }

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        const buildMarker = this.worldMgr.sceneManager.buildMarker
        if (eventEnum === POINTER_EVENT.MOVE) {
            const intersectionPoint = this.getTerrainPositionFromEvent(event)
            if (intersectionPoint) this.worldMgr.setTorchPosition(intersectionPoint)
            if (buildMarker.updateAllMarker(this.worldMgr.sceneManager.terrain, intersectionPoint)) {
                buildMarker.resetColor()
            } else {
                buildMarker.markAsInvalid()
            }
        } else if (eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) {
                if (GameState.buildModeSelection && buildMarker.lastCheck) {
                    buildMarker.visibleSurfaces.forEach((s) => {
                        s.surfaceType = SurfaceType.POWER_PATH_BUILDING
                        s.updateTexture()
                        s.neighbors.forEach((n) => n.updateTexture())
                    })
                    const barrierLocations = buildMarker.getBarrierLocations()
                    const stats = GameState.buildModeSelection.stats
                    const neededCrystals = stats?.CostCrystal || 0
                    const neededOre = stats?.CostOre || 0
                    const site = new BuildingSite(buildMarker.primarySurface, buildMarker.secondarySurface, GameState.buildModeSelection)
                    site.heading = buildMarker.heading
                    site.neededByType.set(CollectableType.BARRIER, barrierLocations.length)
                    site.neededByType.set(CollectableType.CRYSTAL, neededCrystals)
                    site.neededByType.set(CollectableType.ORE, neededOre)
                    GameState.buildingSites.push(site)
                    const closestToolstation = GameState.getClosestBuildingByType(buildMarker.primarySurface.getCenterWorld(), Building.TOOLSTATION)
                    if (closestToolstation) {
                        closestToolstation.spawnMaterials(barrierLocations.map((t) => {
                            const barrier = GameState.dropMaterial(CollectableType.BARRIER, 1)[0]
                            barrier.targets = [new BarrierPathTarget(t, site)]
                            return barrier
                        }))
                        closestToolstation.spawnMaterials(GameState.dropMaterial(CollectableType.CRYSTAL, neededCrystals))
                        closestToolstation.spawnMaterials(GameState.dropMaterial(CollectableType.ORE, neededOre))
                    }
                    EventBus.publishEvent(new EntityDeselected())
                    EventBus.publishEvent(new CancelBuildMode())
                }
            } else if (event.button === MOUSE_BUTTON.SECONDARY) {
                const downUpDistance = Math.abs(event.x - this.rightDown.x) + Math.abs(event.y - this.rightDown.y)
                if (downUpDistance < 3 && (GameState.selectionType === SelectionType.PILOT || GameState.selectionType === SelectionType.GROUP)) {
                    // TODO check for collectable entity first
                    const intersectionPoint = this.getTerrainPositionFromEvent(event)
                    if (intersectionPoint) {
                        const surface = this.worldMgr.sceneManager.terrain.getSurfaceFromWorldXZ(intersectionPoint.x, intersectionPoint.y)
                        if (surface) {
                            if (surface.isDrillable()) {
                                this.createSurfaceJob(new DrillJob(surface), surface, intersectionPoint)
                            } else if (surface.hasRubble()) {
                                this.createSurfaceJob(new ClearRubbleJob(surface), surface, intersectionPoint)
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
        } else if (eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.SECONDARY) {
                this.rightDown.x = event.x
                this.rightDown.y = event.y
            }
        }
        this.canvas.dispatchEvent(event)
        return true
    }

    handleKeyEvent(eventEnum: KEY_EVENT, event: KeyboardEvent): boolean {
        if (DEV_MODE && eventEnum === KEY_EVENT.UP) {
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

    createSurfaceJob(surfJob: SurfaceJob, surface: Surface, intersectionPoint: Vector2) {
        GameState.selectedEntities.forEach((e: FulfillerEntity) => {
            if (surfJob.isQualified(e)) {
                e.setJob(surfJob)
            } else if (surface.isWalkable()) {
                e.setJob(new MoveJob(intersectionPoint))
            }
        })
        EventBus.publishEvent(new JobCreateEvent(surfJob))
        surface.updateJobColor()
        if (GameState.selectedEntities.length > 0) EventBus.publishEvent(new EntityDeselected())
    }

    getTerrainPositionFromEvent(event): Vector2 {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        const intersectionPoint = this.worldMgr.getTerrainIntersectionPoint(rx, ry)
        return intersectionPoint ? new Vector2(intersectionPoint.x, intersectionPoint.z) : null
    }

    handleWheelEvent(event: WheelEvent): boolean {
        this.canvas.dispatchEvent(event)
        return true
    }

}
