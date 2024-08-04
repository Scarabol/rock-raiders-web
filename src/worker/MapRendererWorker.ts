import { TypedWorkerBackend, TypedWorkerThreaded } from './TypedWorker'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { MAP_MAX_UPDATE_INTERVAL, MAP_PANEL_SURFACE_RECT_MARGIN, TILESIZE } from '../params'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MapMarkerType } from '../game/component/MapMarkerComponent'

export enum MapRendererWorkerRequestType {
    RESPONSE_MAP_RENDERER = 1, // start with 1 for truthiness safety
    MAP_RENDERER_INIT,
    MAP_RENDER_TERRAIN,
    MAP_RENDER_SURFACE,
    MAP_RENDER_ENTITIES,
}

type MapRendererInitMessage = {
    type: MapRendererWorkerRequestType.MAP_RENDERER_INIT
    terrainSprite: SpriteImage
    entitySprite: SpriteImage
    monsterSprite: SpriteImage
    materialSprite: SpriteImage
    geoScanSprite: SpriteImage
}

type MapRendererTerrainRenderMessage = {
    type: MapRendererWorkerRequestType.MAP_RENDER_TERRAIN
    requestId: string
    offset: { x: number, y: number }
    surfaceRectSize: number
    terrain: MapSurfaceRect[][]
}

type MapRendererSurfaceRenderMessage = {
    type: MapRendererWorkerRequestType.MAP_RENDER_SURFACE
    requestId: string
    offset: { x: number, y: number }
    surfaceRectSize: number
    surface: MapSurfaceRect
}

type MapRendererEntitiesRenderMessage = {
    type: MapRendererWorkerRequestType.MAP_RENDER_ENTITIES
    requestId: string
    offset: { x: number, y: number }
    surfaceRectSize: number
    mapMarkerType: MapMarkerType
    entities: { x: number, z: number, r: number }[]
}

export type MapRendererMessage = MapRendererInitMessage | MapRendererTerrainRenderMessage | MapRendererSurfaceRenderMessage | MapRendererEntitiesRenderMessage

export type MapRendererResponse = {
    type: MapRendererWorkerRequestType.RESPONSE_MAP_RENDERER
    requestId: string
}

export class MapRendererWorker {
    surfaceContext?: SpriteContext
    entityContext?: SpriteContext
    monsterContext?: SpriteContext
    materialContext?: SpriteContext
    geoScanContext?: SpriteContext
    blocked: Set<MapMarkerType> = new Set()
    markedDirty: Map<MapMarkerType, MapRendererEntitiesRenderMessage> = new Map()

    constructor(readonly worker: TypedWorkerBackend<MapRendererMessage, MapRendererResponse>) {
        this.worker.onMessageFromFrontend = (msg) => this.processMessage(msg)
    }

    processMessage(msg: MapRendererMessage) {
        if (msg.type === MapRendererWorkerRequestType.MAP_RENDERER_INIT) {
            this.surfaceContext = msg.terrainSprite.getContext('2d') as SpriteContext
            this.monsterContext = msg.monsterSprite.getContext('2d') as SpriteContext
            this.materialContext = msg.materialSprite.getContext('2d') as SpriteContext
            this.geoScanContext = msg.geoScanSprite.getContext('2d') as SpriteContext
            this.entityContext = msg.entitySprite.getContext('2d') as SpriteContext
        } else {
            switch (msg.type) {
                case MapRendererWorkerRequestType.MAP_RENDER_TERRAIN:
                    this.redrawTerrain(msg.offset, msg.surfaceRectSize, msg.terrain)
                    break
                case MapRendererWorkerRequestType.MAP_RENDER_SURFACE:
                    this.redrawSurface(msg.offset, msg.surfaceRectSize, msg.surface)
                    break
                case MapRendererWorkerRequestType.MAP_RENDER_ENTITIES:
                    switch (msg.mapMarkerType) {
                        case MapMarkerType.DEFAULT:
                            this.redrawEntitiesContext(msg, this.entityContext, '#e8d400', 4)
                            break
                        case MapMarkerType.MONSTER:
                            this.redrawEntitiesContext(msg, this.monsterContext, '#f00', 3)
                            break
                        case MapMarkerType.MATERIAL:
                            this.redrawEntitiesContext(msg, this.materialContext, '#0f0', 2)
                            break
                        case MapMarkerType.SCANNER:
                            this.redrawGeoScanContext(msg)
                            break
                    }
                    break
            }
            this.worker.sendResponse({type: MapRendererWorkerRequestType.RESPONSE_MAP_RENDERER, requestId: msg.requestId})
        }
    }

