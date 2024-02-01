import { Surface } from './Surface'
import { EventKey } from '../../event/EventKeyEnum'
import { GameState } from '../model/GameState'
import { EntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { EventBroker } from '../../event/EventBroker'

export class PowerGrid {
    energySources: Set<Surface> = new Set()
    energizedSurfaces: Set<Surface> = new Set()

    constructor(worldMgr: WorldManager) {
        EventBroker.subscribe(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            const energyConsumer = worldMgr.entityMgr.buildings.filter((b) => b.energized && b.crystalDrain > 0).reverse()
            for (let c = 0; c < energyConsumer.length && GameState.usedCrystals > GameState.numCrystal; c++) {
                energyConsumer[c].setEnergized(false)
            }
            if (GameState.numCrystal <= 0) worldMgr.entityMgr.buildings.forEach((b) => {
                if (b.entityType === EntityType.POWER_STATION) b.setEnergized(false)
            })
        })
    }

    addEnergySource(energySources: Surface[]) {
        energySources.forEach((s) => {
            this.energySources.add(s)
            this.markEnergized(s)
        })
    }

    removeEnergySource(energySources: Surface[]) {
        energySources.forEach((s) => this.energySources.delete(s))
        this.rebuild()
    }

    onPathChange(surface: Surface) {
        if (surface.isPath()) {
            if (surface.neighbors.some((n) => n.energized)) {
                this.markEnergized(surface)
            }
        } else {
            this.rebuild()
        }
    }

    private rebuild() {
        const addedToGrid = new Set<Surface>()
        const removedFromGrid = new Set<Surface>(this.energizedSurfaces)
        this.energySources.forEach((s) => PowerGrid.partitionPathGrid(s, addedToGrid, removedFromGrid))
        addedToGrid.forEach((s) => this.markEnergized(s))
        removedFromGrid.forEach((s) => this.unmarkEnergized(s))
    }

    private static partitionPathGrid(surface: Surface, added: Set<Surface>, removed: Set<Surface>) {
        if (!surface.isPath() || added.has(surface)) return
        added.add(surface)
        removed.delete(surface)
        surface.neighbors.forEach((n) => this.partitionPathGrid(n, added, removed))
    }

    private markEnergized(surface: Surface) {
        if (surface.energized || !surface.isPath()) return
        surface.setEnergized(true)
        this.energizedSurfaces.add(surface)
        surface.neighbors.forEach((n) => this.markEnergized(n))
    }

    private unmarkEnergized(surface: Surface) {
        if (!surface.energized) return
        surface.setEnergized(false)
        this.energizedSurfaces.delete(surface)
    }
}
