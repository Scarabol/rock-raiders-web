import { SelectionType } from '../../game/model/Selectable'
import { EventBus } from '../../event/EventBus'
import { RAIDER_SPEED } from '../../main'
import { RaiderSelected } from '../../event/LocalEvents'
import { FulfillerActivity, FulfillerEntity } from './FulfillerEntity'
import { GameState } from '../../game/model/GameState'
import { Vector3 } from 'three'
import { EntityAddedEvent, EntityType } from '../../event/WorldEvents'
import { RaiderDiscoveredEvent } from '../../event/WorldLocationEvent'

export class Raider extends FulfillerEntity {

    constructor() {
        super(SelectionType.PILOT, 'mini-figures/pilot/pilot.ae', RAIDER_SPEED)
        this.tools = ['drill', 'shovel', 'hammer']
        this.skills = ['demolition']
        this.pickSphereRadius = 10 // TODO read pick sphere size from cfg
        this.selectionFrameSize = 10
    }

    getSpeed(): number {
        let speed = super.getSpeed()
        if (this.animation && !isNaN(this.animation.transcoef)) speed *= this.animation.transcoef
        if (this.isOnPath()) speed *= 2 // TODO read from cfg
        return speed
    }

    isOnRubble() {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).hasRubble()
    }

    isOnPath(): boolean {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).isPath()
    }

    findPathToTarget(target: Vector3): Vector3[] {
        return this.worldMgr.sceneManager.terrain.findPath(this.getPosition(), target)
    }

    changeActivity(activity: FulfillerActivity, onChangeDone = null, iterations = 1) {
        if (onChangeDone) onChangeDone.bind(this)
        if (this.activity !== activity) {
            this.activity = activity
            switch (this.activity) {
                case FulfillerActivity.STANDING:
                    if (this.carries) {
                        this.setActivity('StandCarry', onChangeDone, iterations)
                    } else {
                        this.setActivity('Stand', onChangeDone, iterations)
                    }
                    break
                case FulfillerActivity.MOVING:
                    if (this.carries) {
                        this.setActivity('Carry', onChangeDone, iterations)
                    } else {
                        this.setActivity('Run', onChangeDone, iterations)
                    }
                    break
                case FulfillerActivity.MOVING_RUBBLE:
                    if (this.carries) {
                        this.setActivity('Carryrubble', onChangeDone, iterations)
                    } else {
                        this.setActivity('Routerubble', onChangeDone, iterations)
                    }
                    break
                case FulfillerActivity.DRILLING:
                    this.setActivity('Drill', onChangeDone, iterations)
                    break
                case FulfillerActivity.SHOVELING:
                    this.setActivity('ClearRubble', onChangeDone, iterations)
                    break
                case FulfillerActivity.PICKING:
                    this.setActivity('Pickup', onChangeDone, iterations)
                    break
                case FulfillerActivity.DROPPING:
                    this.setActivity('Place', onChangeDone, iterations)
                    break
                case FulfillerActivity.REINFORCE:
                    this.setActivity('Reinforce', onChangeDone, iterations)
                    break
            }
            this.animation.looping = true // TODO make all looping?
        }
    }

    onDiscover() {
        super.onDiscover()
        const index = GameState.raidersUndiscovered.indexOf(this)
        if (index !== -1) GameState.raidersUndiscovered.splice(index, 1)
        GameState.raiders.push(this)
        EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, this))
        EventBus.publishEvent(new RaiderDiscoveredEvent(this.getPosition()))
    }

    onSelect() {
        this.changeActivity(FulfillerActivity.STANDING)
        EventBus.publishEvent(new RaiderSelected(this))
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null
    }

}
