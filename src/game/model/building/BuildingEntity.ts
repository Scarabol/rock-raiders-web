import { Matrix4, Vector2, Vector3 } from 'three'
import { BuildingEntityStats } from '../../../cfg/BuildingEntityStats'
import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { BuildingSelected, EntityDeselected, SelectionEvent } from '../../../event/LocalEvents'
import { BuildingUpgraded, EntityAddedEvent, MaterialAmountChanged } from '../../../event/WorldEvents'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BuildingActivity } from '../activities/BuildingActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { AnimEntity } from '../anim/AnimEntity'
import { Crystal } from '../collect/Crystal'
import { MaterialEntity } from '../collect/MaterialEntity'
import { Ore } from '../collect/Ore'
import { EntitySuperType, EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { Selectable, SelectionType } from '../Selectable'

export abstract class BuildingEntity extends AnimEntity implements Selectable {

    blocksPathSurface: boolean = true
    secondaryBuildingPart: { x: number, y: number } = null
    primaryPowerPath: { x: number, y: number } = {x: 0, y: 1}
    secondaryPowerPath: { x: number, y: number } = null
    waterPathSurface: { x: number, y: number } = null

    selected: boolean
    powerSwitch: boolean = true
    spawning: boolean = false
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    secondaryPathSurface: Surface = null
    upgradeCostOre: number = 0
    upgradeCostBrick: number = 0
    crystalsInUse: number = 0
    inBeam: boolean = false

    protected constructor(entityType: EntityType, aeFilename: string) {
        super(EntitySuperType.BUILDING, entityType, aeFilename)
        this.group.applyMatrix4(new Matrix4().makeScale(-1, 1, 1))
        this.group.userData = {'selectable': this}
        this.upgradeCostOre = ResourceManager.cfg('Main', 'BuildingUpgradeCostOre')
        this.upgradeCostBrick = ResourceManager.cfg('Main', 'BuildingUpgradeCostStuds')
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, (event: MaterialAmountChanged) => {
            if (event.entityType === EntityType.CRYSTAL && this.powerSwitch) {
                this.turnOnPower()
            }
        })
    }

    abstract get stats(): BuildingEntityStats

    getSelectionType(): SelectionType {
        return SelectionType.BUILDING
    }

    select(): SelectionEvent {
        if (this.inBeam) return null
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

    getPickSphereCenter(): Vector3 {
        return new Vector3(0, this.stats.PickSphere / 4, 0)
    }

    getDropPosition2D(): Vector2 {
        if (this.getToolJoint) {
            const worldPos = new Vector3()
            this.getToolJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else if (this.depositJoint) {
            const worldPos = new Vector3()
            this.depositJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else {
            return this.getPosition2D()
        }
    }

    getDropPosition(): Vector3 {
        return this.worldMgr.getFloorPosition(this.getDropPosition2D())
    }

    isPowered(): boolean {
        return this.powerSwitch && (this.stats.SelfPowered || this.stats.PowerBuilding || this.crystalsInUse > 0)
    }

    onDiscover() {
        super.onDiscover()
        GameState.buildingsUndiscovered.remove(this)
        GameState.buildings.push(this)
        EventBus.publishEvent(new EntityAddedEvent(this))
    }

    hasMaxLevel(): boolean {
        return this.level >= this.stats.Levels - 1
    }

    upgrade() {
        if (!this.canUpgrade()) return
        if (GameState.numBrick >= this.upgradeCostBrick) {
            GameState.numBrick -= this.upgradeCostBrick
            EventBus.publishEvent(new MaterialAmountChanged(EntityType.BRICK))
        } else {
            GameState.numOre -= this.upgradeCostOre
            EventBus.publishEvent(new MaterialAmountChanged(EntityType.ORE))
        }
        this.level++
        EventBus.publishEvent(new EntityDeselected())
        EventBus.publishEvent(new BuildingUpgraded(this))
        // TODO add sparkly upgrade animation
    }

    getDefaultActivity(): BuildingActivity {
        return !this.isPowered() ? BuildingActivity.Unpowered : AnimEntityActivity.Stand
    }

    beamUp() {
        GameState.usedCrystals -= this.crystalsInUse
        this.crystalsInUse = 0
        this.inBeam = true
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.worldMgr.placeMaterial(new Ore(), this.primarySurface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.placeMaterial(new Crystal(), this.primarySurface.getRandomPosition())
        }
        this.surfaces.forEach((s) => {
            s.surfaceType = SurfaceType.GROUND
            s.setBuilding(null)
            s.updateTexture()
            s.neighbors.forEach((n) => n.updateTexture())
        })
        super.beamUp()
    }

    removeFromScene() {
        super.removeFromScene()
        GameState.buildings.remove(this)
    }

    canUpgrade() {
        return !this.hasMaxLevel() && (GameState.numOre >= this.upgradeCostOre || GameState.numBrick >= this.upgradeCostBrick)
    }

    spawnMaterials(materials: MaterialEntity[]) {
        materials.forEach((m) => this.worldMgr.placeMaterial(m, this.getDropPosition2D()))
    }

    turnOnPower() {
        if (this.crystalsInUse > 0 || GameState.usedCrystals >= GameState.numCrystal || (this.entityType !== EntityType.POWER_STATION && !this.surfaces.some((s) => s.neighbors.some((n) => n.hasPower)))) return
        this.crystalsInUse = 1
        GameState.usedCrystals += this.crystalsInUse
        this.surfaces.forEach((s) => s.setHasPower(true, true))
        this.changeActivity()
    }

    turnOffPower() {
        if (this.crystalsInUse < 1) return
        GameState.usedCrystals -= this.crystalsInUse
        this.crystalsInUse = 0
        this.surfaces.forEach((s) => s.setHasPower(false, false))
        this.changeActivity()
    }

    get surfaces(): Surface[] {
        const result = []
        if (this.primarySurface) result.push(this.primarySurface)
        if (this.secondarySurface) result.push(this.secondarySurface)
        if (this.primaryPathSurface) result.push(this.primaryPathSurface)
        if (this.secondaryPathSurface) result.push(this.secondaryPathSurface)
        return result
    }

    addToScene(worldMgr: WorldManager, worldX: number, worldZ: number, radHeading: number, disableTeleportIn: boolean) {
        this.worldMgr = worldMgr
        this.group.position.copy(worldMgr.getFloorPosition(new Vector2(worldX, worldZ)))
        this.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading) // TODO rotate building with normal vector of surface too
        this.group.visible = worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).discovered
        worldMgr.sceneManager.scene.add(this.group)
        this.createPickSphere()
        const primaryPathSurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position)
        primaryPathSurface.setBuilding(this)
        primaryPathSurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
        primaryPathSurface.updateTexture()
        this.primarySurface = primaryPathSurface
        if (this.secondaryBuildingPart) {
            const secondaryOffset = new Vector3(TILESIZE * this.secondaryBuildingPart.x, 0, TILESIZE * this.secondaryBuildingPart.y)
                .applyAxisAngle(new Vector3(0, 1, 0), radHeading).add(this.group.position)
            const secondarySurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(secondaryOffset)
            secondarySurface.setBuilding(this)
            secondarySurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
            secondarySurface.updateTexture()
            this.secondarySurface = secondarySurface
        }
        if (this.primaryPowerPath) {
            const pathOffset = new Vector3(this.primaryPowerPath.x, 0, this.primaryPowerPath.y).multiplyScalar(TILESIZE)
                .applyAxisAngle(new Vector3(0, 1, 0), radHeading).add(this.group.position)
            const pathSurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(pathOffset)
            if (this.entityType === EntityType.GEODOME) pathSurface.building = this
            pathSurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
            pathSurface.updateTexture()
            this.primaryPathSurface = pathSurface
        }
        if (this.group.visible) {
            GameState.buildings.push(this)
        } else {
            GameState.buildingsUndiscovered.push(this)
        }
        if (this.group.visible && !disableTeleportIn) {
            this.inBeam = true
            this.changeActivity(BuildingActivity.Teleport, () => this.onAddToScene())
        } else {
            this.onAddToScene()
        }
        worldMgr.sceneManager.terrain.resetGraphWalk()
    }

    private onAddToScene() {
        this.inBeam = false
        this.changeActivity()
        EventBus.publishEvent(new EntityAddedEvent(this))
        this.turnOnPower()
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

}
