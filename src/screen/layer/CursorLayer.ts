import { Intersection, Raycaster } from 'three'
import { Cursor } from '../../cfg/PointerCfg'
import { cloneContext } from '../../core/ImageHelper'
import { clearTimeoutSafe } from '../../core/Util'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { KEY_EVENT, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GameKeyboardEvent } from '../../event/GameKeyboardEvent'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { TakeScreenshot } from '../../event/GuiCommand'
import { IEventHandler } from '../../event/IEventHandler'
import { ChangeCursor } from '../../event/LocalEvents'
import { EntityManager } from '../../game/EntityManager'
import { EntityType } from '../../game/model/EntityType'
import { Surface } from '../../game/model/map/Surface'
import { VehicleEntity } from '../../game/model/vehicle/VehicleEntity'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedCursor } from '../AnimatedCursor'
import { ScreenLayer } from './ScreenLayer'

export class CursorLayer extends ScreenLayer {
    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    currentCursor: Cursor = null
    timedCursor: Cursor = null
    cursorTimeout: NodeJS.Timeout = null
    activeCursor: AnimatedCursor = null
    cursorCanvasPos: { x: number, y: number } = {x: 0, y: 0}
    cursorRelativePos: { x: number, y: number } = {x: 0, y: 0}

    constructor(parent: IEventHandler) {
        super(true, false)
        parent.registerEventListener(EventKey.CHANGE_CURSOR, (event: ChangeCursor) => {
            if (this.active) this.changeCursor(event.cursor, event.timeout)
        })
        parent.registerEventListener(EventKey.SELECTION_CHANGED, () => {
            if (this.active) this.changeCursor(this.determineCursor())
        })
        // TODO change cursor when an entity moves below cursor
    }

    reset() {
        this.changeCursor('pointerStandard')
    }

    show() {
        this.reset()
        super.show()
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

    handleKeyEvent(event: GameKeyboardEvent): Promise<boolean> {
        if (event.key === 'p') {
            if (event.eventEnum === KEY_EVENT.DOWN) EventBus.publishEvent(new TakeScreenshot())
            return new Promise((resolve) => resolve(true))
        } else {
            return super.handleKeyEvent(event)
        }
    }

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        if (event.eventEnum === POINTER_EVENT.MOVE && this.sceneMgr) {
            const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
            this.cursorCanvasPos = {x: cx, y: cy}
            this.cursorRelativePos = {x: (cx / this.canvas.width) * 2 - 1, y: -(cy / this.canvas.height) * 2 + 1}
            this.changeCursor(this.determineCursor())
        }
        return super.handlePointerEvent(event)
    }

    determineCursor(): Cursor {
        if (this.sceneMgr.hasBuildModeSelection()) {
            return this.sceneMgr.buildMarker.lastCheck ? 'pointerCanBuild' : 'pointerCannotBuild'
        }
        // TODO use sceneManager.getFirstByRay here too?!
        const raycaster = new Raycaster()
        raycaster.setFromCamera(this.cursorRelativePos, this.sceneMgr.camera)
        const intersectsRaider = raycaster.intersectObjects(this.entityMgr.raiders.map((r) => r.sceneEntity.pickSphere))
        if (intersectsRaider.length > 0) return 'pointerSelected'
        const intersectsVehicle = raycaster.intersectObjects(this.entityMgr.vehicles.map((v) => v.sceneEntity.pickSphere))
        if (intersectsVehicle.length > 0) {
            const vehicle = intersectsVehicle[0].object.userData?.selectable as VehicleEntity
            if (!vehicle?.driver && this.entityMgr.selection.raiders.length > 0) {
                return 'pointerGetIn'
            }
            return 'pointerSelected'
        }
        const intersectsBuilding = raycaster.intersectObjects(this.entityMgr.buildings.map((b) => b.sceneEntity.pickSphere))
        if (intersectsBuilding.length > 0) return 'pointerSelected'
        const intersectsMaterial = raycaster.intersectObjects(this.entityMgr.materials.map((m) => m.sceneEntity.pickSphere).filter((p) => !!p))
        if (intersectsMaterial.length > 0) {
            return this.determineMaterialCursor(intersectsMaterial)
        }
        const surfaces = this.sceneMgr.terrain?.floorGroup?.children
        if (surfaces) {
            const intersectsSurface = raycaster.intersectObjects(surfaces)
            if (intersectsSurface.length > 0) {
                return this.determineSurfaceCursor(intersectsSurface[0].object.userData?.surface)
            }
        }
        return 'pointerStandard'
    }

    private determineMaterialCursor(intersectsMaterial: Intersection[]): Cursor {
        if (this.entityMgr.selection.canPickup()) {
            if (intersectsMaterial[0].object.userData?.entityType === EntityType.ORE) {
                return 'pointerPickUpOre'
            } else {
                return 'pointerPickUp'
            }
        }
        return 'pointerSelected'
    }

    private determineSurfaceCursor(surface: Surface): Cursor {
        if (!surface) return 'pointerStandard'
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

    takeScreenshotFromLayer(): Promise<HTMLCanvasElement> {
        const cx = this.cursorCanvasPos.x
        const cy = this.cursorCanvasPos.y
        const encoded = this.canvas.style.cursor.match(/"(.+)"/)?.[1]
        if (!encoded) throw new Error('Could not extract encoded url from layer style attributes')
        return new Promise<HTMLCanvasElement>((resolve) => {
            const context = cloneContext(this.canvas)
            const img = document.createElement('img')
            img.onload = () => {
                context.drawImage(img, cx, cy)
                resolve(context.canvas)
            }
            img.onerror = () => {
                throw new Error('Could decode image for screenshot')
            }
            img.src = encoded
        })
    }
}
