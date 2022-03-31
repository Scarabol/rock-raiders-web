import '../../core'
import { TypedWorkerThreaded } from '../../worker/TypedWorker'
import { WadSystem } from './WadSystem'

const worker: Worker = self as any
new WadSystem(new TypedWorkerThreaded(worker))
