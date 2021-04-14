import { EventBus } from '../../event/EventBus'
import { BuildingSelected, EntityDeselected, SelectionEvent } from '../../event/LocalEvents'
import { Building } from '../../game/model/entity/building/Building'
import { AnimEntity } from './anim/AnimEntity'
import { Selectable, SelectionType } from '../../game/model/Selectable'
import { ResourceManager } from '../../resource/ResourceManager'
import { MathUtils, Vector3, Matrix4 } from 'three'
import { GameState } from '../../game/model/GameState'
import { BuildingUpgraded, CollectEvent, EntityAddedEvent, EntityType } from '../../event/WorldEvents'
import { Surface } from './map/Surface'
import { CollectableType } from './collect/CollectableEntity'
import degToRad = MathUtils.degToRad

export class BuildingEntity extends AnimEntity implements Selectable {

    type: Building
    selected: boolean
    powerSwitch: boolean = true
    powerLink: boolean = false
    spawning: boolean = false
    surfaces: Surface[] = []

    constructor(buildingType: Building) {
        super(ResourceManager.getAnimationEntityType(buildingType.aeFile))
        this.type = buildingType
        this.group.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
        this.group.userData = {'selectable': this}
        this.pickSphereRadius = this.type.stats.pickSphere / 2
    }

    getSelectionType(): SelectionType {
        return SelectionType.BUILDING
    }

    select(): SelectionEvent {
        this.selectionFrame.visible = true
        if (!this.selected) {
            this.selected = true
            return new BuildingSelected(this)
        }
        return null
    }

    deselect() {
        this.selectionFrame.visible = false
        this.selected = false
    }

    getSelectionCenter(): Vector3 {
        return this.pickSphere ? new Vector3().copy(this.pickSphere.position).applyMatrix4(this.group.matrixWorld) : null
    }

    getPickSphereCenter() {
        const pickSphereCenter = this.getPosition()
        pickSphereCenter.y += this.pickSphereRadius / 2
        return pickSphereCenter
    }

    getDropPosition(): Vector3 {
        const dropPos = this.getPosition().add(new Vector3(0, 0, this.type.dropPosDist)
            .applyEuler(this.getRotation()).applyAxisAngle(new Vector3(0, 1, 0), degToRad(this.type.dropPosAngleDeg)))
        dropPos.y = this.worldMgr.getTerrainHeight(dropPos.x, dropPos.z)
        return dropPos
    }

    isPowered(): boolean {
        return this.powerSwitch && (this.type.stats.selfPowered || this.powerLink)
    }

    onDiscover() {
        super.onDiscover()
        const index = GameState.buildingsUndiscovered.indexOf(this)
        if (index !== -1) GameState.buildingsUndiscovered.splice(index, 1)
        GameState.buildings.push(this)
        EventBus.publishEvent(new EntityAddedEvent(EntityType.BUILDING, this))
    }

    hasMaxLevel(): boolean {
        return this.level >= this.type.stats.levels - 1
    }

    upgrade() {
        if (GameState.numOre < 5 || this.hasMaxLevel()) return
        GameState.numOre -= 5 // TODO read from cfg BuildingUpgradeCostOre and BuildingUpgradeCostStuds
        this.level++
        EventBus.publishEvent(new CollectEvent(CollectableType.ORE))
        EventBus.publishEvent(new EntityDeselected())
        EventBus.publishEvent(new BuildingUpgraded(this))
    }

}
