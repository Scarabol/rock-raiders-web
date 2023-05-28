import { Vector2 } from 'three'
import { EventBus } from '../../event/EventBus'
import { KEY_EVENT, MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { GameWheelEvent } from '../../event/GameWheelEvent'
import { DeselectAll } from '../../event/LocalEvents'
import { JobCreateEvent } from '../../event/WorldEvents'
import { EntityManager } from '../../game/EntityManager'
import { ManVehicleJob } from '../../game/model/job/ManVehicleJob'
import { TrainRaiderJob } from '../../game/model/job/raider/TrainRaiderJob'
import { SceneManager } from '../../game/SceneManager'
import { DEV_MODE } from '../../params'
import { ScreenLayer } from './ScreenLayer'
import { Cursor } from '../../cfg/PointerCfg'
import { EntityType } from '../../game/model/EntityType'
import { Surface } from '../../game/model/map/Surface'
import { EventKey } from '../../event/EventKeyEnum'
import { ChangeCursor, ChangeTooltip } from '../../event/GuiCommand'
import { ResourceManager } from '../../resource/ResourceManager'
import { CursorTarget, SelectionRaycaster } from '../../scene/SelectionRaycaster'
import { MaterialEntity } from '../../game/model/material/MaterialEntity'
import { BuildPlacementMarker } from '../../game/model/building/BuildPlacementMarker'

export class GameLayer extends ScreenLayer {
    sceneMgr: SceneManager
    entityMgr: EntityManager
    private rightDown: { x: number, y: number } = {x: 0, y: 0}
    private readonly beforeUnloadListener = (event: BeforeUnloadEvent): string => {
        if (DEV_MODE) return undefined
        // TODO save complete game state in local storage and allow page reload
        event.preventDefault()
        return event.returnValue = 'Level progress will be lost!'
    }
    cursorRelativePos: Vector2 = new Vector2()

    constructor() {
        super()
        this.canvas.style.cursor = 'none' // this cursor is effective, when OrbitControls captures the pointer during movements
        EventBus.registerEventListener(EventKey.SELECTION_CHANGED, () => {
            if (this.active) {
                const cursorTarget = new SelectionRaycaster(this.sceneMgr, this.entityMgr).getFirstCursorTarget(this.cursorRelativePos, true)
                EventBus.publishEvent(new ChangeCursor(this.determineCursor(cursorTarget)))
            }
        })
    }

    reset() {
        super.reset()
        this.rightDown = {x: 0, y: 0}
    }

    show() {
        super.show()
        window.addEventListener('beforeunload', this.beforeUnloadListener)
    }

    hide() {
        super.hide()
        window.removeEventListener('beforeunload', this.beforeUnloadListener)
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        this.cursorRelativePos.x = (event.canvasX / this.canvas.width) * 2 - 1
        this.cursorRelativePos.y = -(event.canvasY / this.canvas.height) * 2 + 1
        if (event.eventEnum === POINTER_EVENT.MOVE) {
            const cursorTarget = new SelectionRaycaster(this.sceneMgr, this.entityMgr).getFirstCursorTarget(this.cursorRelativePos, true)
            EventBus.publishEvent(new ChangeCursor(this.determineCursor(cursorTarget)))
            if (cursorTarget.intersectionPoint) this.sceneMgr.setCursorFloorPosition(cursorTarget.intersectionPoint)
            if (cursorTarget.surface) {
                const tooltip = ResourceManager.configuration.surfaceTypeDescriptions.get(cursorTarget.surface.surfaceType.name.toLowerCase())
                if (tooltip) EventBus.publishEvent(new ChangeTooltip(tooltip[0], tooltip[1]))
                else {
                    const site = cursorTarget.surface.site
                    if (site?.buildingType) {
                        const objectKey = EntityType[site.buildingType.entityType].toString().replace('_', '').toLowerCase()
                        const tooltipText = ResourceManager.configuration.objectNamesCfg.get(objectKey)
                        if (tooltipText) EventBus.publishEvent(new ChangeTooltip(tooltipText, null, null, site))
                    }
                }
            }
            const targetEntityType = cursorTarget.raider?.entityType || cursorTarget.vehicle?.entityType || cursorTarget.building?.entityType
            if (targetEntityType) {
                const objectKey = EntityType[targetEntityType].toString().replace('_', '').toLowerCase()
                const tooltipText = ResourceManager.configuration.objectNamesCfg.get(objectKey)
                if (tooltipText) EventBus.publishEvent(new ChangeTooltip(tooltipText, null, cursorTarget.raider))
            }
            this.sceneMgr.buildMarker.updatePosition(cursorTarget.intersectionPoint)
            this.entityMgr.selection.doubleSelect?.sceneEntity.pointLaserAt(cursorTarget.intersectionPoint)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            this.handlePointerUpEvent(event, this.sceneMgr.buildMarker)
        } else if (event.eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.SECONDARY) {
                this.rightDown.x = event.canvasX
                this.rightDown.y = event.canvasY
            }
        }
        return this.sceneMgr.controls.handlePointerEvent(event)
    }

    private handlePointerUpEvent(event: GamePointerEvent, buildMarker: BuildPlacementMarker) {
        if (event.button === MOUSE_BUTTON.MAIN) {
            buildMarker.createBuildingSite()
        } else if (event.button === MOUSE_BUTTON.SECONDARY) {
            const downUpDistance = Math.abs(event.canvasX - this.rightDown.x) + Math.abs(event.canvasY - this.rightDown.y)
            if (downUpDistance < 3) {
                if (this.sceneMgr.hasBuildModeSelection()) {
                    this.sceneMgr.setBuildModeSelection(null)
                } else if (this.entityMgr.selection.raiders.length > 0 || this.entityMgr.selection.vehicles.length > 0) {
                    const selection = new SelectionRaycaster(this.sceneMgr, this.entityMgr)
                        .getFirstCursorTarget(this.cursorRelativePos, false)
                    this.handleSecondaryClickForSelection(selection)
                }
            }
        }
    }

    handleSecondaryClickForSelection(selection: CursorTarget) {
        if (selection.vehicle) {
            this.handleSecondaryClickForVehicle(selection)
        } else if (selection.material) {
            this.entityMgr.selection.assignCarryJob(selection.material)
            if (!this.entityMgr.selection.isEmpty()) EventBus.publishEvent(new DeselectAll())
        } else if (selection.surface) {
            if (this.entityMgr.selection.canDrill(selection.surface)) {
                const drillJob = selection.surface.setupDrillJob()
                this.entityMgr.selection.assignSurfaceJob(drillJob)
            } else if (this.entityMgr.selection.canClear() && selection.surface.hasRubble()) {
                const clearJob = selection.surface.setupClearRubbleJob()
                this.entityMgr.selection.assignSurfaceJob(clearJob)
            } else if (this.entityMgr.selection.canMove() && selection.surface.isWalkable()) {
                this.entityMgr.selection.assignMoveJob(selection.intersectionPoint)
            }
            if (!this.entityMgr.selection.isEmpty()) EventBus.publishEvent(new DeselectAll())
        }
    }

    private handleSecondaryClickForVehicle(selection: CursorTarget) {
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
                    r.setJob(new TrainRaiderJob(r.worldMgr.entityMgr, requiredTraining, closestTrainingSite.target.building), manVehicleJob)
                }
                EventBus.publishEvent(new DeselectAll())
                return true
            })
            EventBus.publishEvent(new JobCreateEvent(manVehicleJob))
        }
    }

    handleKeyEvent(event: GameKeyboardEvent): boolean {
        if (DEV_MODE && event.eventEnum === KEY_EVENT.UP && this.entityMgr.selection.surface) {
            if (event.code === 'KeyC') {
                this.entityMgr.selection.surface.collapse()
                EventBus.publishEvent(new DeselectAll())
                return true
            } else if (event.code === 'KeyF') {
                const surface = this.entityMgr.selection.surface
                if (!surface.surfaceType.floor) {
                    this.sceneMgr.terrain.createFallIn(surface, this.sceneMgr.terrain.findFallInTarget(surface))
                }
                EventBus.publishEvent(new DeselectAll())
                return true
            }
        }
        [['KeyW', 'ArrowUp'], ['KeyA', 'ArrowLeft'], ['KeyS', 'ArrowDown'], ['KeyD', 'ArrowRight']].forEach((pair) => {
            if (event.code === pair[0]) event.code = pair[1] // rewrite WASD to arrow keys for camera control
        })
        return this.sceneMgr.controls.handleKeyEvent(event)
    }

    handleWheelEvent(event: GameWheelEvent): boolean {
        return this.sceneMgr.controls.handleWheelEvent(event)
    }

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>((resolve) => {
            this.sceneMgr.renderer.screenshotCallback = resolve
        })
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.sceneMgr?.resize(width, height)
    }

    determineCursor(cursorTarget: CursorTarget): Cursor {
        if (this.sceneMgr.hasBuildModeSelection()) {
            return this.sceneMgr.buildMarker.lastCheck ? 'pointerCanBuild' : 'pointerCannotBuild'
        }
        if (cursorTarget.raider) return 'pointerSelected'
        if (cursorTarget.vehicle) {
            if (!cursorTarget.vehicle.driver && this.entityMgr.selection.raiders.length > 0) {
                return 'pointerGetIn'
            }
            return 'pointerSelected'
        }
        if (cursorTarget.building) return 'pointerSelected'
        if (cursorTarget.material) return this.determineMaterialCursor(cursorTarget.material)
        if (cursorTarget.surface) return this.determineSurfaceCursor(cursorTarget.surface)
        return 'pointerStandard'
    }

    private determineMaterialCursor(material: MaterialEntity): Cursor {
        if (this.entityMgr.selection.canPickup()) {
            if (material.entityType === EntityType.ORE) {
                return 'pointerPickUpOre'
            } else {
                return 'pointerPickUp'
            }
        }
        return 'pointerSelected'
    }

    private determineSurfaceCursor(surface: Surface): Cursor {
        if (this.entityMgr.selection.canMove()) {
            if (surface.surfaceType.digable) {
                if (this.entityMgr.selection.canDrill(surface)) {
                    return 'pointerDrill'
                }
            } else if (surface.surfaceType.floor) {
                if (surface.hasRubble() && this.entityMgr.selection.canClear()) {
                    return 'pointerClear'
                }
                return 'pointerLegoManGo'
            }
        }
        return surface.surfaceType.cursor
    }
}
