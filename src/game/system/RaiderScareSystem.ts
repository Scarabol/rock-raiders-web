import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { RaiderScareComponent } from '../component/RaiderScareComponent'
import { PositionComponent } from '../component/PositionComponent'
import { WorldManager } from '../WorldManager'
import { RunPanicJob } from '../model/job/raider/RunPanicJob'
import { EventBroker } from '../../event/EventBroker'
import { SelectionChanged } from '../../event/LocalEvents'

export class RaiderScareSystem extends AbstractGameSystem {
    readonly scarableRaiders: FilteredEntities = this.addEntityFilter(PositionComponent, RaiderScareComponent)

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(ecs: ECS, _elapsedMs: number): void {
        for (const [_entity, components] of this.scarableRaiders) {
            try {
                const positionComponent = components.get(PositionComponent)
                const scareComponent = components.get(RaiderScareComponent)
                let selectionChanged: boolean = false
                this.worldMgr.entityMgr.raiders.forEach((r) => {
                    if (!r.canBeScared()) return
                    const raiderPos = ecs.getComponents(r.entity).get(PositionComponent)
                    const distanceSq = raiderPos.getPosition2D().distanceToSquared(positionComponent.getPosition2D())
                    if (distanceSq >= scareComponent.scareRadiusSq) return
                    r.scared = true
                    if (r.selected) {
                        r.deselect()
                        this.worldMgr.entityMgr.selection.raiders.remove(r)
                        selectionChanged = true
                    }
                    r.dropCarried(true)
                    const scareNeighbors = positionComponent.surface.neighbors
                    const safeNeighbors = raiderPos.surface.neighbors.filter((s) => s !== positionComponent.surface && !scareNeighbors.includes(s))
                    const runTarget = ([...safeNeighbors, ...scareNeighbors].find((s) => s.isWalkable()) ?? raiderPos.surface).getRandomPosition()
                    r.setJob(new RunPanicJob(runTarget))
                })
                if (selectionChanged) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
            } catch (e) {
                console.error(e)
            }
        }
    }
}
