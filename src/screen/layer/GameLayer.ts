import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameEvent } from '../../event/GameEvent'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { IEventHandler } from '../../event/IEventHandler'
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

export class GameLayer extends ScreenLayer implements IEventHandler {

    parent: IEventHandler
    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}

    constructor(parent: IEventHandler) {
        super(false, false)
        this.parent = parent
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
    }

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        const rx = (cx / this.canvas.width) * 2 - 1
        const ry = -(cy / this.canvas.height) * 2 + 1
        const terrainIntersectionPoint = this.sceneMgr.getTerrainIntersectionPoint(rx, ry)
        const buildMarker = this.sceneMgr.buildMarker
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            if (terrainIntersectionPoint) this.sceneMgr.setTorchPosition(terrainIntersectionPoint)
            buildMarker.update(terrainIntersectionPoint)
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
        this.canvas.dispatchEvent(new PointerEvent(event.type, event))
        this.canvas.ownerDocument.dispatchEvent(new PointerEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
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
            if (!this.entityMgr.selection.isEmpty()) this.publishEvent(new DeselectAll())
        } else if (selection.surface) {
            if (this.entityMgr.selection.canDrill(selection.surface)) {
                const drillJob = selection.surface.createDrillJob()
                this.entityMgr.selection.assignSurfaceJob(drillJob)
            } else if (this.entityMgr.selection.canClear()) {
                const clearJob = selection.surface.createClearRubbleJob()
                this.entityMgr.selection.assignSurfaceJob(clearJob)
            } else if (this.entityMgr.selection.canMove() && selection.surface.isWalkable()) {
                this.entityMgr.selection.assignMoveJob(terrainIntersectionPoint)
            }
            if (!this.entityMgr.selection.isEmpty()) this.publishEvent(new DeselectAll())
        }
    }

    handleKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP) {
            if (this.entityMgr.selection.surface) {
                if (event.code === 'KeyC') {
                    this.entityMgr.selection.surface.collapse()
                    this.publishEvent(new DeselectAll())
                } else if (event.code === 'KeyF') {
                    const surface = this.entityMgr.selection.surface
                    if (!surface.surfaceType.floor) {
                        this.sceneMgr.terrain.createFallIn(surface, this.sceneMgr.terrain.findFallInTarget(surface))
                    }
                    this.publishEvent(new DeselectAll())
                }
            }
        }
        this.canvas.dispatchEvent(new KeyboardEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    handleWheelEvent(event: GameWheelEvent): Promise<boolean> {
        this.canvas.dispatchEvent(new WheelEvent(event.type, event))
        return new Promise((resolve) => resolve(true))
    }

    publishEvent(event: GameEvent): void {
        this.parent?.publishEvent(event)
    }

    registerEventListener(eventKey: EventKey, callback: (GameEvent) => any): void {
        this.parent.registerEventListener(eventKey, callback)
    }

}
