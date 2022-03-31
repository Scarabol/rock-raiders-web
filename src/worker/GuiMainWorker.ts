import { GuiMainSystem } from '../gui/GuiMainSystem'
import { TypedWorkerThreaded } from './TypedWorker'

const worker: Worker = self as any
new GuiMainSystem(new TypedWorkerThreaded(worker))
