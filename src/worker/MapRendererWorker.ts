import { TypedWorkerBackend, TypedWorkerThreaded } from './TypedWorker'
import { WorkerMessageType } from '../resource/wadworker/WorkerMessageType'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { MAP_PANEL_SURFACE_RECT_MARGIN, TILESIZE } from '../params'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MapMarkerType } from '../game/component/MapMarkerComponent'

type MapRendererInitMessage = {
    type: WorkerMessageType.INIT
    terrainSprite: SpriteImage
    entitySprite: SpriteImage
    monsterSprite: SpriteImage
    materialSprite: SpriteImage
}

type MapRendererRenderMessage = {
    type: WorkerMessageType.MAP_RENDER_TERRAIN | WorkerMessageType.MAP_RENDER_SURFACE | WorkerMessageType.MAP_RENDER_ENTITIES
    requestId: string
    offset: { x: number, y: number }
    surfaceRectSize?: number
    terrain?: MapSurfaceRect[][]
    surface?: MapSurfaceRect
    mapMarkerType?: MapMarkerType
    entities?: { x: number, z: number }[]
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

    constructor(readonly worker: TypedWorkerBackend<MapRendererMessage, MapRendererResponse>) {
        this.worker.onMessageFromFrontend = (msg) => this.processMessage(msg)
    }

    processMessage(msg: MapRendererMessage) {
        if (this.isInitMessage(msg)) {
            this.surfaceContext = msg.terrainSprite.getContext('2d') as SpriteContext
            this.monsterContext = msg.monsterSprite.getContext('2d') as SpriteContext
            this.materialContext = msg.materialSprite.getContext('2d') as SpriteContext
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
                            this.redrawEntities(this.entityContext, '#e8d400', msg.offset, msg.entities, msg.surfaceRectSize, 4)
                            break
                        case MapMarkerType.MONSTER:
                            this.redrawEntities(this.monsterContext, '#f00', msg.offset, msg.entities, msg.surfaceRectSize, 3)
                            break
                        case MapMarkerType.MATERIAL:
                            this.redrawEntities(this.materialContext, '#0f0', msg.offset, msg.entities, msg.surfaceRectSize, 2)
                            break
                    }
                    break
            }
            this.worker.sendResponse({type: WorkerMessageType.RESPONSE_MAP_RENDERER, requestId: msg.requestId})
        }
    }

    private isInitMessage(msg?: MapRendererMessage): msg is MapRendererInitMessage {
        return msg?.type === WorkerMessageType.INIT
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

    private redrawEntities(entityContext: SpriteContext, color: string, offset: { x: number; y: number }, entities: { x: number; z: number }[], surfaceRectSize: number, size: number) {
        entityContext.clearRect(0, 0, entityContext.canvas.width, entityContext.canvas.height)
        entityContext.fillStyle = color
        entities.map((e) => this.mapToMap(offset, e, surfaceRectSize)).forEach((p) => {
            const x = Math.round(p.x - size / 2)
            const y = Math.round(p.y - size / 2)
            entityContext.fillRect(x, y, Math.round(size), Math.round(size))
        })
    }

    private mapToMap(offset: { x: number; y: number }, vec: { x: number; z: number }, surfaceRectSize: number): { x: number; y: number } {
        return {
            x: Math.round(vec.x * surfaceRectSize / TILESIZE - 1 - offset.x),
            y: Math.round(vec.z * surfaceRectSize / TILESIZE - 1 - offset.y),
        }
    }
}

const worker: Worker = self as any
new MapRendererWorker(new TypedWorkerThreaded(worker))
