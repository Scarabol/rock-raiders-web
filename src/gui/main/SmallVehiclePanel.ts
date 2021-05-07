import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class SmallVehiclePanel extends IconSubPanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 6, onBackPanel)
        this.addMenuItem('InterfaceBuildImages', 'Hoverboard')
        this.addMenuItem('InterfaceBuildImages', 'SmallDigger')
        this.addMenuItem('InterfaceBuildImages', 'SmallTruck')
        this.addMenuItem('InterfaceBuildImages', 'SmallCat')
        this.addMenuItem('InterfaceBuildImages', 'SmallMLP')
        this.addMenuItem('InterfaceBuildImages', 'SmallHeli')
    }

}
