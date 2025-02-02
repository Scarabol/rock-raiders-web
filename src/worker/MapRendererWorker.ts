import { TypedWorkerBackend, TypedWorkerThreaded } from './TypedWorker'
import { MapSurfaceRect } from '../gui/radar/MapSurfaceRect'
import { MAP_MAX_UPDATE_INTERVAL, MAP_PANEL_SURFACE_RECT_MARGIN, TILESIZE } from '../params'
import { SpriteContext, SpriteImage } from '../core/Sprite'
import { MapMarkerType } from '../game/component/MapMarkerComponent'
import { Vector2 } from 'three'

export enum MapRendererWorkerRequestType {
    RESPONSE_MAP_RENDERER = 1, // start with 1 for truthiness safety
    MAP_RENDERER_INIT,
    MAP_RENDER_TERRAIN,
    MAP_RENDER_SURFACE,
    MAP_RENDER_ENTITIES,
    MAP_RENDER_CAMERA,
}

type MapRendererInitMessage = {
    type: MapRendererWorkerRequestType.MAP_RENDERER_INIT
    terrainSprite: SpriteImage
    entitySprite: SpriteImage
    monsterSprite: SpriteImage
    materialSprite: SpriteImage
    geoScanSprite: SpriteImage
    cameraSprite: SpriteImage
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

type MapRendererCameraRenderMessage = {
    type: MapRendererWorkerRequestType.MAP_RENDER_CAMERA
    requestId: string
    offset: { x: number, y: number }
    surfaceRectSize: number
    rect: MapRendererCameraRect
}

export type MapRendererCameraRect = {
    topLeft: { x: number, z: number }
    topRight: { x: number, z: number }
    bottomRight: { x: number, z: number }
    bottomLeft: { x: number, z: number }
}

export type MapRendererMessage = MapRendererInitMessage | MapRendererTerrainRenderMessage | MapRendererSurfaceRenderMessage | MapRendererEntitiesRenderMessage | MapRendererCameraRenderMessage

export type MapRendererResponse = {
    type: MapRendererWorkerRequestType.RESPONSE_MAP_RENDERER
    requestId: string
}

export class MapRendererWorker {
    surfaceContext: SpriteContext | null = null
    entityContext: SpriteContext | null = null
    monsterContext: SpriteContext | null = null
    materialContext: SpriteContext | null = null
    geoScanContext: SpriteContext | null = null
    cameraContext: SpriteContext | null = null
    blocked: Set<MapMarkerType> = new Set()
    markedDirty: Map<MapMarkerType, MapRendererEntitiesRenderMessage> = new Map()

    constructor(readonly worker: TypedWorkerBackend<MapRendererMessage, MapRendererResponse>) {
        this.worker.onMessageFromFrontend = (msg) => this.processMessage(msg)
    }

    processMessage(msg: MapRendererMessage) {
        if (msg.type === MapRendererWorkerRequestType.MAP_RENDERER_INIT) {
            this.surfaceContext = msg.terrainSprite.getContext('2d')
            this.monsterContext = msg.monsterSprite.getContext('2d')
            this.materialContext = msg.materialSprite.getContext('2d')
            this.geoScanContext = msg.geoScanSprite.getContext('2d')
            this.entityContext = msg.entitySprite.getContext('2d')
            this.cameraContext = msg.cameraSprite.getContext('2d')
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
                case MapRendererWorkerRequestType.MAP_RENDER_CAMERA:
                    this.redrawCamera(msg.offset, msg.surfaceRectSize, msg.rect)
                    break
            }
            this.worker.sendResponse({type: MapRendererWorkerRequestType.RESPONSE_MAP_RENDERER, requestId: msg.requestId})
        }
    }

    private redrawEntitiesContext(msg: MapRendererEntitiesRenderMessage, context: SpriteContext | null, rectColor: string, rectSize: number) {
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

    private redrawCamera(offset: { x: number, y: number }, surfaceRectSize: number, rect: MapRendererCameraRect) {
        if (!this.cameraContext || !rect) return
        this.cameraContext.clearRect(0, 0, this.cameraContext.canvas.width, this.cameraContext.canvas.height)
        // draw camera frustum
        this.cameraContext.beginPath()
        const [topLeft, topRight, bottomRight, bottomLeft] = [rect.topLeft, rect.topRight, rect.bottomRight, rect.bottomLeft]
            .map((s) => (new Vector2(s.x, s.z).multiplyScalar(surfaceRectSize / TILESIZE).sub(offset)))
        this.cameraContext.moveTo(topLeft.x, topLeft.y)
        this.cameraContext.lineTo(topRight.x, topRight.y)
        this.cameraContext.lineTo(bottomRight.x, bottomRight.y)
        this.cameraContext.lineTo(bottomLeft.x, bottomLeft.y)
        this.cameraContext.closePath()
        this.cameraContext.strokeStyle = '#ccc'
        this.cameraContext.lineWidth = 0.5
        this.cameraContext.stroke()
        // draw arrow inside of frustum
        this.cameraContext.beginPath()
        const topMid = topRight.clone().sub(topLeft).multiplyScalar(0.5).add(topLeft)
        const bottomMid = bottomRight.clone().sub(bottomLeft).multiplyScalar(0.5).add(bottomLeft)
        const topDown = bottomMid.clone().sub(topMid)
        const arrowTip = topDown.clone().multiplyScalar(0.15).add(topMid)
        this.cameraContext.moveTo(arrowTip.x, arrowTip.y)
        const midLeft = bottomLeft.clone().sub(topLeft).multiplyScalar(0.5).add(topLeft)
        const midRight = bottomRight.clone().sub(topRight).multiplyScalar(0.5).add(topRight)
        const mid = midRight.clone().sub(midLeft)
        const tipRight = mid.clone().multiplyScalar(0.65).add(midLeft)
        const shaftRight = mid.clone().multiplyScalar(0.55).add(midLeft)
        const shaftBottomRight = topDown.clone().multiplyScalar(0.425).add(shaftRight)
        const tipLeft = mid.clone().multiplyScalar(0.35).add(midLeft)
        const shaftLeft = mid.clone().multiplyScalar(0.45).add(midLeft)
        const shaftBottomLeft = topDown.clone().multiplyScalar(0.425).add(shaftLeft)
        this.cameraContext.lineTo(tipRight.x, tipRight.y)
        this.cameraContext.lineTo(shaftRight.x, shaftRight.y)
        this.cameraContext.lineTo(shaftBottomRight.x, shaftBottomRight.y)
        this.cameraContext.lineTo(shaftBottomLeft.x, shaftBottomLeft.y)
        this.cameraContext.lineTo(shaftLeft.x, shaftLeft.y)
        this.cameraContext.lineTo(tipLeft.x, tipLeft.y)
        this.cameraContext.closePath()
        this.cameraContext.strokeStyle = '#ccc'
        this.cameraContext.lineWidth = 0.5
        this.cameraContext.stroke()
    }
}

const worker: Worker = self as any
new MapRendererWorker(new TypedWorkerThreaded(worker))
