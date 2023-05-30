import { AmbientLight, AudioListener, Color, Frustum, Mesh, Object3D, PositionalAudio, Scene, Vector2, Vector3 } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { SpriteImage } from '../core/Sprite'
import { ResourceManager } from '../resource/ResourceManager'
import { BirdViewControls } from '../scene/BirdViewControls'
import { BuildPlacementMarker } from './model/building/BuildPlacementMarker'
import { EntityType } from './model/EntityType'
import { GameSelection } from './model/GameSelection'
import { GameState } from './model/GameState'
import { Terrain } from './model/map/Terrain'
import { TerrainLoader } from './TerrainLoader'
import { WorldManager } from './WorldManager'
import { BirdViewCamera } from '../scene/BirdViewCamera'
import { TorchLightCursor } from '../scene/TorchLightCursor'
import { SceneRenderer } from '../scene/SceneRenderer'
import { Updatable, updateSafe } from './model/Updateable'
import { SceneEntity } from '../scene/SceneEntity'
import { TILESIZE } from '../params'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { AnimatedMeshGroup } from '../scene/AnimatedMeshGroup'

export class SceneManager implements Updatable {
    readonly audioListener: AudioListener
    readonly camera: BirdViewCamera
    readonly renderer: SceneRenderer
    readonly controls: BirdViewControls
    readonly entities: (SceneEntity | AnimatedMeshGroup)[] = []
    worldMgr: WorldManager
    scene: Scene
    ambientLight: AmbientLight
    terrain: Terrain
    cursor: TorchLightCursor
    buildMarker: BuildPlacementMarker

    constructor(canvas: SpriteImage) {
        this.audioListener = new AudioListener()
        this.camera = new BirdViewCamera(canvas.width / canvas.height)
        this.camera.add(this.audioListener)
        this.renderer = new SceneRenderer(canvas, this.camera)
        this.controls = new BirdViewControls(this.camera, this.renderer.domElement)
    }

    getEntitiesInFrustum(r1x: number, r1y: number, r2x: number, r2y: number): GameSelection {
        const startPoint = new Vector3(r1x, r1y, 0.5)
        const endPoint = new Vector3(r2x, r2y, 0.5)
        // Avoid invalid frustum
        if (startPoint.x === endPoint.x) {
            endPoint.x += Number.EPSILON
        }
        if (startPoint.y === endPoint.y) {
            endPoint.y += Number.EPSILON
        }
        // update camera
        this.camera.updateProjectionMatrix()
        this.camera.updateMatrixWorld()
        // update frustum
        const tmpPoint = new Vector3()
        tmpPoint.copy(startPoint)
        tmpPoint.x = Math.min(startPoint.x, endPoint.x)
        tmpPoint.y = Math.max(startPoint.y, endPoint.y)
        endPoint.x = Math.max(startPoint.x, endPoint.x)
        endPoint.y = Math.min(startPoint.y, endPoint.y)

        const vecNear = new Vector3()
        const vecTopLeft = new Vector3()
        const vecTopRight = new Vector3()
        const vecDownRight = new Vector3()
        const vecDownLeft = new Vector3()
        vecNear.setFromMatrixPosition(this.camera.matrixWorld)
        vecTopLeft.copy(tmpPoint)
        vecTopRight.set(endPoint.x, tmpPoint.y, 0)
        vecDownRight.copy(endPoint)
        vecDownLeft.set(tmpPoint.x, endPoint.y, 0)

        vecTopLeft.unproject(this.camera)
        vecTopRight.unproject(this.camera)
        vecDownRight.unproject(this.camera)
        vecDownLeft.unproject(this.camera)

        const vectemp1 = new Vector3()
        const vectemp2 = new Vector3()
        const vectemp3 = new Vector3()
        vectemp1.copy(vecTopLeft).sub(vecNear)
        vectemp2.copy(vecTopRight).sub(vecNear)
        vectemp3.copy(vecDownRight).sub(vecNear)
        vectemp1.normalize()
        vectemp2.normalize()
        vectemp3.normalize()

        const deep = Number.MAX_VALUE
        vectemp1.multiplyScalar(deep)
        vectemp2.multiplyScalar(deep)
        vectemp3.multiplyScalar(deep)
        vectemp1.add(vecNear)
        vectemp2.add(vecNear)
        vectemp3.add(vecNear)

        const frustum = new Frustum()
        const planes = frustum.planes

        planes[0].setFromCoplanarPoints(vecNear, vecTopLeft, vecTopRight)
        planes[1].setFromCoplanarPoints(vecNear, vecTopRight, vecDownRight)
        planes[2].setFromCoplanarPoints(vecDownRight, vecDownLeft, vecNear)
        planes[3].setFromCoplanarPoints(vecDownLeft, vecTopLeft, vecNear)
        planes[4].setFromCoplanarPoints(vecTopRight, vecDownRight, vecDownLeft)
        planes[5].setFromCoplanarPoints(vectemp3, vectemp2, vectemp1)
        planes[5].normal.multiplyScalar(-1)

        const selection = new GameSelection()
        selection.raiders.push(...this.worldMgr.entityMgr.raiders.filter((r) => r.isInSelection() && SceneManager.isInFrustum(r.sceneEntity.pickSphere, frustum)))
        const hasRaiderSelected = selection.raiders.length > 0
        selection.vehicles.push(...this.worldMgr.entityMgr.vehicles.filter((v) => v.isInSelection() && (!hasRaiderSelected || v.driver) && SceneManager.isInFrustum(v.sceneEntity.pickSphere, frustum)))
        if (selection.isEmpty()) selection.building = this.worldMgr.entityMgr.buildings.find((b) => SceneManager.isInFrustum(b.sceneEntity.pickSphere, frustum))
        return selection
    }

