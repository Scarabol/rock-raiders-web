import { AbstractGameComponent } from '../ECS'
import { Surface } from '../terrain/Surface'
import { SurfaceType } from '../terrain/SurfaceType'
import { ResourceManager } from '../../resource/ResourceManager'

export class LavaErosionComponent extends AbstractGameComponent {
    readonly isSelfEroding: boolean = false
    erosionTimer: number = 0

    constructor(readonly surface: Surface, readonly erosionLevel: number) {
        super()
        this.isSelfEroding = this.erosionLevel % 2 === 0
    }

    increaseErosionLevel() {
        if (Math.random() * 10 >= this.erosionLevel) return
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
        const lwsFilename = [
            ResourceManager.configuration.miscObjects.LavaErosionSmoke1,
            ResourceManager.configuration.miscObjects.LavaErosionSmoke2,
            ResourceManager.configuration.miscObjects.LavaErosionSmoke3,
            ResourceManager.configuration.miscObjects.LavaErosionSmoke4,
        ].random()
        const smoke = this.surface.worldMgr.sceneMgr.addMiscAnim(lwsFilename, this.surface.getCenterWorld(), Math.random() * 2 * Math.PI, false)
        smoke.meshList.forEach((m) => m.getMaterials().forEach((m) => m.color.setRGB(1, 0.5, 0)))
    }
}
