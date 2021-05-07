import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { EatJob } from '../../game/model/job/EatJob'
import { UpgradeJob } from '../../game/model/job/UpgradeJob'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectRaiderPanel extends SelectBasePanel {

    getToolItem: IconPanelButton
    trainItem: IconPanelButton

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        const feedItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GoFeed')
        feedItem.isDisabled = () => false
        feedItem.onClick = () => {
            GameState.selectedRaiders.forEach((r) => !r.isDriving() && r.setJob(new EatJob()))
            this.publishEvent(new EntityDeselected())
        }
        const unloadItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UnLoadMinifigure')
        unloadItem.isDisabled = () => !GameState.selectedRaiders?.some((r) => r.carries !== null)
        unloadItem.onClick = () => GameState.selectedRaiders?.forEach((r) => r.dropItem())
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_MinifigurePickUp')
        this.getToolItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GetTool')
        this.getToolItem.isDisabled = () => false
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DropBirdScarer')
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeMan')
        upgradeItem.isDisabled = () => GameState.selectedRaiders.every((r) => r.level >= r.stats.Levels) || !GameState.hasOneBuildingOf(EntityType.TOOLSTATION)
        upgradeItem.onClick = () => {
            GameState.selectedRaiders.forEach((r) => {
                const closestToolstation = GameState.getClosestBuildingByType(r.getPosition(), EntityType.TOOLSTATION)
                if (closestToolstation && r.level < r.stats.Levels) {
                    r.setJob(new UpgradeJob(closestToolstation))
                }
            })
            this.publishEvent(new EntityDeselected())
        }
        this.trainItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSkill')
        this.trainItem.isDisabled = () => false
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoFirstPerson')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoSecondPerson')
        const deleteRaiderItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteMan')
        deleteRaiderItem.isDisabled = () => false
        deleteRaiderItem.onClick = () => GameState.selectedRaiders.forEach((r) => r.beamUp())
        this.registerEventListener(EventKey.ENTITY_ADDED, () => this.iconPanelButtons.forEach((b) => b.updateState()))
        this.registerEventListener(EventKey.SELECTED_RAIDER, () => this.iconPanelButtons.forEach((b) => b.updateState()))
        this.registerEventListener(EventKey.DESELECTED_ENTITY, () => this.iconPanelButtons.forEach((b) => b.updateState()))
    }

}