    private static isInFrustum(pickSphere: Mesh, frustum: Frustum) {
        if (!pickSphere) return false
        const selectionCenter = new Vector3()
        pickSphere.getWorldPosition(selectionCenter)
        return frustum.containsPoint(selectionCenter)
    }

    setupScene(levelConf: LevelEntryCfg) {
        this.scene = new Scene()

        const ambientRgb = ResourceManager.configuration.main.ambientRGB
        const maxAmbRgb = Math.min(255, Math.max(0, ...ambientRgb))
        const normalizedRgb = ambientRgb.map(v => v / (maxAmbRgb ? maxAmbRgb : 1))
        const ambientColor = new Color(normalizedRgb[0], normalizedRgb[1], normalizedRgb[2])
        this.ambientLight = new AmbientLight(ambientColor)
        this.setLightLevel(SaveGameManager.currentPreferences.gameBrightness)
        this.scene.add(this.ambientLight)

        this.cursor = new TorchLightCursor()
        this.scene.add(this.cursor)

        this.buildMarker = new BuildPlacementMarker(this.worldMgr)
        this.scene.add(this.buildMarker.group)
        this.setBuildModeSelection(null)

        // create terrain mesh and add it to the scene
        TerrainLoader.loadTerrain(levelConf, this.worldMgr)

        // gather level start details for game result score calculation
        GameState.totalDiggables = this.terrain.countDiggables()
        GameState.totalCrystals = this.terrain.countCrystals()
        GameState.totalOres = this.terrain.countOres()
    }

    startScene() {
        if (!this.scene) {
            console.error('No scene to render')
            return
        }
        this.renderer.startRendering(this.scene)
    }

    update(elapsedMs: number) {
        this.terrain.update(elapsedMs)
        this.entities.forEach((e) => updateSafe(e, elapsedMs))
    }

    disposeScene() {
        this.renderer.dispose()
        GameState.remainingDiggables = this.terrain?.countDiggables() || 0
        this.terrain?.dispose()
        this.terrain = null
        this.cursor?.dispose()
        this.entities.length = 0
    }

    resize(width: number, height: number) {
        this.renderer.setSize(width, height)
        this.camera.aspect = width / height
    }

    setCursorFloorPosition(position: Vector2) {
        this.cursor.position.copy(this.terrain.getFloorPosition(position))
    }

    getFloorPosition(world: Vector2) {
        return this.terrain.getFloorPosition(world)
    }

    hasBuildModeSelection(): boolean {
        return !!this.buildMarker?.hasBuildMode()
    }

    setBuildModeSelection(entityType: EntityType) {
        this.buildMarker.setBuildMode(entityType)
    }

    addEntity(sceneEntity: SceneEntity): void {
        this.scene.add(sceneEntity.group)
        this.entities.add(sceneEntity)
    }

    removeEntity(sceneEntity: SceneEntity): void {
        this.entities.remove(sceneEntity)
        this.scene.remove(sceneEntity.group)
    }

    addMeshGroup(meshGroup: AnimatedMeshGroup): void {
        this.entities.add(meshGroup)
        this.scene.add(meshGroup)
    }

    removeMeshGroup(meshGroup: AnimatedMeshGroup): void {
        this.entities.remove(meshGroup)
        this.scene.remove(meshGroup)
    }

    addPositionalAudio(parent: Object3D, sfxName: string, autoPlay: boolean, loop: boolean = false): PositionalAudio {
        const audio = new PositionalAudio(this.audioListener)
        audio.setRefDistance(TILESIZE * 2)
        audio.setVolume(SaveGameManager.getSfxVolume())
        audio.loop = loop
        if (!audio.loop) audio.onEnded = () => parent.remove(audio)
        SoundManager.getSoundBuffer(sfxName).then((audioBuffer) => {
            audio.setBuffer(audioBuffer)
            parent.add(audio)
            if (autoPlay) audio.play() // TODO retry playing sound for looped ones, when audio context fails
        })
        return audio
    }

    setLightLevel(lightLevel: number) {
        this.ambientLight.intensity = 0.05 + Math.max(0, Math.min(1, lightLevel)) * 0.4
    }
}
