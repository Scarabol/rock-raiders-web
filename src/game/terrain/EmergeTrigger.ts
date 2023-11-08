import { Surface } from './Surface'

export class EmergeTrigger {
    emergeDelayMs: number = 0

    constructor(readonly triggerSurface: Surface, readonly emergeSpawnId: number) {
    }
}
