import { Matrix4, Vector2, Vector3 } from 'three'
import { BuildingEntityStats } from '../../../cfg/BuildingEntityStats'
import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { BuildingSelected, EntityDeselected, SelectionEvent } from '../../../event/LocalEvents'
import { BuildingUpgraded, EntityAddedEvent, MaterialAmountChanged } from '../../../event/WorldEvents'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimEntityActivity } from '../activities/AnimEntityActivity'
import { BuildingActivity } from '../activities/BuildingActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { AnimEntity } from '../anim/AnimEntity'
import { Barrier } from '../collect/Barrier'
import { BarrierLocation } from '../collect/BarrierLocation'
import { Crystal } from '../collect/Crystal'
import { ElectricFence } from '../collect/ElectricFence'
import { Ore } from '../collect/Ore'
import { EntitySuperType, EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { Selectable, SelectionType } from '../Selectable'
import { BuildingSite } from './BuildingSite'

export abstract class BuildingEntity extends AnimEntity implements Selectable {

    blocksPathSurface: boolean = true
    secondaryBuildingPart: Vector2 = null
    primaryPowerPath: Vector2 = new Vector2(0, 1)
    secondaryPowerPath: Vector2 = null
    waterPathSurface: Vector2 = null

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

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, EntitySuperType.BUILDING, entityType, aeFilename)
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
        return this.sceneMgr.getFloorPosition(this.getDropPosition2D())
    }

    isPowered(): boolean {
        return !this.inBeam && this.powerSwitch && (this.stats.SelfPowered || this.stats.PowerBuilding || this.crystalsInUse > 0)
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
            this.worldMgr.placeMaterial(new Ore(this.worldMgr, this.sceneMgr), this.primarySurface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.placeMaterial(new Crystal(this.worldMgr, this.sceneMgr), this.primarySurface.getRandomPosition())
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

    spawnMaterials(type: EntityType, quantity: number) {
        const material = []
        if (type === EntityType.CRYSTAL) {
            while (GameState.numCrystal > 0 && material.length < quantity) {
                GameState.numCrystal--
                material.push(new Crystal(this.worldMgr, this.sceneMgr))
            }
        } else if (type === EntityType.ORE) {
            while (GameState.numOre > 0 && material.length < quantity) {
                GameState.numOre--
                material.push(new Ore(this.worldMgr, this.sceneMgr))
            }
        } else {
            console.error('Material drop not implemented for: ' + type)
        }
        if (material.length > 0) EventBus.publishEvent(new MaterialAmountChanged(type))
        material.forEach((m) => this.worldMgr.placeMaterial(m, this.getDropPosition2D()))
    }

    spawnBarriers(barrierLocations: BarrierLocation[], site: BuildingSite) {
        barrierLocations.map((l) => new Barrier(this.worldMgr, this.sceneMgr, l, site)).forEach((b) => this.worldMgr.placeMaterial(b, this.getDropPosition2D()))
    }

    spawnFence(targetSurface: Surface) {
        this.worldMgr.placeMaterial(new ElectricFence(this.worldMgr, this.sceneMgr, targetSurface), this.getDropPosition2D())
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

    placeDown(worldPosition: Vector2, radHeading: number, disableTeleportIn: boolean) {
        const primaryPathSurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(worldPosition)
        primaryPathSurface.setBuilding(this)
        primaryPathSurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
        primaryPathSurface.updateTexture()
        this.primarySurface = primaryPathSurface
        if (this.secondaryBuildingPart) {
            const secondaryOffset = new Vector2(TILESIZE * this.secondaryBuildingPart.x, TILESIZE * this.secondaryBuildingPart.y)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            const secondarySurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(secondaryOffset)
            secondarySurface.setBuilding(this)
            secondarySurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
            secondarySurface.updateTexture()
            this.secondarySurface = secondarySurface
        }
        if (this.primaryPowerPath) {
            const pathOffset = new Vector2(this.primaryPowerPath.x, this.primaryPowerPath.y).multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            const pathSurface = this.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            if (this.entityType === EntityType.GEODOME) pathSurface.building = this
            pathSurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
            pathSurface.updateTexture()
            this.primaryPathSurface = pathSurface
        }
        this.addToScene(worldPosition, radHeading)
        this.createPickSphere()
        if (this.group.visible) {
            GameState.buildings.push(this)
        } else {
            GameState.buildingsUndiscovered.push(this)
        }
        if (this.group.visible && !disableTeleportIn) {
            this.inBeam = true
            this.changeActivity(BuildingActivity.Teleport, () => {
                this.inBeam = false
                this.onPlaceDown()
            })
        } else {
            this.onPlaceDown()
        }
        this.sceneMgr.terrain.resetGraphWalk()
    }

    private onPlaceDown() {
        this.changeActivity()
        this.turnOnPower()
        EventBus.publishEvent(new EntityAddedEvent(this))
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

}
