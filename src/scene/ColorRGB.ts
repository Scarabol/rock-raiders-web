import { Color } from 'three'

export class ColorRGB extends Color {
    constructor(rgb: [number, number, number]) {
        const maxAmbRgb = Math.min(255, Math.max(0, ...rgb))
        const normalizedRgb = rgb.map(v => v / (maxAmbRgb ? maxAmbRgb : 1))
        super(normalizedRgb[0], normalizedRgb[1], normalizedRgb[2])
    }
}
