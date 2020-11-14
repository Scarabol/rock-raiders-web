import { LWOLoader } from '../../../resource/LWOLoader';
import { ResourceManager } from '../../../resource/ResourceManager';
import { CollectableEntity, CollectableType } from './CollectableEntity';
import { Building } from '../../../game/model/entity/building/Building';

export class Ore extends CollectableEntity {

    constructor() {
        super();
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo');
        const mesh = new LWOLoader('MiscAnims/Ore/').parse(resource);
        this.group.add(mesh);
    }

    getTargetBuildingTypes(): Building[] {
        return [Building.REFINERY, Building.TOOLSTATION];
    }

    getCollectableType(): CollectableType {
        return CollectableType.ORE;
    }

    onDiscover() {
        super.onDiscover();
        console.log('Ore has been discovered');
    }

}