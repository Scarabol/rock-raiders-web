import { OverlaySystem } from '../gui/OverlaySystem'
import { TypedWorkerThreaded } from './TypedWorker'

const worker: Worker = self as any
new OverlaySystem(new TypedWorkerThreaded(worker))
