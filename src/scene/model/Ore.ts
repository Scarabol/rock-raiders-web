import { BaseEntity } from './BaseEntity';
import { LWOLoader } from '../../resource/LWOLoader';
import { ResourceManager } from '../../resource/ResourceManager';

export class Ore extends BaseEntity { // TODO implements collectable/carryable

    constructor() {
        super();
        const resource = ResourceManager.getResource('MiscAnims/Ore/Ore1st.lwo');
        const mesh = new LWOLoader('MiscAnims/Ore/').parse(resource);
        this.group.add(mesh);
        this.loadTextures();
    }

}