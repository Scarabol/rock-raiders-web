import { AmbientLight, Color } from 'three'
import { GameConfig } from '../cfg/GameConfig'

export class LeveledAmbientLight extends AmbientLight {
    constructor() {
        const ambientRgb = GameConfig.instance.main.ambientRGB
        const maxAmbRgb = Math.min(255, Math.max(0, ...ambientRgb))
        const normalizedRgb = ambientRgb.map(v => v / (maxAmbRgb ? maxAmbRgb : 1))
        const ambientColor = new Color(normalizedRgb[0], normalizedRgb[1], normalizedRgb[2])
        super(ambientColor)
    }

    setLightLevel(lightLevel: number) {
        this.intensity = 0.05 + Math.max(0, Math.min(1, lightLevel)) * 0.45
    }
}
