import { BaseEntity } from '../BaseEntity';
import { GameState } from '../../../game/model/GameState';
import { EventBus } from '../../../event/EventBus';
import { JobCreateEvent } from '../../../event/WorldEvents';
import { CollectJob } from '../../../game/model/job/Job';
import { Carryable } from './Carryable';
import { Vector3 } from 'three';
import { Building } from '../../../game/model/entity/building/Building';
import { BuildingEntity } from '../BuildingEntity';
import { BuildingSite } from '../BuildingSite';

export abstract class CollectableEntity extends BaseEntity implements Carryable {

    collectableType: CollectableType;
    targetSite: BuildingSite;
    targetBuilding: BuildingEntity;
    targetPos: Vector3 = null;
    targetType: CollectTargetType | Building;

    protected constructor(collectableType: CollectableType) {
        super();
        this.collectableType = collectableType;
    }

    abstract getTargetBuildingTypes(): Building[];

    getTargetPos(): Vector3 {
        if (!this.targetPos) {
            const site = GameState.getClosestSiteThatRequires(this.getPosition(), this.getCollectableType());
            if (site) {
                this.targetSite = site;
                this.targetPos = site.getPosition();
                this.targetType = CollectTargetType.BUILDING_SITE;
                site.assign(this);
            } else {
                const targetBuilding = GameState.getClosestBuildingByType(this.getPosition(), ...this.getTargetBuildingTypes());
                if (targetBuilding) {
                    this.targetBuilding = targetBuilding;
                    this.targetPos = targetBuilding.getDropPosition();
                    this.targetType = targetBuilding.type;
                }
            }
        } else if (this.targetSite) {
            if (this.targetSite.complete) this.resetTarget();
        } else if (this.targetBuilding) {
            // TODO check if building has been teleported away or turned off
        }
        return this.targetPos;
    }

    getTargetType(): CollectTargetType | Building {
        return this.targetType;
    }

    resetTarget() {
        if (this.targetSite) this.targetSite.unAssign(this);
        this.targetSite = null;
        this.targetBuilding = null;
        this.targetPos = null;
        this.targetType = null;
    }

    onDiscover() {
        super.onDiscover();
        const index = GameState.collectablesUndiscovered.indexOf(this);
        if (index !== -1) GameState.collectablesUndiscovered.splice(index, 1);
        GameState.collectables.push(this);
        EventBus.publishEvent(new JobCreateEvent(new CollectJob(this)));
    }

    getCollectableType(): CollectableType {
        return this.collectableType;
    }

}

export enum CollectableType {

    DYNAMITE,
    CRYSTAL,
    ORE,
    BRICK,
    BARRIER,

}

export enum CollectTargetType {

    SURFACE,
    BUILDING_SITE,

}
