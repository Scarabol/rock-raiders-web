import { EventKey } from '../../../event/EventKeyEnum'
import { CAMERA_VIEW_MODE, ChangeCameraEvent, DropBirdScarer, RaiderBeamUp, RaiderDrop, RaiderEat, RaiderUpgrade } from '../../../event/GuiCommand'
import { BuildingsChangedEvent, SelectionChanged } from '../../../event/LocalEvents'
import { EntityType } from '../../../game/model/EntityType'
import { Panel } from '../../base/Panel'
import { IconPanelButton } from '../IconPanelButton'
import { IconSubPanel } from '../IconSubPanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectRaiderPanel extends IconSubPanel {
    getToolItem: IconPanelButton
    trainItem: IconPanelButton

    someCarries: boolean = false
    everyHasMaxLevel: boolean = false
    hasToolstation: boolean = false
    hasBirdScarer: boolean = false

    constructor(onBackPanel: Panel) {
        super(10, onBackPanel, true)
        const feedItem = this.addMenuItem(GameConfig.instance.interfaceImages.goFeed)
        feedItem.isDisabled = () => false
        feedItem.onClick = () => this.publishEvent(new RaiderEat())
        const unloadItem = this.addMenuItem(GameConfig.instance.interfaceImages.unLoadMiniFigure)
        unloadItem.isDisabled = () => !this.someCarries
        unloadItem.onClick = () => this.publishEvent(new RaiderDrop())
        this.addMenuItem(GameConfig.instance.interfaceImages.miniFigurePickUp)
        this.getToolItem = this.addMenuItem(GameConfig.instance.interfaceImages.getTool)
        this.getToolItem.isDisabled = () => false
        const dropBirdScarer = this.addMenuItem(GameConfig.instance.interfaceImages.dropBirdScarer)
        dropBirdScarer.isDisabled = () => !this.hasBirdScarer
        dropBirdScarer.onClick = () => this.publishEvent(new DropBirdScarer())
        const upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages.upgradeMan)
        upgradeItem.isDisabled = () => this.everyHasMaxLevel || !this.hasToolstation
        upgradeItem.onClick = () => this.publishEvent(new RaiderUpgrade())
        this.trainItem = this.addMenuItem(GameConfig.instance.interfaceImages.trainSkill)
        this.trainItem.isDisabled = () => false
        const firstPersonView = this.addMenuItem(GameConfig.instance.interfaceImages.gotoFirstPerson)
        firstPersonView.isDisabled = () => false
        firstPersonView.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.fpv))
        const shoulderView = this.addMenuItem(GameConfig.instance.interfaceImages.gotoSecondPerson)
        shoulderView.isDisabled = () => false
        shoulderView.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.shoulder))
        const deleteRaiderItem = this.addMenuItem(GameConfig.instance.interfaceImages.deleteMan)
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
