import { createContext } from '../../core/ImageHelper'
import { EventKey } from '../../event/EventKeyEnum'
import { UpdateRadarSurface, UpdateRadarTerrain } from '../../event/LocalEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { MapSurfaceRect } from './MapSurfaceRect'

export class MapPanel extends Panel {

    context: SpriteContext
    offsetX: number = 0
    offsetY: number = 0
    surfaceRectSize: number = 10
    surfaceRectMargin: number = 1
    surfaceMap: MapSurfaceRect[][] = []

    constructor(parent: BaseElement) {
        super(parent, null)
        this.width = 152
        this.height = 149
        this.context = createContext(this.width, this.height)
        this.img = this.context.canvas
        this.relX = this.xIn = this.xOut = 15
        this.relY = this.yIn = this.yOut = 15
        this.onClick = (cx: number, cy: number) => {
            const mapX = cx - this.x
            const mapY = cy - this.y
            this.offsetX += mapX - this.width / 2
            this.offsetY += mapY - this.height / 2
            this.redrawMap(true)
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
            this.redrawMap()
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_SURFACE, (event: UpdateRadarSurface) => {
            const s = event.surfaceRect
            this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
            this.surfaceMap[s.x][s.y] = s
            this.redrawSurface(s)
            this.notifyRedraw()
        })
    }

    redrawMap(forceRedraw: boolean = false) {
        this.context.fillStyle = '#000'
        this.context.fillRect(0, 0, this.img.width, this.img.height)
        this.surfaceMap.forEach((r) => r.forEach((s) => this.redrawSurface(s)))
        if (forceRedraw) this.notifyRedraw()
    }

    redrawSurface(surfaceRect: MapSurfaceRect) {
        const surfaceX = Math.round(surfaceRect.x * this.surfaceRectSize + this.surfaceRectMargin - this.offsetX)
        const surfaceY = Math.round(surfaceRect.y * this.surfaceRectSize + this.surfaceRectMargin - this.offsetY)
        if (surfaceRect.borderColor) {
            this.context.fillStyle = surfaceRect.borderColor
            this.context.fillRect(surfaceX, surfaceY, this.surfaceRectSize - this.surfaceRectMargin, this.surfaceRectSize - this.surfaceRectMargin)
            this.context.fillStyle = surfaceRect.surfaceColor
            this.context.fillRect(surfaceX + 1, surfaceY + 1, this.surfaceRectSize - this.surfaceRectMargin - 2, this.surfaceRectSize - this.surfaceRectMargin - 2)
        } else {
            this.context.fillStyle = surfaceRect.surfaceColor
            this.context.fillRect(surfaceX, surfaceY, this.surfaceRectSize - this.surfaceRectMargin, this.surfaceRectSize - this.surfaceRectMargin)
        }
    }

}
