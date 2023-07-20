import { AbstractGameSystem, GameEntity } from '../ECS'
import { ScannerComponent } from '../component/ScannerComponent'
import { EventBus } from '../../event/EventBus'
import { UpdateRadarTerrain } from '../../event/LocalEvents'
import { WorldManager } from '../WorldManager'

export class TerrainScannerSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([ScannerComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        let scanned = false
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const scannerComponent = components.get(ScannerComponent)
                if (scannerComponent.scanDelay > 0) {
                    scannerComponent.scanDelay -= elapsedMs
                } else {
                    // TODO visualize scan on map
                    scannerComponent.scanDelay = 5000
                    const origin = scannerComponent.origin.surface
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
        if (scanned) EventBus.publishEvent(new UpdateRadarTerrain(this.worldMgr.sceneMgr.terrain))
    }
}
