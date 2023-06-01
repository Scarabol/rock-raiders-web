import { Updatable } from '../model/Updateable'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'

export class LavaErosion implements Updatable {
    private erosionTimer: number = 0

    private readonly erodibleSurfaceTypes: SurfaceType[] = [
        SurfaceType.GROUND, SurfaceType.POWER_PATH, SurfaceType.POWER_PATH_BUILDING_SITE,
        SurfaceType.LAVA1, SurfaceType.LAVA2, SurfaceType.LAVA3, SurfaceType.LAVA4,
        SurfaceType.RUBBLE1, SurfaceType.RUBBLE2, SurfaceType.RUBBLE3, SurfaceType.RUBBLE4,
    ]

    constructor(
        readonly surface: Surface,
        private readonly erosionChance: number,
        private readonly erodeErodeTimeMs: number,
        private readonly erodeLockTimeMs: number,
    ) {
    }

    update(elapsedMs: number) {
        if (!this.surface.discovered || !this.erodibleSurfaceTypes.includes(this.surface.surfaceType) || !this.surface.neighbors.some((s) => s.surfaceType === SurfaceType.LAVA5)) return
        this.erosionTimer += elapsedMs
        while (this.erosionTimer > this.erodeErodeTimeMs + (this.surface.surfaceType === SurfaceType.POWER_PATH ? this.erodeLockTimeMs : 0)) {
            if (Math.random() * 10 < this.erosionChance) {
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
            }
            this.erosionTimer -= this.erodeErodeTimeMs
        }
    }
}
