import { EventKey } from '../../../event/EventKeyEnum'
import { RaiderBeamUp, RaiderDrop, RaiderEat, RaiderUpgrade } from '../../../event/GuiCommand'
import { BuildingsChangedEvent, SelectionChanged } from '../../../event/LocalEvents'
import { EntityType } from '../../../game/model/EntityType'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { IconPanelButton } from '../IconPanelButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectRaiderPanel extends SelectBasePanel {
    getToolItem: IconPanelButton
    trainItem: IconPanelButton

    someCarries: boolean = false
    everyHasMaxLevel: boolean = false
    numToolstations: number = 0

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        const feedItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GoFeed')
        feedItem.isDisabled = () => false
        feedItem.onClick = () => this.publishEvent(new RaiderEat())
        const unloadItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UnLoadMinifigure')
        unloadItem.isDisabled = () => !this.someCarries
        unloadItem.onClick = () => this.publishEvent(new RaiderDrop())
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_MinifigurePickUp')
        this.getToolItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GetTool')
        this.getToolItem.isDisabled = () => false
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DropBirdScarer')
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeMan')
        upgradeItem.isDisabled = () => this.everyHasMaxLevel || this.numToolstations < 1
        upgradeItem.onClick = () => this.publishEvent(new RaiderUpgrade())
        this.trainItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSkill')
        this.trainItem.isDisabled = () => false
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoFirstPerson')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoSecondPerson')
        const deleteRaiderItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteMan')
        deleteRaiderItem.isDisabled = () => false
        deleteRaiderItem.onClick = () => this.publishEvent(new RaiderBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.someCarries = event.someCarries
            this.everyHasMaxLevel = event.everyHasMaxLevel
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.numToolstations = BuildingsChangedEvent.countUsable(event, EntityType.TOOLSTATION)
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.someCarries = false
        this.everyHasMaxLevel = false
        this.numToolstations = 0
    }
}
