import { createContext } from '../../core/ImageHelper'
import { EventKey } from '../../event/EventKeyEnum'
import { UpdateRadarEntities, UpdateRadarSurface, UpdateRadarTerrain } from '../../event/LocalEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { MapSurfaceRect } from './MapSurfaceRect'

export class MapPanel extends Panel {
    combinedContext: SpriteContext
    surfaceContext: SpriteContext
    entityContext: SpriteContext
    offsetX: number = 0
    offsetY: number = 0
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
            this.offsetX += mapX - this.width / 2
            this.offsetY += mapY - this.height / 2
            this.redrawMapSurfaces(true)
        }
        this.registerEventListener(EventKey.UPDATE_RADAR_TERRAIN, (event: UpdateRadarTerrain) => {
            this.surfaceMap = []
            event.surfaces.forEach((s) => {
                this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
                this.surfaceMap[s.x][s.y] = s
            })
            if (event.focusTile) {
                this.offsetX = event.focusTile.x * this.surfaceRectSize - this.width / 2
                this.offsetY = event.focusTile.y * this.surfaceRectSize - this.height / 2
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
        const surfaceX = Math.round(surfaceRect.x * this.surfaceRectSize - this.offsetX)
        const surfaceY = Math.round(surfaceRect.y * this.surfaceRectSize - this.offsetY)
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
        event.fulfillers.forEach((f) => {
            const x = Math.round(f.x * this.surfaceRectSize) - 1 - this.offsetX
            const y = Math.round(f.y * this.surfaceRectSize) - 1 - this.offsetY
            this.entityContext.fillRect(x, y, 3, 3)
        })
        this.entityContext.fillStyle = '#f00'
        event.monsters.forEach((m) => {
            const x = Math.round(m.x * this.surfaceRectSize) - 1 - this.offsetX
            const y = Math.round(m.y * this.surfaceRectSize) - 1 - this.offsetY
            this.entityContext.fillRect(x, y, 3, 3)
        })
        this.entityContext.fillStyle = '#0f0'
        event.materials.forEach((m) => {
            const x = Math.round(m.x * this.surfaceRectSize) - 1 - this.offsetX
            const y = Math.round(m.y * this.surfaceRectSize) - 1 - this.offsetY
            this.entityContext.fillRect(x, y, 2, 2)
        })
        // TODO only redraw, when visible actually changed position
        this.combinedContext.drawImage(this.surfaceContext.canvas, 0, 0)
        this.combinedContext.drawImage(this.entityContext.canvas, 0, 0)
        this.notifyRedraw()
    }
}
