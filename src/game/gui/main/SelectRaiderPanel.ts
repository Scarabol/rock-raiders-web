import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectRaiderPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(10, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GoFeed')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UnLoadMinifigure')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_MinifigurePickUp')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GetTool')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DropBirdScarer')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeMan')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSkill')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoFirstPerson')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoSecondPerson')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteMan')
    }

}
