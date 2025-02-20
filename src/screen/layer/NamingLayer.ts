import { ScaledLayer } from './ScaledLayer'
import { AbstractLayer } from './AbstractLayer'
import { EventBroker } from '../../event/EventBroker'
import { BaseEvent } from '../../event/EventTypeMap'
import { EventKey } from '../../event/EventKeyEnum'
import { GameScreen } from '../GameScreen'
import { HideTooltip } from '../../event/GuiCommand'
import { BitmapFontData } from '../../core/BitmapFont'
import { GameState } from '../../game/model/GameState'
import { PositionComponent } from '../../game/component/PositionComponent'
import { Vector3 } from 'three'
import { GameEntity } from '../../game/ECS'
import { SelectionNameComponent } from '../../game/component/SelectionNameComponent'
import { GameConfig } from '../../cfg/GameConfig'
import { EntityType } from '../../game/model/EntityType'

export class NamingLayer extends ScaledLayer {
    readonly visibleLayers: AbstractLayer[] = []
    showBackdrop: boolean = false
    raiderName: string = ''
    firstKey: boolean = true
    raiderOnScreen = {x: 0, y: 0}

    constructor(readonly gameScreen: GameScreen) {
        super()
        this.animationFrame.onRedraw = (context) => this.onRedraw(context)
        this.addEventListener('keyup', (event: KeyboardEvent): boolean => {
            if (event.key === 'Enter') {
                return this.onEnterKeyUp()
            } else if (this.showBackdrop && event.key === 'Backspace') {
                if (this.firstKey) {
                    this.firstKey = false
                    this.raiderName = ''
                } else {
                    this.raiderName = this.raiderName.slice(0, -1)
                }
                this.animationFrame.notifyRedraw()
                return true
            }
            return false
        })
        this.addEventListener('keypress', (event: KeyboardEvent): boolean => {
            return this.onKeyPress(event)
        })
    }

    private onRedraw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        context.clearRect(0, 0, this.fixedWidth, this.fixedHeight)
        if (!this.showBackdrop) return
        context.fillStyle = 'rgba(0, 0, 0, 0.25)'
        context.fillRect(0, 0, this.fixedWidth, this.fixedHeight)
        context.textAlign = 'left'
        context.font = 'bold 8px sans-serif'
        context.fillStyle = '#fff'
        const label = this.firstKey ? this.raiderName : `"${this.raiderName}"`
        context.fillText(label, this.raiderOnScreen.x, this.raiderOnScreen.y)
    }

    private onEnterKeyUp(): boolean {
        const selectedRaider = this.gameScreen.worldMgr.entityMgr.selection.hasOnlyOneRaider()
        if (!selectedRaider) return false
        const raiderSaveGame = GameState.raiderSaveGameMap.get(selectedRaider)
        if (!raiderSaveGame) return false
        this.showBackdrop = !this.showBackdrop
        EventBroker.publish(new BaseEvent(this.showBackdrop ? EventKey.PAUSE_GAME : EventKey.UNPAUSE_GAME))
        if (this.showBackdrop) {
            this.raiderName = raiderSaveGame.name || GameConfig.instance.objectNamesCfg.get(EntityType.PILOT) || 'Rock Raider'
            this.firstKey = true
            this.visibleLayers.length = 0
            this.gameScreen.screenMaster.layers.forEach((l) => {
                if (l !== this && l.active) {
                    this.visibleLayers.push(l)
                    l.active = false
                }
            })
            this.gameScreen.worldMgr.ecs.getComponents(selectedRaider).get(SelectionNameComponent)?.setVisible(false)
            this.raiderOnScreen = this.raiderToScreenPos(selectedRaider)
        } else {
            raiderSaveGame.name = this.raiderName || raiderSaveGame.name || ''
            const selectionNameComponent = this.gameScreen.worldMgr.ecs.getComponents(selectedRaider).get(SelectionNameComponent)
            selectionNameComponent?.setName(raiderSaveGame.name)
            selectionNameComponent?.setVisible(true)
            this.visibleLayers.forEach((l) => l.active = true)
        }
        this.animationFrame.notifyRedraw()
        EventBroker.publish(new HideTooltip())
        this.gameScreen.guiTopRightLayer.panelMain.selectRaiderPanel.toggleState()
        return true
    }

    private raiderToScreenPos(raider: GameEntity): { x: number, y: number } {
        const projected: Vector3 = this.gameScreen.worldMgr.ecs.getComponents(raider).get(PositionComponent)
            .position.clone().add(new Vector3(0, 6, 0)).project(this.gameScreen.worldMgr.sceneMgr.cameraActive) || new Vector3()
        return {
            x: Math.max(this.fixedWidth * 0.1, Math.min(this.fixedWidth * 0.9, (projected.x + 1) * this.fixedWidth / 2)),
            y: Math.max(this.fixedHeight * 0.1, Math.min(this.fixedHeight * 0.85, -(projected.y - 1) * this.fixedHeight / 2)),
        }
    }

    private onKeyPress(event: KeyboardEvent): boolean {
        if (!this.showBackdrop) return false
        if (BitmapFontData.chars.includes(event.key)) {
            if (this.firstKey) {
                this.firstKey = false
                this.raiderName = event.key
            } else {
                this.raiderName += event.key
            }
            this.animationFrame.notifyRedraw()
            return true
        }
        return false
    }

    reset() {
        super.reset()
        this.showBackdrop = false
        this.raiderName = ''
        this.firstKey = true
        this.raiderOnScreen = {x: 0, y: 0}
    }
}
