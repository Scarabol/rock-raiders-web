import { GuiMainSystem } from '../gui/GuiMainSystem'

const worker: Worker = self as any
new GuiMainSystem(worker)
