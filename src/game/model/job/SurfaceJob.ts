import { Surface } from '../../../scene/model/map/Surface'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { Vector2 } from 'three'
import { Dynamite } from '../../../scene/model/collect/Dynamite'
import { PublicJob } from './Job'
import { SurfaceType } from '../../../scene/model/map/SurfaceType'
import { CollectableEntity } from '../../../scene/model/collect/CollectableEntity'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { RaiderTool } from '../../../scene/model/RaiderTool'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'
import { SurfaceJobType } from './SurfaceJobType'

export class SurfaceJob extends PublicJob {

    surface: Surface
    workType: SurfaceJobType

    constructor(workType: SurfaceJobType, surface: Surface) {
        super(JobType.SURFACE)
        this.surface = surface
        this.workType = workType
    }

    isQualified(fulfiller: FulfillerEntity) {
        return (!this.workType.requiredTool || fulfiller.hasTool(this.workType.requiredTool))
            && (!this.workType.requiredSkill || fulfiller.hasSkill(this.workType.requiredSkill))
    }

    isQualifiedWithTool(fulfiller: FulfillerEntity): RaiderTool {
        return this.workType.requiredTool
    }

    isQualifiedWithTraining(fulfiller: FulfillerEntity): RaiderSkill {
        return this.workType.requiredSkill
    }

    getWorkplaces(): Vector2[] {
        if (this.workType === SurfaceJobType.CLEAR_RUBBLE) {
            const rubblePositions = this.surface.rubblePositions
            return rubblePositions.length > 0 ? [rubblePositions[0]] : [] // use first (no need to optimize)
        } else {
            return this.surface.getDigPositions()
        }
    }

    onJobComplete() {
        super.onJobComplete()
        switch (this.workType) {
            case SurfaceJobType.DRILL:
                this.surface.collapse()
                break
            case SurfaceJobType.REINFORCE:
                this.surface.reinforce()
                break
            case SurfaceJobType.CLEAR_RUBBLE:
                this.surface.reduceRubble()
                break
        }
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.workType.priorityIdentifier
    }

}

export class DynamiteJob extends SurfaceJob {

    dynamite: Dynamite

    constructor(surface: Surface, dynamite: Dynamite) {
        super(SurfaceJobType.BLOW, surface)
        this.dynamite = dynamite
    }

    getWorkplaces(): Vector2[] {
        return [this.dynamite.getPosition2D()]
    }

    onJobComplete() {
        super.onJobComplete()
        this.dynamite.ignite()
    }

}

export class CompletePowerPathJob extends SurfaceJob {

    placedItems: CollectableEntity[]

    constructor(surface: Surface, placedItems: CollectableEntity[]) {
        super(SurfaceJobType.CLEAR_RUBBLE, surface)
        this.placedItems = placedItems
    }

    onJobComplete() {
        super.onJobComplete()
        this.placedItems.forEach((placed) => placed.worldMgr.sceneManager.scene.remove(placed.group))
        this.surface.surfaceType = SurfaceType.POWER_PATH
        this.surface.updateTexture()
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

}
