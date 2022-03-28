import { OverlaySystem } from '../gui/OverlaySystem'

const worker: Worker = self as any
new OverlaySystem(worker)
