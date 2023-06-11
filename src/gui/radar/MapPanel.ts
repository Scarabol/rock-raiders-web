import { createCanvas } from '../../core/ImageHelper'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { EventKey } from '../../event/EventKeyEnum'
import { UpdateRadarEntities, UpdateRadarEntityEvent, UpdateRadarSurface, UpdateRadarTerrain } from '../../event/LocalEvents'
import { MapMarkerChange, MapMarkerType } from '../../game/component/MapMarkerComponent'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { MapSurfaceRect } from './MapSurfaceRect'
import { MapRenderer } from './MapRenderer'
import { MAP_PANEL_SURFACE_RECT_SIZE } from '../../params'
import { GameEntity } from '../../game/ECS'

export class MapPanel extends Panel {
    readonly mapRenderer: MapRenderer
    readonly surfaceSprite: SpriteImage
    readonly entitySprite: SpriteImage
    readonly monsterSprite: SpriteImage
    readonly materialSprite: SpriteImage
    readonly offset: { x: number, y: number } = {x: 0, y: 0}
    readonly surfaceMap: MapSurfaceRect[][] = []
    entitiesByOrder: Map<MapMarkerType, Map<GameEntity, { x: number, z: number }>> = new Map()

    constructor(parent: BaseElement) {
        super(parent, null)
        this.width = 152
        this.height = 149
        this.surfaceSprite = createCanvas(this.width, this.height)
        this.entitySprite = createCanvas(this.width, this.height)
        this.monsterSprite = createCanvas(this.width, this.height)
        this.materialSprite = createCanvas(this.width, this.height)
        this.mapRenderer = new MapRenderer(this.surfaceSprite, this.entitySprite, this.monsterSprite, this.materialSprite)
        this.relX = this.xIn = this.xOut = 15
        this.relY = this.yIn = this.yOut = 15
        this.onClick = (cx: number, cy: number) => {
            // TODO limit offsets
            this.offset.x += cx - this.x - this.width / 2
            this.offset.y += cy - this.y - this.height / 2
            this.redrawAll()
        }
        this.registerEventListener(EventKey.UPDATE_RADAR_TERRAIN, (event: UpdateRadarTerrain) => {
            this.surfaceMap.length = 0
            event.surfaces.forEach((s) => {
                this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
                this.surfaceMap[s.x][s.y] = s
            })
            if (event.focusTile) {
                this.offset.x = event.focusTile.x * MAP_PANEL_SURFACE_RECT_SIZE - this.width / 2
                this.offset.y = event.focusTile.y * MAP_PANEL_SURFACE_RECT_SIZE - this.height / 2
                this.redrawAll()
            } else {
                this.mapRenderer.redrawTerrain(this.offset, this.surfaceMap).then(() => this.notifyRedraw())
            }
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_SURFACE, (event: UpdateRadarSurface) => {
            const s = event.surfaceRect
            this.surfaceMap[s.x] = this.surfaceMap[s.x] || []
            this.surfaceMap[s.x][s.y] = s
            this.mapRenderer.redrawSurface(this.offset, event.surfaceRect).then(() => this.notifyRedraw())
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_LEGACY_ENTITIES, (event: UpdateRadarEntities) => {
            this.entitiesByOrder = event.entitiesByOrder
            Promise.all([
                this.mapRenderer.redrawEntities(this.offset, MapMarkerType.DEFAULT, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.DEFAULT, () => new Map()).values())),
                this.mapRenderer.redrawEntities(this.offset, MapMarkerType.MATERIAL, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.MATERIAL, () => new Map()).values())),
            ]).then(() => this.notifyRedraw())
        })
        this.registerEventListener(EventKey.UPDATE_RADAR_ENTITY, (event: UpdateRadarEntityEvent) => {
            const entities = this.entitiesByOrder.getOrUpdate(event.mapMarkerType, () => new Map())
            switch (event.change) {
                case MapMarkerChange.UPDATE:
                    entities.set(event.entity, event.position)
                    break
                case MapMarkerChange.REMOVE:
                    entities.delete(event.entity)
                    break
            }
            // TODO check if entity is actually visible
            this.mapRenderer.redrawEntities(this.offset, event.mapMarkerType, Array.from(entities.values())).then(() => this.notifyRedraw())
        })
    }

    private redrawAll() {
        Promise.all([
            this.mapRenderer.redrawTerrain(this.offset, this.surfaceMap),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.DEFAULT, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.DEFAULT, () => new Map()).values())),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.MONSTER, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.MONSTER, () => new Map()).values())),
            this.mapRenderer.redrawEntities(this.offset, MapMarkerType.MATERIAL, Array.from(this.entitiesByOrder.getOrUpdate(MapMarkerType.MATERIAL, () => new Map()).values())),
        ]).then(() => this.notifyRedraw())
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        super.onRedraw(context)
        context.drawImage(this.surfaceSprite, this.x, this.y)
        context.drawImage(this.entitySprite, this.x, this.y)
        context.drawImage(this.monsterSprite, this.x, this.y)
        context.drawImage(this.materialSprite, this.x, this.y)
    }
}