    private redrawEntitiesContext(msg: MapRendererEntitiesRenderMessage, context: SpriteContext | undefined, rectColor: string, rectSize: number) {
        if (!context) return
        if (this.blocked.has(msg.mapMarkerType)) {
            this.markedDirty.set(msg.mapMarkerType, msg)
            return
        }
        this.blocked.add(msg.mapMarkerType)
        setTimeout(() => {
            this.blocked.delete(msg.mapMarkerType)
            const dirty = this.markedDirty.get(msg.mapMarkerType)
            this.markedDirty.delete(msg.mapMarkerType)
            if (dirty) this.redrawEntitiesContext(dirty, context, rectColor, rectSize)
        }, MAP_MAX_UPDATE_INTERVAL)
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        context.fillStyle = rectColor
        msg.entities.forEach((e) => {
            const x = Math.round(e.x * msg.surfaceRectSize / TILESIZE - msg.offset.x - rectSize / 2)
            const y = Math.round(e.z * msg.surfaceRectSize / TILESIZE - msg.offset.y - rectSize / 2)
            context.fillRect(x, y, rectSize, rectSize)
        })
    }

    private redrawGeoScanContext(msg: MapRendererEntitiesRenderMessage) {
        const geoScanContext = this.geoScanContext
        if (!geoScanContext) return
        if (this.blocked.has(msg.mapMarkerType)) {
            this.markedDirty.set(msg.mapMarkerType, msg)
            return
        }
        this.blocked.add(msg.mapMarkerType)
        setTimeout(() => {
            this.blocked.delete(msg.mapMarkerType)
            const dirty = this.markedDirty.get(msg.mapMarkerType)
            this.markedDirty.delete(msg.mapMarkerType)
            if (dirty) this.redrawGeoScanContext(dirty)
        }, MAP_MAX_UPDATE_INTERVAL)
        geoScanContext.clearRect(0, 0, geoScanContext.canvas.width, geoScanContext.canvas.height)
        geoScanContext.strokeStyle = '#fff'
        geoScanContext.lineWidth = 1
        msg.entities.forEach((e) => {
            const scanRadius = Math.round(e.r * msg.surfaceRectSize)
            const x = Math.round(e.x * msg.surfaceRectSize / TILESIZE - msg.offset.x)
            const y = Math.round(e.z * msg.surfaceRectSize / TILESIZE - msg.offset.y)
            geoScanContext.beginPath()
            geoScanContext.setLineDash([1, 1])
            geoScanContext.ellipse(x, y, scanRadius, scanRadius, 0, 0, 2 * Math.PI)
            geoScanContext.stroke()
        })
    }

    private redrawTerrain(offset: { x: number, y: number }, surfaceRectSize: number, terrain: MapSurfaceRect[][]) {
        if (!this.surfaceContext) return
        this.surfaceContext.fillStyle = '#000'
        this.surfaceContext.fillRect(0, 0, this.surfaceContext.canvas.width, this.surfaceContext.canvas.height)
        terrain.forEach((r) => r.forEach((s) => this.redrawSurface(offset, surfaceRectSize, s)))
    }

    private redrawSurface(offset: { x: number, y: number }, surfaceRectSize: number, surfaceRect: MapSurfaceRect) {
        if (!this.surfaceContext) return
        const surfaceX = Math.round(surfaceRect.x * surfaceRectSize - offset.x)
        const surfaceY = Math.round(surfaceRect.y * surfaceRectSize - offset.y)
        const rectSize = surfaceRectSize - MAP_PANEL_SURFACE_RECT_MARGIN
        this.surfaceContext.fillStyle = surfaceRect.borderColor ? surfaceRect.borderColor : surfaceRect.surfaceColor
        this.surfaceContext.fillRect(surfaceX, surfaceY, rectSize, rectSize)
        if (surfaceRect.borderColor) {
            this.surfaceContext.fillStyle = surfaceRect.surfaceColor
            this.surfaceContext.fillRect(surfaceX, surfaceY, rectSize, rectSize)
        }
    }
}

const worker: Worker = self as any
new MapRendererWorker(new TypedWorkerThreaded(worker))
