import { createCanvas } from '../../core/ImageHelper'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { EventKey } from '../../event/EventKeyEnum'
import { FollowerSetLookAtEvent, InitRadarMap, UpdateRadarEntityEvent, UpdateRadarSurface, UpdateRadarTerrain } from '../../event/LocalEvents'
import { MapMarkerChange, MapMarkerType } from '../../game/component/MapMarkerComponent'
import { BaseElement } from '../base/BaseElement'
import { MapSurfaceRect } from './MapSurfaceRect'
import { MapRenderer } from './MapRenderer'
import { GameEntity } from '../../game/ECS'
import { CameraControl, ChangeCursor, ChangeTooltip } from '../../event/GuiCommand'
import { TILESIZE, TOOLTIP_DELAY_SFX, TOOLTIP_DELAY_TEXT_SCENE } from '../../params'
import { EventBroker } from '../../event/EventBroker'
import { CURSOR } from '../../resource/Cursor'
import { Vector2 } from 'three'

export class MapView extends BaseElement {
    readonly mapRenderer: MapRenderer
    readonly surfaceSprite: SpriteImage
    readonly entitySprite: SpriteImage
    readonly monsterSprite: SpriteImage
    readonly materialSprite: SpriteImage
    readonly geoScanSprite: SpriteImage
    readonly offset: { x: number, y: number } = {x: 0, y: 0}
    readonly surfaceMap: MapSurfaceRect[][] = []
    entitiesByOrder: Map<MapMarkerType, Map<GameEntity, { x: number, z: number, r: number }>> = new Map()
    surfaceRectSizeMin: number = 10
    surfaceRectSizeMax: number = 15
    surfaceRectSize: number = 10
    terrainWidth: number = 0
    terrainHeight: number = 0
    lastSurface: MapSurfaceRect = null
    lastEntity: GameEntity = null
    entityBelowCursor: GameEntity = null

