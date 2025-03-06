import { SaveGameManager, SaveGamePreferences } from './resource/SaveGameManager'
import { NerpRunner } from './nerp/NerpRunner'
import { GameConfig } from './cfg/GameConfig'

// noinspection JSUnusedGlobalSymbols
export class ConsoleIntegration {
    preferences: SaveGamePreferences = SaveGameManager.preferences
    config: GameConfig = GameConfig.instance

    nerpDebugToggle(): boolean {
        NerpRunner.debug = !NerpRunner.debug
        return NerpRunner.debug
    }

    savePreferences(): void {
        SaveGameManager.savePreferences()
    }
}
