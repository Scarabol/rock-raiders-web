import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'

export class BuildingPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(10, onBackPanel)
        this.addMenuItem('InterfaceBuildImages', 'Toolstation')
        this.addMenuItem('InterfaceBuildImages', 'TeleportPad')
        this.addMenuItem('InterfaceBuildImages', 'Docks')
        this.addMenuItem('InterfaceBuildImages', 'Powerstation')
        this.addMenuItem('InterfaceBuildImages', 'Barracks')
        this.addMenuItem('InterfaceBuildImages', 'Upgrade')
        this.addMenuItem('InterfaceBuildImages', 'Geo-dome')
        this.addMenuItem('InterfaceBuildImages', 'OreRefinery')
        this.addMenuItem('InterfaceBuildImages', 'Gunstation')
        this.addMenuItem('InterfaceBuildImages', 'TeleportBIG')
    }

}
