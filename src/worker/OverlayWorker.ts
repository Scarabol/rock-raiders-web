import { OverlaySystem } from '../gui/OverlaySystem'
import { OffscreenWorkerBackend } from './OffscreenWorker'

const worker: Worker = self as any
new OverlaySystem(new OffscreenWorkerBackend(worker))
