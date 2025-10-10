import { AbstractGameSystem, GameEntity } from '../ECS'
import { ScannerComponent } from '../component/ScannerComponent'
import { PositionComponent } from '../component/PositionComponent'
import { UpdateRadarEntityEvent, UpdateRadarTerrain } from '../../event/LocalEvents'
import { WorldManager } from '../WorldManager'
import { MAP_MARKER_CHANGE, MAP_MARKER_TYPE } from '../component/MapMarkerComponent'
import { EventBroker } from '../../event/EventBroker'

export class TerrainScannerSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([ScannerComponent, PositionComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        let scanned = false
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const scannerComponent = components.get(ScannerComponent)
                const positionComponent = components.get(PositionComponent)
                if (scannerComponent.scanDelay > 0) {
                    scannerComponent.scanDelay -= elapsedMs
                    const radius = (1 - (scannerComponent.scanDelay % 1000) / 1000) * (scannerComponent.range - 0.5)
                    EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.scanner, entity, MAP_MARKER_CHANGE.update, positionComponent.position, radius))
                } else {
                    scannerComponent.scanDelay = 5000
                    const origin = positionComponent.surface
                    for (let dx = -scannerComponent.range - 1; dx <= scannerComponent.range; dx++) {
                        for (let dy = -scannerComponent.range - 1; dy <= scannerComponent.range; dy++) {
                            if (dx === 0 && dy === 0) continue
                            const neighbor = this.worldMgr.sceneMgr.terrain.getSurface(origin.x + dx, origin.y + dy)
                            if (!neighbor.scanned && origin.getCenterWorld2D().distanceToSquared(neighbor.getCenterWorld2D()) < scannerComponent.rangeSQ) {
                                neighbor.scanned = true
                                scanned = true
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
        if (scanned) EventBroker.publish(new UpdateRadarTerrain(this.worldMgr.sceneMgr.terrain))
    }
}
