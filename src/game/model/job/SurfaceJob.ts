import { Surface } from '../../../scene/model/map/Surface'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { Vector3 } from 'three'
import { JOB_ACTION_RANGE, TILESIZE } from '../../../main'
import { Dynamite } from '../../../scene/model/collect/Dynamite'
import { Job, JobType } from './Job'
import { SurfaceType } from '../../../scene/model/map/SurfaceType'
import { CollectableEntity } from '../../../scene/model/collect/CollectableEntity'

export class SurfaceJobType {

    color: number
    requiredTools: string[]
    requiredSkills: string[]

    constructor(color: number, requiredTools: string[], requiredSkills: string[]) {
        this.color = color
        this.requiredTools = requiredTools
        this.requiredSkills = requiredSkills
    }

    static readonly DRILL = new SurfaceJobType(0xa0a0a0, ['drill'], [])
    static readonly REINFORCE = new SurfaceJobType(0x60a060, ['hammer'], [])
    static readonly BLOW = new SurfaceJobType(0xa06060, [], ['demolition'])
    static readonly CLEAR_RUBBLE = new SurfaceJobType(0xffffff, ['shovel'], [])

}

export class SurfaceJob extends Job {

    surface: Surface
    workType: SurfaceJobType

    constructor(workType: SurfaceJobType, surface: Surface) {
        super(JobType.SURFACE)
        this.surface = surface
        this.workType = workType
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.hasTools(this.workType.requiredTools) && fulfiller.hasSkills(this.workType.requiredSkills)
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
            const pos = this.getPosition()
            return pos.sub(new Vector3(x, pos.y, z)).length() < JOB_ACTION_RANGE
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

}
