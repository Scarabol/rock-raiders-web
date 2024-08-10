import { AbstractGameComponent } from '../ECS'
import { Surface } from '../terrain/Surface'
import { SurfaceType } from '../terrain/SurfaceType'
import { GameConfig } from '../../cfg/GameConfig'

export class LavaErosionComponent extends AbstractGameComponent {
    readonly erosionTimeMultiplier: number
    readonly isSelfEroding: boolean
    erosionTimer: number = 0

    constructor(readonly surface: Surface, readonly erosionLevel: number) {
        super()
        this.erosionTimeMultiplier = 6 - Math.floor((erosionLevel + 1) / 2)
        this.isSelfEroding = this.erosionLevel % 2 === 0
    }

    canStartNewErosion(): boolean {
        return this.isSelfEroding || this.surface.neighbors.some((s) => s.surfaceType === SurfaceType.LAVA5)
    }

    increaseErosionLevel(addSmokeEffect: boolean) {
        if (!this.surface.surfaceType.floor || !this.surface.discovered) return
        let erosionSurfaceType: SurfaceType = SurfaceType.LAVA1
        if (this.surface.surfaceType === SurfaceType.LAVA1) erosionSurfaceType = SurfaceType.LAVA2
        else if (this.surface.surfaceType === SurfaceType.LAVA2) erosionSurfaceType = SurfaceType.LAVA3
        else if (this.surface.surfaceType === SurfaceType.LAVA3) erosionSurfaceType = SurfaceType.LAVA4
        else if (this.surface.surfaceType === SurfaceType.LAVA4) erosionSurfaceType = SurfaceType.LAVA5
        else {
            this.surface.rubblePositions.length = 0
            this.surface.containedOres = 0
            this.surface.containedCrystals = 0
        }
        this.surface.setSurfaceType(erosionSurfaceType)
        if (addSmokeEffect) {
            const lwsFilename = Array.random([
                GameConfig.instance.miscObjects.LavaErosionSmoke1,
                GameConfig.instance.miscObjects.LavaErosionSmoke2,
                GameConfig.instance.miscObjects.LavaErosionSmoke3,
                GameConfig.instance.miscObjects.LavaErosionSmoke4,
            ])
            const smoke = this.surface.worldMgr.sceneMgr.addMiscAnim(lwsFilename, this.surface.getCenterWorld(), Math.random() * 2 * Math.PI, false)
            smoke.meshList.forEach((m) => m.getMaterials().forEach((m) => m.color.setRGB(1, 0.5, 0)))
        }
    }
}
