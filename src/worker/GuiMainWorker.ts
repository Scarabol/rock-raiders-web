import { GuiMainSystem } from '../gui/GuiMainSystem'
import { OffscreenWorkerBackend } from './OffscreenWorker'

const worker: Worker = self as any
new GuiMainSystem(new OffscreenWorkerBackend(worker))