    constructor() {
        super()
        this.width = 152
        this.height = 149
        this.surfaceSprite = createCanvas(this.width, this.height)
        this.entitySprite = createCanvas(this.width, this.height)
        this.monsterSprite = createCanvas(this.width, this.height)
        this.materialSprite = createCanvas(this.width, this.height)
        this.geoScanSprite = createCanvas(this.width, this.height)
        this.mapRenderer = new MapRenderer(this.surfaceSprite, this.entitySprite, this.monsterSprite, this.materialSprite, this.geoScanSprite)
        this.relX = 15
        this.relY = 15
        this.onClick = (cx: number, cy: number) => {
            if (this.entityBelowCursor) EventBroker.publish(new FollowerSetLookAtEvent(this.entityBelowCursor))
            const surfaceScale = this.surfaceRectSizeMin / this.surfaceRectSize
            this.offset.x += (cx - this.x - this.width / 2) * surfaceScale
            this.offset.y += (cy - this.y - this.height / 2) * surfaceScale
            this.offset.x = Math.max(-this.width / 2, Math.min(this.terrainWidth * this.surfaceRectSizeMin - this.width / 2, this.offset.x))
            this.offset.y = Math.max(-this.height / 2, Math.min(this.terrainHeight * this.surfaceRectSizeMin - this.height / 2, this.offset.y))
            this.redrawAll()
        }
        this.registerEventListener(EventKey.INIT_RADAR_MAP, (event: InitRadarMap) => {
            this.terrainWidth = event.terrainWidth
            this.terrainHeight = event.terrainHeight
            this.offset.x = event.focusTile.x * this.surfaceRectSize - this.width / 2
            this.offset.y = event.focusTile.y * this.surfaceRectSize - this.height / 2
            this.surfaceMap.length = 0
            event.surfaces.forEach((s) => {
                this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
                this.surfaceMap[s.x][s.y] = s
            })
            this.redrawAll()
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_TERRAIN, (event: UpdateRadarTerrain) => {
            this.terrainWidth = event.terrainWidth
            this.terrainHeight = event.terrainHeight
            this.surfaceMap.length = 0
            event.surfaces.forEach((s) => {
                this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
                this.surfaceMap[s.x][s.y] = s
            })
            this.mapRenderer.redrawTerrain(this.offset, this.surfaceRectSize, this.surfaceMap).then(() => this.notifyRedraw())
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_SURFACE, (event: UpdateRadarSurface) => {
            const s = event.surfaceRect
            this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
            this.surfaceMap[s.x][s.y] = s
            this.mapRenderer.redrawSurface(this.offset, this.surfaceRectSize, event.surfaceRect).then(() => this.notifyRedraw())
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_ENTITY, (event: UpdateRadarEntityEvent) => {
            const entities = this.entitiesByOrder.getOrUpdate(event.mapMarkerType, () => new Map())
            switch (event.change) {
                case MapMarkerChange.UPDATE:
                    entities.set(event.entity, {...event.position, r: event.radius})
                    break
                case MapMarkerChange.REMOVE:
                    entities.delete(event.entity)
                    break
            }
            this.mapRenderer.redrawEntities(this.offset, event.mapMarkerType, this.surfaceRectSize, Array.from(entities.values())).then(() => this.notifyRedraw())
        })
    }

    zoomIn(): void {
        if (this.surfaceRectSize < this.surfaceRectSizeMax) {
            this.offset.x += (this.offset.x + this.width / 2) / this.surfaceRectSize
            this.offset.y += (this.offset.y + this.height / 2) / this.surfaceRectSize
            this.surfaceRectSize++
            this.redrawAll()
        }
    }

    zoomOut(): void {
        if (this.surfaceRectSize > this.surfaceRectSizeMin) {
            this.offset.x -= (this.offset.x + this.width / 2) / this.surfaceRectSize
            this.offset.y -= (this.offset.y + this.height / 2) / this.surfaceRectSize
            this.surfaceRectSize--
            this.redrawAll()
        }
    }

    private redrawAll() {
        Promise.all([
            this.mapRenderer.redrawTerrain(this.offset, this.surfaceRectSize, this.surfaceMap),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.DEFAULT, this.surfaceRectSize, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.DEFAULT, () => new Map()).values())),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.MONSTER, this.surfaceRectSize, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.MONSTER, () => new Map()).values())),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.MATERIAL, this.surfaceRectSize, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.MATERIAL, () => new Map()).values())),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.SCANNER, this.surfaceRectSize, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.SCANNER, () => new Map()).values())),
        ]).then(() => this.notifyRedraw())
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        super.onRedraw(context)
        context.drawImage(this.surfaceSprite, this.x, this.y)
        context.drawImage(this.entitySprite, this.x, this.y)
        context.drawImage(this.monsterSprite, this.x, this.y)
        context.drawImage(this.materialSprite, this.x, this.y)
        context.drawImage(this.geoScanSprite, this.x, this.y)
    }

    isInRect(sx: number, sy: number): boolean {
        const inRect = super.isInRect(sx, sy)
        this.entityBelowCursor = null
        if (inRect) {
            this.entitiesByOrder.forEach((entities) => {
                entities.forEach((pos, entity) => {
                    const tx = (sx - this.x + this.offset.x)
                    const ty = (sy - this.y + this.offset.y)
                    const ex = pos.x / TILESIZE * this.surfaceRectSize
                    const ez = pos.z / TILESIZE * this.surfaceRectSize
                    const dx = tx - ex
                    const dz = ty - ez
                    if (Math.abs(dx) <= 2 && Math.abs(dz) <= 2) { // TODO sync with rect size in MapRendererWorker
                        this.entityBelowCursor = entity
                        EventBroker.publish(new ChangeCursor(CURSOR.TRACK_OBJECT))
                        if (this.lastEntity !== entity) {
                            this.lastEntity = entity
                            // TODO get entity object name and publish tooltip event
                        }
                    }
                })
            })
            const surfaceX = Math.floor((sx - this.x + this.offset.x) / this.surfaceRectSize)
            const surfaceY = Math.floor((sy - this.y + this.offset.y) / this.surfaceRectSize)
            const surface = this.surfaceMap[surfaceX]?.[surfaceY]
            if (surface && surface !== this.lastSurface) {
                this.lastSurface = surface
                const objectName = surface.objectName
                if (objectName) EventBroker.publish(new ChangeTooltip(objectName, TOOLTIP_DELAY_TEXT_SCENE, surface.sfxKey, TOOLTIP_DELAY_SFX))
            }
        }
        return inRect
    }

    onDrag(x: number, y: number) {
        super.onDrag(x, y)
        const tx = (x - this.x + this.offset.x)
        const ty = (y - this.y + this.offset.y)
        const worldPos = new Vector2(tx, ty).multiplyScalar(TILESIZE / this.surfaceRectSize)
        EventBroker.publish(new CameraControl({jumpToWorld: worldPos}))
    }
}
