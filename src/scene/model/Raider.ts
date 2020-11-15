import { SelectionType } from '../../game/model/Selectable';
import { EventBus } from '../../event/EventBus';
import { RAIDER_SPEED } from '../../main';
import { RaiderSelected } from '../../event/LocalEvents';
import { FulfillerActivity, FulfillerEntity } from './FulfillerEntity';
import { GameState } from '../../game/model/GameState';
import { Vector3 } from 'three';
import { EntityAddedEvent, EntityType } from '../../event/WorldEvents';

export class Raider extends FulfillerEntity {

    constructor() {
        super(SelectionType.PILOT, 'mini-figures/pilot/pilot.ae', RAIDER_SPEED);
        this.tools = ['drill', 'shovel'];
        this.pickSphereRadius = 10; // TODO read pick sphere size from cfg
        this.selectionFrameSize = 10;
    }

    isOnRubble() {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).hasRubble();
    }

    getSpeed(): number {
        let speed = super.getSpeed();
        if (this.animation && !isNaN(this.animation.transcoef)) speed *= this.animation.transcoef;
        if (this.isOnPath()) speed *= 2; // TODO read from cfg
        return speed;
    }

    isOnPath(): boolean {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).isPath();
    }

    changeActivity(activity: FulfillerActivity, onChangeDone = null) {
        if (onChangeDone) onChangeDone.bind(this);
        if (this.activity !== activity) {
            this.activity = activity;
            switch (this.activity) {
                case FulfillerActivity.STANDING:
                    if (this.carries) {
                        this.setActivity('StandCarry', onChangeDone);
                    } else {
                        this.setActivity('Stand', onChangeDone);
                    }
                    break;
                case FulfillerActivity.MOVING:
                    if (this.carries) {
                        this.setActivity('Carry', onChangeDone);
                    } else {
                        this.setActivity('Run', onChangeDone);
                    }
                    break;
                case FulfillerActivity.MOVING_RUBBLE:
                    if (this.carries) {
                        this.setActivity('Carryrubble', onChangeDone);
                    } else {
                        this.setActivity('Routerubble', onChangeDone);
                    }
                    break;
                case FulfillerActivity.DRILLING:
                    // TODO adapt drilling time to material hardness
                    this.setActivity('Drill', onChangeDone);
                    break;
                case FulfillerActivity.SHOVELING:
                    this.setActivity('ClearRubble', onChangeDone);
                    break;
                case FulfillerActivity.PICKING:
                    this.setActivity('Pickup', onChangeDone);
                    break;
            }
            this.animation.looping = true; // TODO make all looping?
        }
    }

    onDiscover() {
        super.onDiscover();
        const index = GameState.raidersUndiscovered.indexOf(this);
        if (index !== -1) GameState.raidersUndiscovered.splice(index, 1);
        GameState.raiders.push(this);
        EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, this));
    }

    onSelect() {
        this.changeActivity(FulfillerActivity.STANDING);
        EventBus.publishEvent(new RaiderSelected(this));
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null;
    }

    getSelectionEvent(): RaiderSelected {
        return new RaiderSelected(this);
    }

}
