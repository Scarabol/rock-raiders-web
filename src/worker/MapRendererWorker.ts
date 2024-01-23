import { TypedWorkerBackend, TypedWorkerThreaded } from './TypedWorker'
import { WorkerMessageType } from './WorkerMessageType'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { MAP_MAX_UPDATE_INTERVAL, MAP_PANEL_SURFACE_RECT_MARGIN, TILESIZE } from '../params'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MapMarkerType } from '../game/component/MapMarkerComponent'

type MapRendererInitMessage = {
    type: WorkerMessageType.MAP_RENDERER_INIT
    terrainSprite: SpriteImage
    entitySprite: SpriteImage
    monsterSprite: SpriteImage
    materialSprite: SpriteImage
    geoScanSprite: SpriteImage
}

type MapRendererRenderMessage = {
    type: WorkerMessageType.MAP_RENDER_TERRAIN | WorkerMessageType.MAP_RENDER_SURFACE | WorkerMessageType.MAP_RENDER_ENTITIES
    requestId: string
    offset: { x: number, y: number }
    surfaceRectSize?: number
    terrain?: MapSurfaceRect[][]
    surface?: MapSurfaceRect
    mapMarkerType?: MapMarkerType
    entities?: { x: number, z: number, r: number }[]
}

export type MapRendererMessage = MapRendererInitMessage | MapRendererRenderMessage

export type MapRendererResponse = {
    type: WorkerMessageType.RESPONSE_MAP_RENDERER
    requestId: string
}

export class MapRendererWorker {
    surfaceContext: SpriteContext
    entityContext: SpriteContext
    monsterContext: SpriteContext
    materialContext: SpriteContext
    geoScanContext: SpriteContext
    blocked: Set<MapMarkerType> = new Set()
    markedDirty: Map<MapMarkerType, MapRendererRenderMessage> = new Map()

    constructor(readonly worker: TypedWorkerBackend<MapRendererMessage, MapRendererResponse>) {
        this.worker.onMessageFromFrontend = (msg) => this.processMessage(msg)
    }

    processMessage(msg: MapRendererMessage) {
        if (this.isInitMessage(msg)) {
            this.surfaceContext = msg.terrainSprite.getContext('2d') as SpriteContext
            this.monsterContext = msg.monsterSprite.getContext('2d') as SpriteContext
            this.materialContext = msg.materialSprite.getContext('2d') as SpriteContext
            this.geoScanContext = msg.geoScanSprite.getContext('2d') as SpriteContext
            this.entityContext = msg.entitySprite.getContext('2d') as SpriteContext
        } else if (this.isRenderMessage(msg)) {
            switch (msg.type) {
                case WorkerMessageType.MAP_RENDER_TERRAIN:
                    this.redrawTerrain(msg.offset, msg.surfaceRectSize, msg.terrain)
                    break
                case WorkerMessageType.MAP_RENDER_SURFACE:
                    this.redrawSurface(msg.offset, msg.surfaceRectSize, msg.surface)
                    break
                case WorkerMessageType.MAP_RENDER_ENTITIES:
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
            this.worker.sendResponse({type: WorkerMessageType.RESPONSE_MAP_RENDERER, requestId: msg.requestId})
        }
    }

    private redrawEntitiesContext(msg: MapRendererRenderMessage, context: SpriteContext, rectColor: string, rectSize: number) {
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

    private redrawGeoScanContext(msg: MapRendererRenderMessage) {
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
        this.geoScanContext.clearRect(0, 0, this.geoScanContext.canvas.width, this.geoScanContext.canvas.height)
        this.geoScanContext.strokeStyle = '#fff'
        this.geoScanContext.lineWidth = 1
        msg.entities.forEach((e) => {
            const scanRadius = Math.round(e.r * msg.surfaceRectSize)
            const x = Math.round(e.x * msg.surfaceRectSize / TILESIZE - msg.offset.x)
            const y = Math.round(e.z * msg.surfaceRectSize / TILESIZE - msg.offset.y)
            this.geoScanContext.beginPath()
            this.geoScanContext.setLineDash([1, 1])
            this.geoScanContext.ellipse(x, y, scanRadius, scanRadius, 0, 0, 2 * Math.PI)
            this.geoScanContext.stroke()
        })
    }

    private isInitMessage(msg?: MapRendererMessage): msg is MapRendererInitMessage {
        return msg?.type === WorkerMessageType.MAP_RENDERER_INIT
    }

    private isRenderMessage(msg?: MapRendererMessage): msg is MapRendererRenderMessage {
        switch (msg?.type) {
            case WorkerMessageType.MAP_RENDER_TERRAIN:
            case WorkerMessageType.MAP_RENDER_SURFACE:
            case WorkerMessageType.MAP_RENDER_ENTITIES:
                return true
        }
        return false
    }

    private redrawTerrain(offset: { x: number, y: number }, surfaceRectSize: number, terrain: MapSurfaceRect[][]) {
        this.surfaceContext.fillStyle = '#000'
        this.surfaceContext.fillRect(0, 0, this.surfaceContext.canvas.width, this.surfaceContext.canvas.height)
        terrain.forEach((r) => r.forEach((s) => this.redrawSurface(offset, surfaceRectSize, s)))
    }

    private redrawSurface(offset: { x: number, y: number }, surfaceRectSize: number, surfaceRect: MapSurfaceRect) {
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
