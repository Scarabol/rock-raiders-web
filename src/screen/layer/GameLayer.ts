import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { DeselectAll } from '../../event/LocalEvents'
import { JobCreateEvent } from '../../event/WorldEvents'
import { EntityManager } from '../../game/EntityManager'
import { BuildingPathTarget } from '../../game/model/building/BuildingPathTarget'
import { ManVehicleJob } from '../../game/model/job/ManVehicleJob'
import { TrainRaiderJob } from '../../game/model/job/raider/TrainRaiderJob'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { DEV_MODE } from '../../params'
import { ScreenLayer } from './ScreenLayer'

export class GameLayer extends ScreenLayer {
    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}

    constructor() {
        super(false, false)
        this.canvas.style.cursor = 'none' // this cursor is effective, when OrbitControls captures the pointer during movements
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        const terrainIntersectionPoint = this.sceneMgr.getTerrainIntersectionPoint(rx, ry)
        const buildMarker = this.sceneMgr.buildMarker
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            if (terrainIntersectionPoint) this.sceneMgr.setTorchPosition(terrainIntersectionPoint)
            buildMarker.updatePosition(terrainIntersectionPoint)
            this.entityMgr.selection.doubleSelect?.sceneEntity.pointLaserAt(terrainIntersectionPoint)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) {
                buildMarker.createBuildingSite()
            } else if (event.button === MOUSE_BUTTON.SECONDARY) {
                const downUpDistance = Math.abs(event.clientX - this.rightDown.x) + Math.abs(event.clientY - this.rightDown.y)
                if (downUpDistance < 3) {
                    if (this.sceneMgr.hasBuildModeSelection()) {
                        this.sceneMgr.setBuildModeSelection(null)
                    } else if (this.entityMgr.selection.raiders.length > 0 || this.entityMgr.selection.vehicles.length > 0) {
                        this.handleSecondaryClickForSelection(rx, ry, terrainIntersectionPoint)
                    }
                }
            }
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.SECONDARY) {
                this.rightDown.x = event.clientX
                this.rightDown.y = event.clientY
            }
        }
        return this.sceneMgr.controls.handlePointerEvent(event)
    }

    handleSecondaryClickForSelection(rx: number, ry: number, terrainIntersectionPoint: Vector2) {
        const selection = this.sceneMgr.getFirstByRay(rx, ry)
        if (selection.vehicle) {
            const selectedRaiders = this.entityMgr.selection.raiders
            if (selectedRaiders.length > 0) {
                const manVehicleJob = new ManVehicleJob(selection.vehicle)
                selectedRaiders.some((r) => {
                    if (r.isPrepared(manVehicleJob)) {
                        r.setJob(manVehicleJob)
                    } else {
                        const requiredTraining = manVehicleJob.getRequiredTraining()
                        const closestTrainingSite = this.entityMgr.getTrainingSiteTargets(requiredTraining)
                            .map((b) => r.findPathToTarget(b))
                            .filter((p) => !!p)
                            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                        if (!closestTrainingSite) return false
                        r.setJob(new TrainRaiderJob(r.entityMgr, requiredTraining, (closestTrainingSite.target as BuildingPathTarget).building), manVehicleJob)
                    }
                    EventBus.publishEvent(new DeselectAll())
                    return true
                })
                EventBus.publishEvent(new JobCreateEvent(manVehicleJob))
            }
        } else if (selection.material) {
            this.entityMgr.selection.assignCarryJob(selection.material)
            if (!this.entityMgr.selection.isEmpty()) EventBus.publishEvent(new DeselectAll())
        } else if (selection.surface) {
            if (this.entityMgr.selection.canDrill(selection.surface)) {
                const drillJob = selection.surface.createDrillJob()
                this.entityMgr.selection.assignSurfaceJob(drillJob)
            } else if (this.entityMgr.selection.canClear() && selection.surface.hasRubble()) {
                const clearJob = selection.surface.createClearRubbleJob()
                this.entityMgr.selection.assignSurfaceJob(clearJob)
            } else if (this.entityMgr.selection.canMove() && selection.surface.isWalkable()) {
                this.entityMgr.selection.assignMoveJob(terrainIntersectionPoint)
            }
            if (!this.entityMgr.selection.isEmpty()) EventBus.publishEvent(new DeselectAll())
        }
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP) {
            if (this.entityMgr.selection.surface) {
                if (event.code === 'KeyC') {
                    this.entityMgr.selection.surface.collapse()
                    EventBus.publishEvent(new DeselectAll())
                } else if (event.code === 'KeyF') {
                    const surface = this.entityMgr.selection.surface
                    if (!surface.surfaceType.floor) {
                        this.sceneMgr.terrain.createFallIn(surface, this.sceneMgr.terrain.findFallInTarget(surface))
                    }
                    EventBus.publishEvent(new DeselectAll())
                }
            }
        }
        return this.sceneMgr.controls.handleKeyEvent(event)
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return this.sceneMgr.controls.handleWheelEvent(event)
    }

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>((resolve) => {
            this.sceneMgr.screenshotCallback = resolve
        })
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.sceneMgr?.resize(width, height)
    }
}
