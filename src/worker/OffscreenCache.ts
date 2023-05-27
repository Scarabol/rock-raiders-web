import { ResourceCache } from '../resource/ResourceCache'
import { SaveGamePreferences } from '../resource/SaveGameManager'

export class OffscreenCache extends ResourceCache {
    static offscreenPreferences: SaveGamePreferences
}
