import { PositionalAudio, Vector2, Vector3 } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { BuildingEntityStats } from '../../../cfg/GameStatsCfg'
import { EventBus } from '../../../event/EventBus'
import { BuildingsChangedEvent, DeselectAll, SelectionChanged } from '../../../event/LocalEvents'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BubbleSprite } from '../../../scene/BubbleSprite'
import { BuildingSceneEntity } from '../../../scene/entities/BuildingSceneEntity'
import { BeamUpAnimator, BeamUpEntity } from '../../BeamUpAnimator'
import { WorldManager } from '../../WorldManager'
import { BuildingActivity, RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { Barrier } from '../material/Barrier'
import { BarrierLocation } from '../material/BarrierLocation'
import { Crystal } from '../material/Crystal'
import { ElectricFence } from '../material/ElectricFence'
import { Ore } from '../material/Ore'
import { PathTarget } from '../PathTarget'
import { RaiderTraining, RaiderTrainings } from '../raider/RaiderTraining'
import { Selectable } from '../Selectable'
import { BuildingSite } from './BuildingSite'
import { BuildingType } from './BuildingType'
import { Teleport } from './Teleport'
import { AbstractGameEntity } from "../../entity/AbstractGameEntity"
import { HealthComponent } from "../../component/common/HealthComponent"
import { HealthBarSpriteComponent } from "../../component/common/HealthBarSpriteComponent"

export class BuildingEntity extends AbstractGameEntity implements Selectable, BeamUpEntity {
    buildingType: BuildingType
    sceneEntity: BuildingSceneEntity
    powerOffSprite: BubbleSprite
    level: number = 0
    selected: boolean
    powerSwitch: boolean = true
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    secondaryPathSurface: Surface = null
    energized: boolean = false
    inBeam: boolean = false
    beamUpAnimator: BeamUpAnimator = null
    getToolPathTarget: PathTarget = null
    carryPathTarget: PathTarget = null
    engineSound: PositionalAudio
    surfaces: Surface[] = []
    pathSurfaces: Surface[] = []
    teleport: Teleport = null

    constructor(worldMgr: WorldManager, buildingType: BuildingType) {
        super(buildingType.entityType)
        this.buildingType = buildingType
        this.sceneEntity = new BuildingSceneEntity(worldMgr.sceneMgr, this.buildingType.aeFilename)
        this.powerOffSprite = new BubbleSprite(ResourceManager.configuration.bubbles.bubblePowerOff)
        this.sceneEntity.addChild(this.powerOffSprite)
        this.teleport = new Teleport(this.buildingType.teleportedEntityTypes)
        this.addComponent(new HealthComponent()).addOnDeathListener(() => this.beamUp())
        this.addComponent(new HealthBarSpriteComponent(24, 14, this.sceneEntity.group, false))
        worldMgr.registerEntity(this)
    }

    get stats(): BuildingEntityStats {
        return this.buildingType.stats
    }

    isSelectable(): boolean {
        return !this.selected && !this.inBeam
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.sceneEntity.selectionFrame.visible = true
        this.selected = true
        return true
    }

    doubleSelect(): boolean {
        if (!this.selected) return false
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = true
        return true
    }

    deselect() {
        this.sceneEntity.selectionFrame.visible = false
        this.sceneEntity.selectionFrameDouble.visible = false
        this.selected = false
    }

    getDropPosition2D(): Vector2 {
        if (this.sceneEntity.animation?.getToolJoint) {
            const worldPos = new Vector3()
            this.sceneEntity.animation.getToolJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else if (this.sceneEntity.animation?.depositJoint) {
            const worldPos = new Vector3()
            this.sceneEntity.animation.depositJoint.getWorldPosition(worldPos)
            return new Vector2(worldPos.x, worldPos.z)
        } else {
            return this.sceneEntity.position2D
        }
    }

    isReady(): boolean {
        return !this.inBeam && this.sceneEntity.visible
    }

    isPowered(): boolean {
        return this.isReady() && this.powerSwitch && (this.stats.SelfPowered || this.stats.PowerBuilding || this.energized)
    }

    hasMaxLevel(): boolean {
        return this.level >= this.stats.Levels - 1
    }

    upgrade() {
        if (!this.canUpgrade()) return
        if (GameState.numBrick >= ResourceManager.configuration.main.buildingUpgradeCostStuds) {
            GameState.numBrick -= ResourceManager.configuration.main.buildingUpgradeCostStuds
        } else {
            GameState.numOre -= ResourceManager.configuration.main.buildingUpgradeCostOre
        }
        EventBus.publishEvent(new MaterialAmountChanged())
        this.level++
        EventBus.publishEvent(new DeselectAll())
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        this.worldMgr.addMiscAnim('MiscAnims/Effects/UPGRADE_SPARKS.lws', this.primarySurface.getCenterWorld(), this.sceneEntity.getHeading())
    }

    setLevel(level: number) {
        if (this.level == level) return
        this.level = level
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    beamUp() {
        this.inBeam = true
        this.surfaces.forEach((s) => s.pathBlockedByBuilding = false)
        this.turnEnergyOff()
        this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
        for (let c = 0; c < this.stats.CostOre; c++) {
            this.worldMgr.entityMgr.placeMaterial(new Ore(this.worldMgr), this.primarySurface.getRandomPosition())
        }
        for (let c = 0; c < this.stats.CostCrystal; c++) {
            this.worldMgr.entityMgr.placeMaterial(new Crystal(this.worldMgr), this.primarySurface.getRandomPosition())
        }
        this.surfaces.forEach((s) => s.setBuilding(null))
        this.beamUpAnimator = new BeamUpAnimator(this)
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.buildings.remove(this)
        this.worldMgr.entityMgr.buildingsUndiscovered.remove(this)
        this.worldMgr.markDead(this)
    }

    canUpgrade() {
        return !this.hasMaxLevel() && (GameState.numOre >= ResourceManager.configuration.main.buildingUpgradeCostOre || GameState.numBrick >= ResourceManager.configuration.main.buildingUpgradeCostStuds)
    }

    spawnMaterials(type: EntityType, quantity: number) {
        const material = []
        if (type === EntityType.CRYSTAL) {
            while (GameState.numCrystal > 0 && material.length < quantity) {
                GameState.numCrystal--
                material.push(new Crystal(this.worldMgr))
            }
        } else if (type === EntityType.ORE) {
            while (GameState.numOre > 0 && material.length < quantity) {
                GameState.numOre--
                material.push(new Ore(this.worldMgr))
            }
        } else {
            console.error(`Material drop not implemented for: ${type}`)
        }
        if (material.length > 0) EventBus.publishEvent(new MaterialAmountChanged())
        material.forEach((m) => this.worldMgr.entityMgr.placeMaterial(m, this.getDropPosition2D()))
    }

    spawnBarriers(barrierLocations: BarrierLocation[], site: BuildingSite) {
        barrierLocations.map((l) => new Barrier(this.worldMgr, l, site)).forEach((b) => this.worldMgr.entityMgr.placeMaterial(b, this.getDropPosition2D()))
    }

    spawnFence(targetSurface: Surface) {
        this.worldMgr.entityMgr.placeMaterial(new ElectricFence(this.worldMgr, targetSurface), this.getDropPosition2D())
    }

    setPowerSwitch(state: boolean) {
        this.powerSwitch = state
        this.updateEnergyState()
    }

    updateEnergyState() {
        if (!this.isReady()) return
        if (this.powerSwitch && (this.energized || (GameState.usedCrystals + this.crystalDrain <= GameState.numCrystal && GameState.numCrystal > 0)) && (this.stats.PowerBuilding || this.surfaces.some((s) => s.energized))) {
            this.turnEnergyOn()
        } else {
            this.turnEnergyOff()
        }
        this.sceneEntity.setPowered(this.isPowered())
        this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
        this.surfaces.forEach((s) => s.updateTexture())
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
        if (this.teleport) this.teleport.powered = this.isPowered()
    }

    private turnEnergyOn() {
        if (this.energized) return
        this.energized = true
        GameState.changeUsedCrystals(this.crystalDrain)
        if (this.stats.PowerBuilding) this.primarySurface.terrain.powerGrid.addEnergySource(this.surfaces)
        if (this.stats.EngineSound && !this.engineSound) this.engineSound = this.sceneEntity.playPositionalAudio(this.stats.EngineSound, true)
    }

    private turnEnergyOff() {
        if (!this.energized) return
        this.energized = false
        GameState.changeUsedCrystals(-this.crystalDrain)
        if (this.stats.PowerBuilding) this.primarySurface.terrain.powerGrid.removeEnergySource(this.surfaces)
        this.engineSound = resetAudioSafe(this.engineSound)
    }

    get crystalDrain(): number {
        return Array.ensure(this.stats.CrystalDrain)[this.level] || 0
    }

    placeDown(worldPosition: Vector2, radHeading: number, disableTeleportIn: boolean) {
        this.primarySurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPosition)
        this.surfaces.push(this.primarySurface)
        this.primarySurface.pathBlockedByBuilding = this.entityType !== EntityType.TOOLSTATION // XXX better evaluate EnterToolStore in stats while path finding
        if (this.buildingType.secondaryBuildingPart) {
            const secondaryOffset = new Vector2(TILESIZE * this.buildingType.secondaryBuildingPart.x, TILESIZE * this.buildingType.secondaryBuildingPart.y)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondarySurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(secondaryOffset)
            this.surfaces.push(this.secondarySurface)
            this.secondarySurface.pathBlockedByBuilding = this.entityType !== EntityType.TOOLSTATION // XXX better evaluate EnterToolStore in stats while path finding
        }
        if (this.buildingType.primaryPowerPath) {
            const pathOffset = this.buildingType.primaryPowerPath.clone().multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.primaryPathSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.surfaces.push(this.primaryPathSurface)
            this.pathSurfaces.push(this.primaryPathSurface)
        }
        if (this.buildingType.secondaryPowerPath) {
            const pathOffset = this.buildingType.secondaryPowerPath.clone().multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.secondaryPathSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.surfaces.push(this.secondaryPathSurface)
            this.pathSurfaces.push(this.secondaryPathSurface)
        }
        this.surfaces.forEach((s) => s.setBuilding(this))
        this.sceneEntity.makeSelectable(this, this.stats.PickSphere / 4)
        this.addToScene(worldPosition, radHeading)
        if (this.sceneEntity.visible) {
            this.worldMgr.entityMgr.buildings.push(this)
        } else {
            this.worldMgr.entityMgr.buildingsUndiscovered.push(this)
        }
        if (this.surfaces.some((s) => s.selected)) EventBus.publishEvent(new DeselectAll())
        if (this.sceneEntity.visible && !disableTeleportIn) {
            this.inBeam = true
            this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
            this.sceneEntity.changeActivity(BuildingActivity.Teleport, () => {
                this.inBeam = false
                this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
                this.onPlaceDown()
            })
        } else {
            this.onPlaceDown()
        }
        this.worldMgr.sceneMgr.terrain.pathFinder.resetGraphsAndCaches()
    }

    private onPlaceDown() {
        this.sceneEntity.changeActivity(BuildingActivity.Stand)
        this.updateEnergyState()
        this.surfaces.forEach((surface) => {
            surface.updateTexture()
            if (surface.surfaceType.connectsPath) surface.neighbors.forEach((n) => n.updateTexture())
            surface.terrain.powerGrid.onPathChange(surface)
        })
        this.getToolPathTarget = PathTarget.fromBuilding(this, this.getDropPosition2D())
        this.carryPathTarget = PathTarget.fromBuilding(this, this.getDropPosition2D())
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    getDropAction(): RaiderActivity {
        return this.buildingType.dropAction
    }

    getTrainingTargets() {
        return [new Vector2(-1, 0), new Vector2(0, 1), new Vector2(1, 0), new Vector2(0, -1)]
            .map((v) => {
                const location = v.multiplyScalar(TILESIZE / 2).add(this.primarySurface.getCenterWorld2D())
                return PathTarget.fromBuilding(this, location)
            })
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        this.sceneEntity.addToScene(worldPosition, radHeading)
    }

    isTrainingSite(training: RaiderTraining): boolean {
        return this.isPowered() && this.stats[RaiderTrainings.toStatsProperty(training)]?.[this.level]
    }

    canTeleportIn(entityType: EntityType): boolean {
        return this.teleport?.canTeleportIn(entityType) && (entityType === EntityType.PILOT || !this.pathSurfaces.some((s) => s.isBlockedByVehicle()))
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
        this.beamUpAnimator?.update(elapsedMs)
        this.powerOffSprite.update(elapsedMs)
    }
}
