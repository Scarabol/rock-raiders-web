import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class IconPanel extends Panel {

    subPanels: IconSubPanel[] = []
    mainPanel: IconSubPanel

    constructor() {
        super()
        this.relX = this.xOut = 640 - 16
        this.xIn = 640 + 95
        this.relY = this.yOut = this.yIn = 9
        this.movedIn = false
        this.mainPanel = this.addSubPanel(new IconSubPanel(4))
        this.mainPanel.relX = this.mainPanel.xOut
        this.mainPanel.relY = this.mainPanel.yOut
        this.mainPanel.movedIn = false
    }

    addSubPanel<T extends IconSubPanel>(childPanel: T): T {
        this.addChild(childPanel)
        this.subPanels.push(childPanel)
        return childPanel
    }

    selectSubPanel(targetPanel: IconSubPanel) {
        this.subPanels.forEach((subPanel) => subPanel !== targetPanel && subPanel.setMovedIn(true))
        targetPanel.setMovedIn(false)
    }

}

