import { Vector2 } from 'three'
import { createContext } from '../../core/ImageHelper'
import { SpriteContext } from '../../core/Sprite'
import { EventKey } from '../../event/EventKeyEnum'
import { UpdateRadarEntities, UpdateRadarSurface, UpdateRadarTerrain } from '../../event/LocalEvents'
import { MapMarkerType } from '../../game/component/EntityMapMarkerComponent'
import { TILESIZE } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { MapSurfaceRect } from './MapSurfaceRect'

export class MapPanel extends Panel {
    combinedContext: SpriteContext
    surfaceContext: SpriteContext
    entityContext: SpriteContext
    offset: Vector2 = new Vector2()
    surfaceRectSize: number = 10
    surfaceRectMargin: number = 1
    surfaceMap: MapSurfaceRect[][] = []

    constructor(parent: BaseElement) {
        super(parent, null)
        this.width = 152
        this.height = 149
        this.combinedContext = createContext(this.width, this.height)
        this.surfaceContext = createContext(this.width, this.height)
        this.entityContext = createContext(this.width, this.height)
        this.img = this.combinedContext.canvas
        this.relX = this.xIn = this.xOut = 15
        this.relY = this.yIn = this.yOut = 15
        this.onClick = (cx: number, cy: number) => {
            const mapX = cx - this.x
            const mapY = cy - this.y
            this.offset.x += mapX - this.width / 2
            this.offset.y += mapY - this.height / 2
            this.redrawMapSurfaces(true)
        }
        this.registerEventListener(EventKey.UPDATE_RADAR_TERRAIN, (event: UpdateRadarTerrain) => {
            this.surfaceMap = []
            event.surfaces.forEach((s) => {
                this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
                this.surfaceMap[s.x][s.y] = s
            })
            if (event.focusTile) {
                this.offset.x = event.focusTile.x * this.surfaceRectSize - this.width / 2
                this.offset.y = event.focusTile.y * this.surfaceRectSize - this.height / 2
            }
            this.redrawMapSurfaces()
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_SURFACE, (event: UpdateRadarSurface) => {
            const s = event.surfaceRect
            this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
            this.surfaceMap[s.x][s.y] = s
            this.redrawSurface(s)
            this.notifyRedraw()
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_ENTITIES, (event: UpdateRadarEntities) => {
            this.redrawMapEntities(event)
        })
    }

    private redrawMapSurfaces(forceRedraw: boolean = false) {
        this.surfaceContext.fillStyle = '#000'
        this.surfaceContext.fillRect(0, 0, this.surfaceContext.canvas.width, this.surfaceContext.canvas.height)
        this.surfaceMap.forEach((r) => r.forEach((s) => this.redrawSurface(s)))
        this.combinedContext.drawImage(this.surfaceContext.canvas, 0, 0)
        this.combinedContext.drawImage(this.entityContext.canvas, 0, 0)
        if (forceRedraw) this.notifyRedraw()
    }

    private redrawSurface(surfaceRect: MapSurfaceRect) {
        const surfaceX = Math.round(surfaceRect.x * this.surfaceRectSize - this.offset.x)
        const surfaceY = Math.round(surfaceRect.y * this.surfaceRectSize - this.offset.y)
        if (surfaceRect.borderColor) {
            this.surfaceContext.fillStyle = surfaceRect.borderColor
            this.surfaceContext.fillRect(surfaceX, surfaceY, this.surfaceRectSize - this.surfaceRectMargin, this.surfaceRectSize - this.surfaceRectMargin)
            this.surfaceContext.fillStyle = surfaceRect.surfaceColor
            this.surfaceContext.fillRect(surfaceX + 1, surfaceY + 1, this.surfaceRectSize - this.surfaceRectMargin - 2, this.surfaceRectSize - this.surfaceRectMargin - 2)
        } else {
            this.surfaceContext.fillStyle = surfaceRect.surfaceColor
            this.surfaceContext.fillRect(surfaceX, surfaceY, this.surfaceRectSize - this.surfaceRectMargin, this.surfaceRectSize - this.surfaceRectMargin)
        }
    }

    private redrawMapEntities(event: UpdateRadarEntities) {
        this.entityContext.clearRect(0, 0, this.entityContext.canvas.width, this.entityContext.canvas.height)
        this.entityContext.fillStyle = '#edd20c'
        event.entitiesByOrder.getOrDefault(MapMarkerType.DEFAULT, [])
            .map((v) => this.mapToMap(v)).forEach((p) => {
            this.entityContext.fillRect(p.x, p.y, 3, 3)
        })
        this.entityContext.fillStyle = '#f00'
        event.entitiesByOrder.getOrDefault(MapMarkerType.MONSTER, [])
            .map((v) => this.mapToMap(v)).forEach((p) => {
            this.entityContext.fillRect(p.x, p.y, 3, 3)
        })
        this.entityContext.fillStyle = '#0f0'
        event.entitiesByOrder.getOrDefault(MapMarkerType.MATERIAL, [])
            .map((v) => this.mapToMap(v)).forEach((p) => {
            this.entityContext.fillRect(p.x, p.y, 2, 2)
        })
        // TODO only redraw, when visible actually changed position
        this.combinedContext.drawImage(this.surfaceContext.canvas, 0, 0)
        this.combinedContext.drawImage(this.entityContext.canvas, 0, 0)
        this.notifyRedraw()
    }

    private mapToMap(vec: { x: number, y: number }): Vector2 {
        return new Vector2(vec.x, vec.y).multiplyScalar(this.surfaceRectSize / TILESIZE).round().subScalar(1).sub(this.offset)
    }
}
