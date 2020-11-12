import { BaseEntity } from './BaseEntity';
import { LWOLoader } from '../../resource/LWOLoader';
import { ResourceManager } from '../../resource/ResourceManager';
import { Collectable } from './Collectable';
import { Building } from '../../game/model/entity/building/Building';

export class Ore extends BaseEntity implements Collectable {

    constructor() {
        super();
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo');
        const mesh = new LWOLoader('MiscAnims/Ore/').parse(resource);
        this.group.add(mesh);
    }

    getTargetBuildingTypes(): Building[] {
        return [Building.REFINERY, Building.TOOLSTATION];
    }

}