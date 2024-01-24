import { EventKey } from '../../../event/EventKeyEnum'
import { DropBirdScarer, RaiderBeamUp, RaiderDrop, RaiderEat, RaiderUpgrade } from '../../../event/GuiCommand'
import { BuildingsChangedEvent, CameraViewMode, ChangeCameraEvent, SelectionChanged } from '../../../event/LocalEvents'
import { EntityType } from '../../../game/model/EntityType'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { IconPanelButton } from '../IconPanelButton'
import { SelectBasePanel } from './SelectBasePanel'
import { ResourceManager } from '../../../resource/ResourceManager'

export class SelectRaiderPanel extends SelectBasePanel {
    getToolItem: IconPanelButton
    trainItem: IconPanelButton

    someCarries: boolean = false
    everyHasMaxLevel: boolean = false
    hasToolstation: boolean = false
    hasBirdScarer: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        const feedItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GoFeed')
        feedItem.isDisabled = () => false
        feedItem.onClick = () => this.publishEvent(new RaiderEat())
        const unloadItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_UnLoadMinifigure')
        unloadItem.isDisabled = () => !this.someCarries
        unloadItem.onClick = () => this.publishEvent(new RaiderDrop())
        this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_MinifigurePickUp')
        this.getToolItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GetTool')
        this.getToolItem.isDisabled = () => false
        const dropBirdScarer = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_DropBirdScarer')
        dropBirdScarer.isDisabled = () => !this.hasBirdScarer
        dropBirdScarer.onClick = () => this.publishEvent(new DropBirdScarer())
        const upgradeItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_UpgradeMan')
        upgradeItem.isDisabled = () => this.everyHasMaxLevel || !this.hasToolstation
        upgradeItem.onClick = () => this.publishEvent(new RaiderUpgrade())
        this.trainItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_TrainSkill')
        this.trainItem.isDisabled = () => false
        const firstPersonView = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GotoFirstPerson')
        firstPersonView.isDisabled = () => false
        firstPersonView.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.FPV))
        const shoulderView = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_GotoSecondPerson')
        shoulderView.isDisabled = () => false
        shoulderView.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.SHOULDER))
        const deleteRaiderItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_DeleteMan')
        deleteRaiderItem.isDisabled = () => false
        deleteRaiderItem.onClick = () => this.publishEvent(new RaiderBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.someCarries = event.someCarries
            this.everyHasMaxLevel = event.everyHasMaxLevel
            this.hasBirdScarer = event.someHasBirdScarer
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.hasToolstation = BuildingsChangedEvent.hasUsable(event, EntityType.TOOLSTATION)
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.someCarries = false
        this.everyHasMaxLevel = false
        this.hasToolstation = false
        this.hasBirdScarer = false
    }
}
