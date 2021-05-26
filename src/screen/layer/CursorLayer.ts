import { Raycaster } from 'three'
import { clearTimeoutSafe } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { POINTER_EVENT } from '../../event/EventTypeEnum'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { IEventHandler } from '../../event/IEventHandler'
import { ChangeCursor } from '../../event/LocalEvents'
import { EntityManager } from '../../game/EntityManager'
import { Surface } from '../../game/model/map/Surface'
import { SelectionType } from '../../game/model/Selectable'
import { VehicleEntity } from '../../game/model/vehicle/VehicleEntity'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedCursor } from '../AnimatedCursor'
import { Cursor } from '../Cursor'
import { ScreenLayer } from './ScreenLayer'

export class CursorLayer extends ScreenLayer {

    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    currentCursor: Cursor = null
    timedCursor: Cursor = null
    cursorTimeout = null
    activeCursor: AnimatedCursor = null

    constructor(parent: IEventHandler) {
        super(true, false)
        parent.registerEventListener(EventKey.CHANGE_CURSOR, (event: ChangeCursor) => {
            if (this.active) this.changeCursor(event.cursor, event.timeout)
        })
    }

    reset() {
        this.changeCursor(Cursor.Pointer_Standard)
    }

    hide() {
        super.hide()
        this.canvas.style.cursor = null
        this.currentCursor = null
        this.timedCursor = null
        this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
        this.activeCursor?.disableAnimation()
        this.activeCursor = null
    }

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        if (event.eventEnum === POINTER_EVENT.MOVE && this.sceneMgr) {
            const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
            const rx = (cx / this.canvas.width) * 2 - 1
            const ry = -(cy / this.canvas.height) * 2 + 1
            const raycaster = new Raycaster()
            raycaster.setFromCamera({x: rx, y: ry}, this.sceneMgr.camera)
            this.changeCursor(this.determineCursor(raycaster))
        }
        return super.handlePointerEvent(event)
    }

    determineCursor(raycaster: Raycaster): Cursor {
        if (this.sceneMgr.hasBuildModeSelection()) {
            return this.sceneMgr.buildMarker.lastCheck ? Cursor.Pointer_CanBuild : Cursor.Pointer_CannotBuild
        }
        let intersects = raycaster.intersectObjects(this.entityMgr.raiders.map((r) => r.sceneEntity.pickSphere))
        if (intersects.length > 0) return Cursor.Pointer_Selected
        intersects = raycaster.intersectObjects(this.entityMgr.vehicles.map((v) => v.sceneEntity.pickSphere))
        if (intersects.length > 0) {
            const userData = intersects[0].object.userData
            if (userData && userData.hasOwnProperty('selectable')) {
                const vehicle = userData['selectable'] as VehicleEntity
                if (!vehicle?.driver && this.entityMgr.selectedRaiders.length > 0) {
                    return Cursor.Pointer_GetIn
                }
            }
            return Cursor.Pointer_Selected
        }
        intersects = raycaster.intersectObjects(this.entityMgr.buildings.map((b) => b.sceneEntity.pickSphere))
        if (intersects.length > 0) return Cursor.Pointer_Selected
        intersects = raycaster.intersectObjects(this.sceneMgr.terrain.floorGroup.children)
        if (intersects.length > 0) {
            const userData = intersects[0].object.userData
            if (userData && userData.hasOwnProperty('surface')) {
                const surface = userData['surface'] as Surface
                if (surface) {
                    if (this.entityMgr.selectionType === SelectionType.RAIDER || this.entityMgr.selectionType === SelectionType.VEHICLE_MANED || this.entityMgr.selectionType === SelectionType.GROUP) {
                        if (surface.isDrillable()) {
                            return Cursor.Pointer_Drill // TODO check if selected entities can drill and return Pointer_CDrill otherwise
                        } else {
                            return surface.surfaceType.cursorFulfiller
                        }
                    } else {
                        return surface.surfaceType.cursor
                    }
                }
            }
        }
        return Cursor.Pointer_Standard
    }

    private changeCursor(cursor: Cursor, timeout: number = null) {
        if (timeout) {
            this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
            if (this.timedCursor !== cursor) this.setCursor(cursor)
            const that = this
            this.cursorTimeout = setTimeout(() => {
                that.cursorTimeout = null
                that.setCursor(that.currentCursor)
            }, timeout)
        } else if (this.currentCursor !== cursor) {
            this.currentCursor = cursor
            if (this.cursorTimeout) return
            this.setCursor(cursor)
        }
    }

    private setCursor(cursor: Cursor) {
        this.activeCursor?.disableAnimation()
        this.activeCursor = ResourceManager.getCursor(cursor)
        this.activeCursor.enableAnimation(this.canvas.style)
    }

}
