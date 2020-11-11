import { BaseEntity } from './BaseEntity';
import { LWOLoader } from '../../resource/LWOLoader';
import { ResourceManager } from '../../resource/ResourceManager';
import { Collectable, CollectableType } from './Collectable';

export class Ore extends BaseEntity implements Collectable {

    constructor() {
        super();
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo');
        const mesh = new LWOLoader('MiscAnims/Ore/').parse(resource);
        this.group.add(mesh);
        this.loadTextures();
    }

    getCollectableType(): CollectableType {
        return CollectableType.ORE;
    }

}