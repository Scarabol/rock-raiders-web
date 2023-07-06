import { PositionalAudio, Vector2 } from 'three'
import { resetAudioSafe } from '../../../audio/AudioUtil'
import { BuildingEntityStats } from '../../../cfg/GameStatsCfg'
import { EventBus } from '../../../event/EventBus'
import { BuildingsChangedEvent, DeselectAll, SelectionChanged } from '../../../event/LocalEvents'
import { MaterialAmountChanged, UsedCrystalsChanged } from '../../../event/WorldEvents'
import { DEV_MODE, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { BubbleSprite } from '../../../scene/BubbleSprite'
import { WorldManager } from '../../WorldManager'
import { BuildingActivity, RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../../terrain/Surface'
import { PathTarget } from '../PathTarget'
import { RaiderTraining, RaiderTrainings } from '../raider/RaiderTraining'
import { BuildingSite } from './BuildingSite'
import { BuildingType } from './BuildingType'
import { Teleport } from './Teleport'
import { GameEntity } from '../../ECS'
import { HealthComponent } from '../../component/HealthComponent'
import { MaterialEntity } from '../material/MaterialEntity'
import { BeamUpComponent } from '../../component/BeamUpComponent'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { MaterialSpawner } from '../../entity/MaterialSpawner'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { OxygenComponent } from '../../component/OxygenComponent'
import { PositionComponent } from '../../component/PositionComponent'

export class BuildingEntity {
    readonly entityType: EntityType
    readonly carriedItems: MaterialEntity[] = []
    readonly entity: GameEntity
    buildingType: BuildingType
    sceneEntity: AnimatedSceneEntity
    powerOffSprite: BubbleSprite
    level: number = 0
    powerSwitch: boolean = true
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    secondaryPathSurface: Surface = null
    waterPathSurface: Surface = null
    energized: boolean = false
    getToolPathTarget: PathTarget = null
    carryPathTarget: PathTarget = null
    engineSound: PositionalAudio
    surfaces: Surface[] = []
    pathSurfaces: Surface[] = []
    teleport: Teleport = null

    constructor(readonly worldMgr: WorldManager, buildingType: BuildingType) {
        this.entityType = buildingType.entityType
        this.buildingType = buildingType
        this.sceneEntity = new AnimatedSceneEntity(this.worldMgr.sceneMgr.audioListener)
        this.sceneEntity.addAnimated(ResourceManager.getAnimatedData(buildingType.aeFilename))
        this.sceneEntity.flipXAxis()
        this.powerOffSprite = new BubbleSprite(ResourceManager.configuration.bubbles.bubblePowerOff)
        this.sceneEntity.add(this.powerOffSprite)
        this.teleport = new Teleport(this.buildingType.teleportedEntityTypes)
        this.entity = this.worldMgr.ecs.addEntity()
        this.worldMgr.ecs.addComponent(this.entity, new HealthComponent(this.stats.DamageCausesCallToArms, 24, 14, this.sceneEntity, false))
        this.worldMgr.entityMgr.addEntity(this.entity, this.entityType)
    }

    get stats(): BuildingEntityStats {
        return this.buildingType.stats
    }

    get inBeam(): boolean {
        return !this.worldMgr.ecs.getComponents(this.entity).has(SelectionFrameComponent)
    }

    get selected(): boolean {
        const selectionFrameComponent = this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)
        return selectionFrameComponent?.isSelected()
    }

    isSelectable(): boolean {
        return !this.selected && !this.inBeam
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.select()
        return true
    }

    doubleSelect(): boolean {
        if (!this.selected) return false
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.doubleSelect()
        return true
    }

    deselect() {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
    }

    getDropPosition2D(): Vector2 {
        const worldPos = this.sceneEntity.position.clone()
        if (this.sceneEntity.toolParent) {
            this.sceneEntity.toolParent.getWorldPosition(worldPos)
        } else if (this.sceneEntity.depositParent) {
            this.sceneEntity.depositParent.getWorldPosition(worldPos)
        }
        return new Vector2(worldPos.x, worldPos.z)
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
        this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.UpgradeEffect, this.primarySurface.getCenterWorld(), this.sceneEntity.getHeading())
    }

    setLevel(level: number) {
        if (this.level == level) return
        this.level = level
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    beamUp(dropMaterials: boolean) {
        this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
        this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
        this.surfaces.forEach((s) => s.pathBlockedByBuilding = false)
        this.setEnergized(false)
        this.sceneEntity.setAnimation(BuildingActivity.Stand)
        this.powerOffSprite.setEnabled(false)
        if (dropMaterials) {
            for (let c = 0; c < this.stats.CostOre; c++) {
                MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ORE, this.primarySurface.getRandomPosition())
            }
            for (let c = 0; c < this.stats.CostCrystal; c++) {
                MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, this.primarySurface.getRandomPosition())
            }
            this.carriedItems.forEach((m) => this.worldMgr.entityMgr.placeMaterial(m, this.primarySurface.getRandomPosition()))
        }
        this.surfaces.forEach((s) => s.setBuilding(null))
        this.worldMgr.ecs.addComponent(this.entity, new BeamUpComponent(this))
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
    }

    disposeFromWorld() {
        this.worldMgr.sceneMgr.removeMeshGroup(this.sceneEntity)
        this.sceneEntity.dispose()
        this.engineSound = resetAudioSafe(this.engineSound)
        this.worldMgr.entityMgr.buildings.remove(this)
        this.worldMgr.entityMgr.buildingsUndiscovered.remove(this)
        this.worldMgr.entityMgr.removeEntity(this.entity, this.entityType)
        this.worldMgr.ecs.removeEntity(this.entity)
    }

    canUpgrade() {
        return !this.hasMaxLevel() && (GameState.numOre >= ResourceManager.configuration.main.buildingUpgradeCostOre || GameState.numBrick >= ResourceManager.configuration.main.buildingUpgradeCostStuds)
    }

    missingOreForUpgrade(): number {
        return Math.max(0, ResourceManager.configuration.main.buildingUpgradeCostOre - GameState.numOre)
    }

    spawnMaterials(type: EntityType, quantity: number) {
        const material = [] // XXX actually this does not require a list
        if (type === EntityType.CRYSTAL) {
            while (GameState.numCrystal > 0 && material.length < quantity) {
                GameState.numCrystal--
                material.push(MaterialSpawner.spawnMaterial(this.worldMgr, type, this.getDropPosition2D()))
            }
        } else if (type === EntityType.ORE) {
            while (GameState.numOre > 0 && material.length < quantity) {
                GameState.numOre--
                material.push(MaterialSpawner.spawnMaterial(this.worldMgr, type, this.getDropPosition2D()))
            }
        } else if (type === EntityType.BRICK) {
            while (GameState.numBrick > 0 && material.length < quantity) {
                GameState.numBrick--
                material.push(MaterialSpawner.spawnMaterial(this.worldMgr, type, this.getDropPosition2D()))
            }
        } else {
            console.error(`Material drop not implemented for: ${type}`)
        }
        if (material.length > 0) EventBus.publishEvent(new MaterialAmountChanged())
        const energyConsumer = this.worldMgr.entityMgr.buildings.filter((b) => b.energized && b.crystalDrain > 0).reverse()
        for (let c = 0; c < energyConsumer.length && GameState.usedCrystals > GameState.numCrystal; c++) {
            energyConsumer[c].setEnergized(false)
        }
    }

    spawnBarriers(barrierLocations: Vector2[], site: BuildingSite) {
        barrierLocations.forEach((l) => {
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.BARRIER, this.getDropPosition2D(), null, null, l, site)
        })
    }

    spawnFence(targetSurface: Surface) {
        MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ELECTRIC_FENCE, this.getDropPosition2D(), null, targetSurface)
    }

    setPowerSwitch(state: boolean) {
        this.powerSwitch = state
        this.updateEnergyState()
    }

    updateEnergyState() {
        if (this.isReady() && this.powerSwitch && (this.energized || (GameState.usedCrystals + this.crystalDrain <= GameState.numCrystal && GameState.numCrystal > 0)) && (this.stats.PowerBuilding || this.surfaces.some((s) => s.energized))) {
            this.setEnergized(true)
        } else {
            this.setEnergized(false)
        }
    }

    setEnergized(energized: boolean) {
        if (this.energized === energized) return
        this.energized = energized
        if (this.energized) {
            this.changeUsedCrystals(this.crystalDrain)
            if (this.stats.PowerBuilding) this.primarySurface.terrain.powerGrid.addEnergySource(this.surfaces)
            if (this.stats.EngineSound && !this.engineSound && !DEV_MODE) this.engineSound = this.worldMgr.sceneMgr.addPositionalAudio(this.sceneEntity, this.stats.EngineSound, true, true)
            if (this.stats.OxygenCoef) this.worldMgr.ecs.addComponent(this.entity, new OxygenComponent(this.stats.OxygenCoef))
            if (this.sceneEntity.currentAnimation === BuildingActivity.Unpowered) this.sceneEntity.setAnimation(BuildingActivity.Stand)
        } else {
            this.changeUsedCrystals(-this.crystalDrain)
            if (this.stats.PowerBuilding) this.primarySurface.terrain.powerGrid.removeEnergySource(this.surfaces)
            this.engineSound = resetAudioSafe(this.engineSound)
            this.worldMgr.ecs.removeComponent(this.entity, OxygenComponent)
            if (this.sceneEntity.currentAnimation === BuildingActivity.Stand) this.sceneEntity.setAnimation(BuildingActivity.Unpowered)
        }
        this.powerOffSprite.setEnabled(!this.energized)
        this.surfaces.forEach((s) => s.updateTexture())
        EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.worldMgr.entityMgr))
        if (this.teleport) this.teleport.powered = this.energized
    }

    get crystalDrain(): number {
        return Array.ensure(this.stats.CrystalDrain)[this.level] || 0
    }

    private changeUsedCrystals(changedCrystals: number) {
        if (!changedCrystals) return
        GameState.usedCrystals += changedCrystals
        EventBus.publishEvent(new UsedCrystalsChanged())
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
        if (this.buildingType.waterPathSurface) {
            const pathOffset = this.buildingType.waterPathSurface.clone().multiplyScalar(TILESIZE)
                .rotateAround(new Vector2(0, 0), -radHeading).add(worldPosition)
            this.waterPathSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(pathOffset)
            this.pathSurfaces.push(this.waterPathSurface)
        }
        this.surfaces.forEach((s) => s.setBuilding(this))
        const sceneSelectionComponent = this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity, {gameEntity: this.entity, entityType: this.entityType}, this.stats))
        const floorPosition = this.worldMgr.sceneMgr.getFloorPosition(worldPosition)
        floorPosition.y = Math.max(...this.surfaces.map((s) => this.worldMgr.sceneMgr.getFloorPosition(s.getCenterWorld2D()).y))
        this.sceneEntity.position.copy(floorPosition)
        this.worldMgr.ecs.addComponent(this.entity, new PositionComponent(floorPosition, this.primarySurface))
        this.sceneEntity.rotation.y = radHeading
        this.sceneEntity.visible = this.surfaces.some((s) => s.discovered)
        this.worldMgr.sceneMgr.addMeshGroup(this.sceneEntity)
        if (this.sceneEntity.visible) {
            this.worldMgr.entityMgr.buildings.push(this)
        } else {
            this.worldMgr.entityMgr.buildingsUndiscovered.push(this)
        }
        if (this.surfaces.some((s) => s.selected)) EventBus.publishEvent(new DeselectAll())
        if (this.sceneEntity.visible && !disableTeleportIn) {
            this.powerOffSprite.setEnabled(!this.inBeam && !this.isPowered())
            this.sceneEntity.setAnimation(BuildingActivity.Teleport, () => {
                this.worldMgr.ecs.addComponent(this.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, this.stats))
                this.powerOffSprite.setEnabled(!this.isPowered())
                this.onPlaceDown()
            })
        } else {
            this.worldMgr.ecs.addComponent(this.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, this.stats))
            this.onPlaceDown()
        }
        this.worldMgr.sceneMgr.terrain.pathFinder.resetGraphsAndCaches()
    }

    private onPlaceDown() {
        this.sceneEntity.setAnimation(BuildingActivity.Stand)
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

    isTrainingSite(training: RaiderTraining): boolean {
        const statsProperty = RaiderTrainings.toStatsProperty(training)
        const stat: boolean[] = this.stats[statsProperty]
        return this.isPowered() && stat?.[this.level]
    }

    canTeleportIn(entityType: EntityType): boolean {
        return this.teleport?.canTeleportIn(entityType) && (entityType === EntityType.PILOT || !this.pathSurfaces.some((s) => s.isBlockedByVehicle()))
    }

    update(elapsedMs: number) {
        this.powerOffSprite.update(elapsedMs)
        const health = this.worldMgr.ecs.getComponents(this.entity).get(HealthComponent).health
        if (health <= 0) {
            this.worldMgr.entityMgr.buildings.remove(this)
            this.worldMgr.entityMgr.removeEntity(this.entity, this.entityType)
            this.worldMgr.ecs.getComponents(this.entity).get(SelectionFrameComponent)?.deselect()
            this.worldMgr.ecs.removeComponent(this.entity, SelectionFrameComponent)
            this.surfaces.forEach((s) => s.pathBlockedByBuilding = false)
            this.setEnergized(false)
            this.sceneEntity.setAnimation(BuildingActivity.Explode, () => this.worldMgr.sceneMgr.removeMeshGroup(this.sceneEntity))
            this.powerOffSprite.setEnabled(false)
            this.surfaces.forEach((s) => s.setBuilding(null))
            EventBus.publishEvent(new BuildingsChangedEvent(this.worldMgr.entityMgr))
        }
    }

    getMaxCarry(): number {
        return this.stats.MaxCarry[this.level] ?? 0
    }

    pickupItem(item: MaterialEntity): void {
        this.sceneEntity.pickupEntity(item.sceneEntity)
        this.carriedItems.push(item)
    }

    depositItems(): void {
        if (this.entityType === EntityType.ORE_REFINERY) {
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.BRICK, this.getDropPosition2D())
        } else {
            this.carriedItems.forEach((m) => GameState.depositItem(m))
        }
        this.carriedItems.forEach((m) => m.disposeFromWorld())
        this.carriedItems.length = 0
    }
}
