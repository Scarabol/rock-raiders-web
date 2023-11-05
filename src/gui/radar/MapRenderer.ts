import { TypedWorker, TypedWorkerFallback, TypedWorkerFrontend } from '../../worker/TypedWorker'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { MapSurfaceRect } from './MapSurfaceRect'
import { MapRendererMessage, MapRendererResponse, MapRendererWorker } from '../../worker/MapRendererWorker'
import { WorkerMessageType } from '../../worker/WorkerMessageType'
import { generateUUID } from 'three/src/math/MathUtils'
import { MapMarkerType } from '../../game/component/MapMarkerComponent'

export class MapRenderer {
    readonly resolveCallbackById: Map<string, (() => void)> = new Map()
    readonly worker: TypedWorker<MapRendererMessage, MapRendererResponse>

    constructor(terrainSprite: HTMLCanvasElement, entitySprite: HTMLCanvasElement, monsterSprite: HTMLCanvasElement, materialSprite: HTMLCanvasElement, geoScanSprite: HTMLCanvasElement) {
        const msgInit: MapRendererMessage = {
            type: WorkerMessageType.MAP_RENDERER_INIT,
            terrainSprite: terrainSprite,
            entitySprite: entitySprite,
            monsterSprite: monsterSprite,
            materialSprite: materialSprite,
            geoScanSprite: geoScanSprite,
        }
        try {
            msgInit.terrainSprite = terrainSprite.transferControlToOffscreen()
            msgInit.monsterSprite = monsterSprite.transferControlToOffscreen()
            msgInit.materialSprite = materialSprite.transferControlToOffscreen()
            msgInit.entitySprite = entitySprite.transferControlToOffscreen()
            msgInit.geoScanSprite = geoScanSprite.transferControlToOffscreen()
            const worker = new Worker(new URL('../../worker/MapRendererWorker', import.meta.url), {type: 'module'})
            this.worker = new TypedWorkerFrontend(worker, (r: MapRendererResponse) => this.onResponseFromWorker(r))
            this.worker.sendMessage(msgInit, [msgInit.terrainSprite, msgInit.monsterSprite, msgInit.materialSprite, msgInit.entitySprite, msgInit.geoScanSprite])
        } catch (e) {
            console.warn('Could not setup threaded worker!\nUsing fallback to main thread, which might has bad performance.', e)
            const worker = new TypedWorkerFallback((r: MapRendererResponse) => this.onResponseFromWorker(r))
            new MapRendererWorker(worker)
            this.worker = worker
            this.worker.sendMessage(msgInit)
        }
    }

    onResponseFromWorker(response: MapRendererResponse) {
        if (this.isMapRendererResponse(response)) {
            this.resolveCallbackById.get(response.requestId)?.()
            this.resolveCallbackById.delete(response.requestId)
        }
    }

    private isMapRendererResponse(response: WorkerResponse): response is MapRendererResponse {
        return response.type === WorkerMessageType.RESPONSE_MAP_RENDERER
    }

    redrawTerrain(offset: { x: number, y: number }, surfaceRectSize: number, surfaceMap: MapSurfaceRect[][]): Promise<void> {
        return new Promise((resolve) => {
            const requestId = generateUUID()
            this.resolveCallbackById.set(requestId, resolve)
            this.worker.sendMessage({type: WorkerMessageType.MAP_RENDER_TERRAIN, requestId: requestId, offset: offset, surfaceRectSize: surfaceRectSize, terrain: surfaceMap})
        })
    }

    redrawSurface(offset: { x: number, y: number }, surfaceRectSize: number, surface: MapSurfaceRect): Promise<void> {
        return new Promise((resolve) => {
            const requestId = generateUUID()
            this.resolveCallbackById.set(requestId, resolve)
            this.worker.sendMessage({type: WorkerMessageType.MAP_RENDER_SURFACE, requestId: requestId, offset: offset, surfaceRectSize: surfaceRectSize, surface: surface})
        })
    }

    redrawEntities(offset: { x: number, y: number }, mapMarkerType: MapMarkerType, surfaceRectSize: number, entities: { x: number, z: number, r: number }[]): Promise<void> {
        return new Promise((resolve) => {
            const requestId = generateUUID()
            this.resolveCallbackById.set(requestId, resolve)
            this.worker.sendMessage({type: WorkerMessageType.MAP_RENDER_ENTITIES, mapMarkerType: mapMarkerType, requestId: requestId, offset: offset, surfaceRectSize: surfaceRectSize, entities: entities})
        })
    }
}
