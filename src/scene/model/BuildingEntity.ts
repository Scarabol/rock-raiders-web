import { EventBus } from '../../event/EventBus'
import { BuildingSelected, EntityDeselected, SelectionEvent } from '../../event/LocalEvents'
import { Building } from '../../game/model/entity/building/Building'
import { AnimEntity } from './anim/AnimEntity'
import { Selectable, SelectionType } from '../../game/model/Selectable'
import { ResourceManager } from '../../resource/ResourceManager'
import { MathUtils, Matrix4, Vector2, Vector3 } from 'three'
import { GameState } from '../../game/model/GameState'
import { BuildingUpgraded, EntityAddedEvent, EntityType, MaterialAmountChanged } from '../../event/WorldEvents'
import { Surface } from './map/Surface'
import { CollectableEntity, CollectableType } from './collect/CollectableEntity'
import { BuildingActivity } from './activities/BuildingActivity'
import { removeFromArray } from '../../core/Util'
import { BuildingEntityStats } from '../../cfg/BuildingEntityStats'
import { Ore } from './collect/Ore'
import { Crystal } from './collect/Crystal'
import { SurfaceType } from './map/SurfaceType'
import degToRad = MathUtils.degToRad

export class BuildingEntity extends AnimEntity implements Selectable {

    type: Building
    selected: boolean
    powerSwitch: boolean = true
    powerLink: boolean = false
    spawning: boolean = false
    surfaces: Surface[] = []
    upgradeCostOre: number = 5
    upgradeCostBrick: number = 1

    constructor(buildingType: Building) {
        super(ResourceManager.getAnimationEntityType(buildingType.aeFile))
        this.type = buildingType
        this.group.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
        this.group.userData = {'selectable': this}
        this.pickSphereRadius = this.stats.PickSphere / 2
        this.upgradeCostOre = ResourceManager.cfg('Main', 'BuildingUpgradeCostOre') || 5
        this.upgradeCostBrick = ResourceManager.cfg('Main', 'BuildingUpgradeCostStuds') || 5
    }

    get stats(): BuildingEntityStats {
        return BuildingEntityStats.getByType(this.type)
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

    getDropPosition2D(): Vector2 {
        return this.getPosition2D().add(new Vector2(0, this.type.dropPosDist)
            .rotateAround(new Vector2(0, 0), this.getHeading() + degToRad(this.type.dropPosAngleDeg)))
    }

    getDropPosition(): Vector3 {
        const dropPos2D = this.getDropPosition2D()
        return new Vector3(dropPos2D.x, this.worldMgr.getFloorHeight(dropPos2D.x, dropPos2D.y), dropPos2D.y)
    }

    isPowered(): boolean {
        return this.powerSwitch && (this.stats.SelfPowered || this.powerLink)
    }

    onDiscover() {
        super.onDiscover()
        removeFromArray(GameState.buildingsUndiscovered, this)
        GameState.buildings.push(this)
        EventBus.publishEvent(new EntityAddedEvent(EntityType.BUILDING, this))
    }

    hasMaxLevel(): boolean {
        return this.level >= this.stats.Levels - 1
    }

    upgrade() {
        if (!this.canUpgrade()) return
        if (GameState.numBrick >= this.upgradeCostBrick) {
            GameState.numBrick -= this.upgradeCostBrick
            EventBus.publishEvent(new MaterialAmountChanged(CollectableType.BRICK))
        } else {
            GameState.numOre -= this.upgradeCostOre
            EventBus.publishEvent(new MaterialAmountChanged(CollectableType.ORE))
        }
        this.level++
        EventBus.publishEvent(new EntityDeselected())
        EventBus.publishEvent(new BuildingUpgraded(this))
    }

    getStandActivity() {
        return !this.isPowered() && this.type !== Building.GUNSTATION ? BuildingActivity.Unpowered : BuildingActivity.Stand
    }

    beamUp() {
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.worldMgr.addCollectable(new Ore(), this.surfaces[0].getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.addCollectable(new Crystal(), this.surfaces[0].getRandomPosition())
        }
        this.surfaces.forEach((s) => {
            s.surfaceType = SurfaceType.GROUND
            s.updateTexture()
        })
        super.beamUp()
    }

    removeFromScene() {
        super.removeFromScene()
        removeFromArray(GameState.buildings, this)
    }

    canUpgrade() {
        return !this.hasMaxLevel() && (GameState.numOre >= this.upgradeCostOre || GameState.numBrick >= this.upgradeCostBrick)
    }

    spawnMaterials(materials: CollectableEntity[]) {
        materials.forEach((m) => this.worldMgr.addCollectable(m, this.getDropPosition2D()))
    }

}
