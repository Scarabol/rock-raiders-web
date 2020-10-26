import { ScreenLayer } from '../../screen/ScreenLayer';
import { iGet } from '../../core/Util';
import { ResourceManager } from '../engine/ResourceManager';
import { AnimEntity } from '../model/entity/AnimEntity';
import { Vector3 } from 'three';
import { WorldManager } from '../engine/WorldManager';

export class GameLayer extends ScreenLayer {

    private worldManager: WorldManager;

    constructor() {
        super(false, false);
    }

    setWorldManager(worldManager: WorldManager) {
        this.worldManager = worldManager;
    }

    handlePointerEvent(eventType: string, event: PointerEvent): boolean {
        if (eventType === 'pointermove') {
            const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY);
            this.moveMouseTorch(cx, cy);
        }
        this.canvas.dispatchEvent(event);
        return true;
    }

    moveMouseTorch(screenX, screenY) {
        const rx = (screenX / this.canvas.width) * 2 - 1;
        const ry = -(screenY / this.canvas.height) * 2 + 1;
        this.worldManager.moveMouseTorch(rx, ry);
    }

    handleKeyEvent(eventType: string, event: KeyboardEvent) {
        const key = event.key;
        console.log('key pressed: ' + key);
        if (key === 't') {
            // TODO check max amount
            // look for unused toolstation/teleport
            const toolstations = this.worldManager.buildings['Toolstation'];
            // console.log(toolstations);
            // TODO check for powered/idling building
            const station = toolstations[0];
            // add raider with teleport animation
            const entityType = iGet(ResourceManager.entity, 'mini-figures/pilot/pilot.ae');
            const pilot = new AnimEntity(entityType);
            pilot.setActivity('TeleportIn', () => pilot.setActivity('Stand'));
            pilot.group.position.copy(station.group.position).add(new Vector3(0, 0, 20).applyEuler(station.group.rotation));
            pilot.group.rotation.copy(station.group.rotation);
            this.worldManager.sceneManager.scene.add(pilot.group);
            // TODO after add to available pilots
            // TODO default action: walk to building power path
            return true;
        }
        return false;
    }

    handleWheelEvent(eventType: string, event: WheelEvent): boolean {
        this.canvas.dispatchEvent(event);
        return true;
    }

}
