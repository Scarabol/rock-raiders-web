import { EventBus } from '../../event/EventBus'
import { BuildingSelected, EntityDeselected, SelectionEvent } from '../../event/LocalEvents'
import { Building } from '../../game/model/entity/building/Building'
import { AnimEntity } from './anim/AnimEntity'
import { Selectable, SelectionType } from '../../game/model/Selectable'
import { ResourceManager } from '../../resource/ResourceManager'
import { MathUtils, Matrix4, Vector3 } from 'three'
import { GameState } from '../../game/model/GameState'
import { BuildingUpgraded, CollectEvent, EntityAddedEvent, EntityType } from '../../event/WorldEvents'
import { Surface } from './map/Surface'
import { CollectableType } from './collect/CollectableEntity'
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

    constructor(buildingType: Building) {
        super(ResourceManager.getAnimationEntityType(buildingType.aeFile))
        this.type = buildingType
        this.group.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
        this.group.userData = {'selectable': this}
        this.pickSphereRadius = this.stats.PickSphere / 2
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

    getDropPosition(): Vector3 {
        const dropPos = this.getPosition().add(new Vector3(0, 0, this.type.dropPosDist)
            .applyEuler(this.getRotation()).applyAxisAngle(new Vector3(0, 1, 0), degToRad(this.type.dropPosAngleDeg)))
        dropPos.y = this.worldMgr.getTerrainHeight(dropPos.x, dropPos.z)
        return dropPos
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
        const costOre = ResourceManager.cfg('Main', 'BuildingUpgradeCostOre') || 5 // TODO implement bricks use BuildingUpgradeCostStuds
        if (GameState.numOre < costOre || this.hasMaxLevel()) return
        GameState.numOre -= costOre
        this.level++
        EventBus.publishEvent(new CollectEvent(CollectableType.ORE))
        EventBus.publishEvent(new EntityDeselected())
        EventBus.publishEvent(new BuildingUpgraded(this))
    }

    getStandActivity() {
        return !this.isPowered() && this.type !== Building.GUNSTATION ? BuildingActivity.Unpowered : BuildingActivity.Stand
    }

    beamUp() {
        for (let c = 0; c < this.stats.CostOre; c++) {
            const [x, z] = this.surfaces[0].getRandomPosition()
            this.worldMgr.addCollectable(new Ore(), x, z)
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            const [x, z] = this.surfaces[0].getRandomPosition()
            this.worldMgr.addCollectable(new Crystal(), x, z)
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

}
