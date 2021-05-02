import { Group, Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { BarrierLocation } from '../collect/BarrierLocation'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { Terrain } from '../map/Terrain'
import { BuildPlacementMarkerMesh } from './BuildPlacementMarkerMesh'

export class BuildPlacementMarker {

    static readonly buildingMarkerColor: number = 0x005000
    static readonly pathMarkerColor: number = 0x505000
    static readonly waterMarkerColor: number = 0x000050

    group: Group = new Group()
    markers: BuildPlacementMarkerMesh[] = []
    buildingMarkerPrimary: BuildPlacementMarkerMesh = null
    buildingMarkerSecondary: BuildPlacementMarkerMesh = null
    powerPathMarkerPrimary: BuildPlacementMarkerMesh = null
    powerPathMarkerSecondary: BuildPlacementMarkerMesh = null
    waterPathMarker: BuildPlacementMarkerMesh = null
    heading: number = 0
    sdx: number = 0
    sdz: number = 0
    lastCheck: boolean = false
    visibleSurfaces: Surface[] = []
    primarySurface: Surface = null
    secondarySurface: Surface = null
    waterSurface: Surface = null

    constructor() {
        this.buildingMarkerPrimary = new BuildPlacementMarkerMesh(BuildPlacementMarker.buildingMarkerColor)
        this.buildingMarkerSecondary = new BuildPlacementMarkerMesh(BuildPlacementMarker.buildingMarkerColor)
        this.powerPathMarkerPrimary = new BuildPlacementMarkerMesh(BuildPlacementMarker.pathMarkerColor)
        this.powerPathMarkerSecondary = new BuildPlacementMarkerMesh(BuildPlacementMarker.pathMarkerColor)
        this.waterPathMarker = new BuildPlacementMarkerMesh(BuildPlacementMarker.waterMarkerColor)
        this.addMarker(this.buildingMarkerPrimary)
        this.addMarker(this.buildingMarkerSecondary)
        this.addMarker(this.powerPathMarkerPrimary)
        this.addMarker(this.powerPathMarkerSecondary)
        this.addMarker(this.waterPathMarker)
    }

    private addMarker(marker: BuildPlacementMarkerMesh) {
        this.group.add(marker)
        this.markers.push(marker)
    }

    update(terrain: Terrain, worldPosition: Vector2) {
        if (!worldPosition || !GameState.buildModeSelection) {
            this.hideAllMarker()
        } else {
            const isValid = this.updateAllMarker(terrain, worldPosition)
            this.markers.forEach((c) => c.markAsValid(isValid))
        }
    }

    private updateAllMarker(terrain: Terrain, worldPosition: Vector2 = null): boolean {
        // TODO use surface height offsets, refactor terrain map/data handling before
        const buildMode = GameState.buildModeSelection
        this.buildingMarkerPrimary.visible = true
        this.buildingMarkerPrimary.position.copy(terrain.worldMgr.getFloorPosition(new Vector2(Math.floor(worldPosition.x / TILESIZE) * TILESIZE, Math.floor(worldPosition.y / TILESIZE) * TILESIZE)))
        const sdxv = worldPosition.x - this.buildingMarkerPrimary.position.x - TILESIZE / 2
        const sdzv = worldPosition.y - this.buildingMarkerPrimary.position.z - TILESIZE / 2
        const sdx = Math.abs(sdxv) > Math.abs(sdzv) ? Math.sign(sdxv) : 0
        const sdz = Math.abs(sdzv) > Math.abs(sdxv) ? Math.sign(sdzv) : 0
        if (this.sdx === sdx && this.sdz === sdz) return this.lastCheck
        this.sdx = sdx
        this.sdz = sdz
        this.heading = Math.atan2(sdz, sdx)
        this.buildingMarkerSecondary.updateState(buildMode.secondaryBuildingPart, this.heading, this.buildingMarkerPrimary.position)
        this.powerPathMarkerPrimary.updateState(buildMode.primaryPowerPath, this.heading, this.buildingMarkerPrimary.position)
        this.powerPathMarkerSecondary.updateState(buildMode.secondaryPowerPath, this.heading, this.buildingMarkerPrimary.position)
        this.waterPathMarker.updateState(buildMode.waterPathSurface, this.heading, this.buildingMarkerPrimary.position)
        this.visibleSurfaces = [this.buildingMarkerPrimary, this.buildingMarkerSecondary, this.powerPathMarkerPrimary, this.powerPathMarkerSecondary]
            .filter((c) => c.visible).map((c) => terrain.getSurfaceFromWorld(c.position))
        this.primarySurface = this.visibleSurfaces[0]
        this.secondarySurface = this.buildingMarkerSecondary.visible ? this.visibleSurfaces[1] : null
        this.waterSurface = this.waterPathMarker.visible ? terrain.getSurfaceFromWorld(this.waterPathMarker.position) : null
        this.lastCheck = this.visibleSurfaces.every((s) => s.surfaceType === SurfaceType.GROUND)
            && ([this.powerPathMarkerPrimary, this.powerPathMarkerSecondary]
                    .some((c) => c.visible && terrain.getSurfaceFromWorld(c.position).neighbors
                        .some((n) => n.surfaceType === SurfaceType.POWER_PATH)) ||
                !buildMode.primaryPowerPath && this.primarySurface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH))
            && (!this.waterPathMarker.visible || this.waterSurface.surfaceType === SurfaceType.WATER)
        return this.lastCheck
    }

    hideAllMarker() {
        this.markers.forEach((m) => m.visible = false)
        this.lastCheck = false
    }

    getBarrierLocations(): BarrierLocation[] {
        const barrierLocations: BarrierLocation[] = []
        const center = this.primarySurface.getCenterWorld2D()
        const barrierOffset = TILESIZE * 9 / 20
        if (this.secondarySurface) {
            const secondary = this.secondarySurface.getCenterWorld2D()
            const dx = Math.sign(secondary.x - center.x)
            const dy = Math.sign(secondary.y - center.y)
            if (dx !== 0) {
                barrierLocations.push(new BarrierLocation(new Vector2(center.x - dx * barrierOffset, center.y), center))
                barrierLocations.push(new BarrierLocation(new Vector2(center.x, center.y - barrierOffset), center))
                barrierLocations.push(new BarrierLocation(new Vector2(center.x, center.y + barrierOffset), center))
                barrierLocations.push(new BarrierLocation(new Vector2(secondary.x + dx * barrierOffset, center.y), secondary))
                barrierLocations.push(new BarrierLocation(new Vector2(secondary.x, secondary.y - barrierOffset), secondary))
                barrierLocations.push(new BarrierLocation(new Vector2(secondary.x, secondary.y + barrierOffset), secondary))
            } else {
                barrierLocations.push(new BarrierLocation(new Vector2(center.x, center.y - dy * barrierOffset), center))
                barrierLocations.push(new BarrierLocation(new Vector2(center.x - barrierOffset, center.y), center))
                barrierLocations.push(new BarrierLocation(new Vector2(center.x + barrierOffset, center.y), center))
                barrierLocations.push(new BarrierLocation(new Vector2(secondary.x, secondary.y + dy * barrierOffset), secondary))
                barrierLocations.push(new BarrierLocation(new Vector2(secondary.x - barrierOffset, center.y), secondary))
                barrierLocations.push(new BarrierLocation(new Vector2(secondary.x + barrierOffset, center.y), secondary))
            }
        } else {
            barrierLocations.push(new BarrierLocation(new Vector2(center.x - barrierOffset, center.y), center))
            barrierLocations.push(new BarrierLocation(new Vector2(center.x, center.y - barrierOffset), center))
            barrierLocations.push(new BarrierLocation(new Vector2(center.x + barrierOffset, center.y), center))
            barrierLocations.push(new BarrierLocation(new Vector2(center.x, center.y + barrierOffset), center))
        }
        return barrierLocations
    }

}
