import { PositionalAudio, Vector3 } from 'three'
import { Sample } from '../../../audio/Sample'
import { getRandomInclusive } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { RaidersChangedEvent } from '../../../event/LocalEvents'
import { RaiderDiscoveredEvent } from '../../../event/WorldLocationEvent'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { BaseActivity } from '../activities/BaseActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntitySuperType, EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { GameState } from '../GameState'
import { JobState } from '../job/JobState'
import { TerrainPath } from '../map/TerrainPath'
import { MoveState } from '../MoveState'
import { PathTarget } from '../PathTarget'
import { SelectionType } from '../Selectable'
import { RaiderTool } from './RaiderTool'
import { RaiderTraining } from './RaiderTraining'

export class Raider extends FulfillerEntity {

    tools: Map<RaiderTool, boolean> = new Map()
    trainings: Map<RaiderTraining, boolean> = new Map()
    slipped: boolean = false
    workAudio: PositionalAudio

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntitySuperType.RAIDER, EntityType.PILOT, 'mini-figures/pilot/pilot.ae', SelectionType.RAIDER)
        this.tools.set(RaiderTool.DRILL, true)
    }

    get stats() {
        return ResourceManager.stats.Pilot
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return this.sceneMgr.terrain.findPath(this.getPosition2D(), target)
    }

    onDiscover() {
        super.onDiscover()
        GameState.raidersUndiscovered.remove(this)
        GameState.raiders.push(this)
        EventBus.publishEvent(new RaidersChangedEvent())
        EventBus.publishEvent(new RaiderDiscoveredEvent(this.getPosition()))
    }

    select(): boolean {
        this.selectionFrame.visible = !this.slipped
        if (this.selected || this.slipped) return false
        this.selected = true
        this.changeActivity()
        return true
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null
    }

    isDriving(): boolean {
        return false // TODO implement vehicles
    }

    getSpeed(): number {
        return super.getSpeed() * this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1)
    }

    isOnPath(): boolean {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position).isPath()
    }

    isOnRubble() {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position).hasRubble()
    }

    getRouteActivity(): BaseActivity {
        if (this.isOnRubble()) {
            return !!this.carries ? RaiderActivity.CarryRubble : RaiderActivity.routeRubble
        } else {
            return !!this.carries ? RaiderActivity.Carry : RaiderActivity.Route
        }
    }

    moveToClosestTarget(target: PathTarget[]): MoveState {
        const result = super.moveToClosestTarget(target)
        this.job.setActualWorkplace(this.currentPath?.target)
        if (result === MoveState.MOVED) {
            GameState.getNearbySpiders(this).some((spider) => {
                if (this.group.position.distanceToSquared(spider.group.position) < this.radiusSq + spider.radiusSq) {
                    this.slip()
                    spider.onDeath()
                    return true
                }
            })
        } else if (result === MoveState.TARGET_UNREACHABLE) {
            console.log('Entity could not move to job target, stopping job')
            this.stopJob()
        }
        return result
    }

    slip() {
        if (getRandomInclusive(0, 100) < 10) this.stopJob()
        this.dropItem()
        this.slipped = true
        this.playPositionalSample(Sample.SND_Slipup) // FIXME also second parameter in LWS files for AddNullObject SFX,
        this.changeActivity(RaiderActivity.Slip, () => {
            this.slipped = false
        })
    }

    work() {
        if (!this.job || this.selected || this.slipped) return
        if (this.job.jobState !== JobState.INCOMPLETE) {
            this.stopJob()
        } else {
            const carryItem = this.job.getCarryItem()
            if (carryItem && this.carries !== carryItem) {
                this.dropItem()
                if (this.moveToClosestTarget(carryItem.getPositionPathTarget())) {
                    this.changeActivity(RaiderActivity.Collect, () => {
                        this.pickupItem(carryItem)
                    })
                }
            } else if (this.moveToClosestTarget(this.job.getWorkplaces()) === MoveState.TARGET_REACHED) {
                if (this.job.isReadyToComplete()) {
                    const workActivity = this.job.getWorkActivity() || this.getDefaultActivity()
                    if (!this.workAudio && workActivity === RaiderActivity.Drill) {
                        this.workAudio = this.playPositionalSample(Sample.SFX_Drill, true)
                    }
                    this.changeActivity(workActivity, () => {
                        this.workAudio?.stop()
                        this.workAudio = null
                        this.completeJob()
                    }, this.job.getWorkDuration(this))
                } else {
                    this.changeActivity()
                }
            }
        }
    }

    private completeJob() {
        this.job?.onJobComplete()
        if (this.job?.jobState === JobState.INCOMPLETE) return
        if (this.job) this.job.unassign(this)
        this.job = this.followUpJob
        this.followUpJob = null
        this.changeActivity()
    }

    getDefaultActivity(): BaseActivity {
        return this.carries ? RaiderActivity.CarryStand : super.getDefaultActivity()
    }

    beamUp() {
        this.stopJob()
        super.beamUp()
        EventBus.publishEvent(new RaidersChangedEvent())
    }

    removeFromScene() {
        super.removeFromScene()
        GameState.raiders.remove(this)
    }

    hasTool(tool: RaiderTool) {
        return !tool || this.tools.has(tool)
    }

    hasTraining(training: RaiderTraining) {
        return !training || this.trainings.has(training)
    }

    addTool(tool: RaiderTool) {
        this.tools.set(tool, true)
    }

    addTraining(training: RaiderTraining) {
        this.trainings.set(training, true)
    }

}
