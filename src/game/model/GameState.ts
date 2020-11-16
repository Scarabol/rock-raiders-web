import { BuildingEntity } from '../../scene/model/BuildingEntity';
import { Building } from './entity/building/Building';
import { Selectable, SelectionType } from './Selectable';
import { Raider } from '../../scene/model/Raider';
import { VehicleEntity } from '../../scene/model/VehicleEntity';
import { CollectableEntity } from '../../scene/model/collect/CollectableEntity';
import { Vector3 } from 'three';
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, TILESIZE } from '../../main';
import { Surface } from '../../scene/model/map/Surface';
import { BaseEntity } from '../../scene/model/BaseEntity';
import { EventBus } from '../../event/EventBus';
import { EntityDeselected } from '../../event/LocalEvents';

export class GameState {

    static numOre: number = 0;
    static numCrystal: number = 0;
    static usedCrystals: number = 0;
    static neededCrystals: number = 0;
    static airlevel: number = 1; // airlevel in percent from 0 to 1.0
    static selectedEntities: Selectable[] = [];
    static selectionType: SelectionType = null;
    static buildings: BuildingEntity[] = [];
    static buildingsUndiscovered: BuildingEntity[] = [];
    static raiders: Raider[] = [];
    static raidersUndiscovered: Raider[] = [];
    static requestedRaiders: number = 0;
    static vehicles: VehicleEntity[] = [];
    static vehiclesUndiscovered: VehicleEntity[] = [];
    static collectables: CollectableEntity[] = [];
    static collectablesUndiscovered: CollectableEntity[] = [];

    static reset() {
        this.numOre = 0;
        this.numCrystal = 0;
        this.usedCrystals = 0;
        this.neededCrystals = 0;
        this.airlevel = 1;
        this.selectedEntities = [];
        this.selectionType = null;
        this.buildings = [];
        this.buildingsUndiscovered = [];
        this.raiders = [];
        this.raidersUndiscovered = [];
        this.requestedRaiders = 0;
        this.vehicles = [];
        this.vehiclesUndiscovered = [];
        this.collectables = [];
        this.collectablesUndiscovered = [];
    }

    static getBuildingsByType(...buildingTypes: Building[]): BuildingEntity[] {
        const matches = [];
        for (let c = 0; c < buildingTypes.length; c++) {
            matches.push(...this.buildings.filter((b) => b.type === buildingTypes[c]));
        }
        return matches;
    }

    static getClosestBuildingByType(position: Vector3, ...buildingTypes: Building[]): BuildingEntity {
        const targetBuildings = GameState.getBuildingsByType(...buildingTypes);
        let closest = null, minDist = null;
        targetBuildings.forEach((b) => {
            const bPos = b.getDropPosition();
            const dist = new Vector3().copy(position).sub(bPos).lengthSq();
            if (closest === null || dist < minDist) {
                closest = b;
                minDist = dist;
            }
        });
        return closest;
    }

    static selectEntities(entities: Selectable[]) {
        // deselect and remove entities that are not selected anymore
        this.selectedEntities.filter((e) => entities.indexOf(e) === -1).forEach((e) => e.deselect());
        this.selectedEntities = this.selectedEntities.filter((e) => entities.indexOf(e) !== -1);
        // add and select new entities (if they are selectable)
        this.selectedEntities.push(...(entities.filter((e) => e.select())));
        // determine and set next selection type
        const len = this.selectedEntities.length;
        if (len > 1) {
            this.selectionType = SelectionType.GROUP;
        } else if (len === 1) {
            this.selectionType = this.selectedEntities[0].getSelectionType();
        } else if (this.selectionType !== null) {
            this.selectionType = null;
            EventBus.publishEvent(new EntityDeselected());
        }
    }

    static getMaxRaiders(): number {
        return MAX_RAIDER_BASE + this.getBuildingsByType(Building.SUPPORT).length * ADDITIONAL_RAIDER_PER_SUPPORT;
    }

    static discoverSurface(surface: Surface) {
        const minX = surface.x * TILESIZE, minZ = surface.y * TILESIZE;
        const maxX = minX + TILESIZE, maxZ = minZ + TILESIZE;
        this.discoverEntities(this.raidersUndiscovered, minX, maxX, minZ, maxZ);
        this.discoverEntities(this.buildingsUndiscovered, minX, maxX, minZ, maxZ);
        this.discoverEntities(this.vehiclesUndiscovered, minX, maxX, minZ, maxZ);
        this.discoverEntities(this.collectablesUndiscovered, minX, maxX, minZ, maxZ);
    }

    static discoverEntities(undiscovered: BaseEntity[], minX, maxX, minZ, maxZ) {
        const discovered = [];
        undiscovered.forEach((e) => {
            const pos = e.getPosition();
            if (pos.x >= minX && pos.x < maxX && pos.z >= minZ && pos.z < maxZ) {
                e.onDiscover();
                discovered.push(e);
            }
        });
        discovered.forEach((r) => {
            const index = undiscovered.indexOf(r);
            if (index !== -1) undiscovered.splice(index, 1);
        });
    }

}
