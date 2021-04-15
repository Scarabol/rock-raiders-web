import { Surface } from '../../../scene/model/map/Surface'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { Vector3 } from 'three'
import { JOB_ACTION_RANGE, TILESIZE } from '../../../main'
import { Dynamite } from '../../../scene/model/collect/Dynamite'
import { JobType, PublicJob } from './Job'
import { SurfaceType } from '../../../scene/model/map/SurfaceType'
import { CollectableEntity } from '../../../scene/model/collect/CollectableEntity'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { RaiderTool } from '../../../scene/model/RaiderTool'

export class SurfaceJobType {

    color: number
    requiredTool: RaiderTool
    requiredSkill: RaiderSkill

    constructor(color: number, requiredTool: RaiderTool, requiredSkill: RaiderSkill) {
        this.color = color
        this.requiredTool = requiredTool
        this.requiredSkill = requiredSkill
    }

    static readonly DRILL = new SurfaceJobType(0xa0a0a0, RaiderTool.DRILL, null)
    static readonly REINFORCE = new SurfaceJobType(0x60a060, RaiderTool.HAMMER, null)
    static readonly BLOW = new SurfaceJobType(0xa06060, null, RaiderSkill.DEMOLITION)
    static readonly CLEAR_RUBBLE = new SurfaceJobType(0xffffff, RaiderTool.SHOVEL, null)

}

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

    getPosition(): Vector3 {
        if (this.workType === SurfaceJobType.CLEAR_RUBBLE) {
            return this.surface.getCenterWorld()
        } else {
            const digPos = this.surface.getDigPositions()[0]
            digPos.y = this.surface.terrain.worldMgr.getTerrainHeight(digPos.x, digPos.z)
            return digPos
        }
    }

    isInArea(x: number, z: number): boolean {
        if (this.workType === SurfaceJobType.CLEAR_RUBBLE) {
            return x >= this.surface.x * TILESIZE + 5 && x < this.surface.x * TILESIZE + TILESIZE + 5
                && z >= this.surface.y * TILESIZE + 5 && z < this.surface.y * TILESIZE + TILESIZE + 5
        } else {
            return this.getPosition().distanceTo(new Vector3(x, this.getPosition().y, z)) < JOB_ACTION_RANGE
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

    getPriorityIdentifier(): string {
        if (this.workType === SurfaceJobType.DRILL) return 'aiPriorityDestruction'
        else if (this.workType === SurfaceJobType.BLOW) return 'aiPriorityDestruction'
        else if (this.workType === SurfaceJobType.CLEAR_RUBBLE) return 'aiPriorityClearing'
        else if (this.workType === SurfaceJobType.REINFORCE) return 'aiPriorityReinforce'
        console.warn('Unexpected work type: ' + this.workType)
        return ''
    }

}

export class DynamiteJob extends SurfaceJob {

    dynamite: Dynamite

    constructor(surface: Surface, dynamite: Dynamite) {
        super(SurfaceJobType.BLOW, surface)
        this.dynamite = dynamite
    }

    getPosition(): Vector3 {
        return this.dynamite.getPosition()
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

    getPriorityIdentifier(): string {
        return 'aiPriorityConstruction'
    }

}
