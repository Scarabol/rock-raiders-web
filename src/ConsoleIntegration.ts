// noinspection JSUnusedGlobalSymbols

import { SaveGameManager, SaveGamePreferences } from './resource/SaveGameManager'
import { NerpRunner } from './nerp/NerpRunner'
import { GameConfig } from './cfg/GameConfig'

export class ConsoleIntegration {
    _preferences: SaveGamePreferences = SaveGameManager.preferences
    config: GameConfig = GameConfig.instance

    nerpDebugToggle(): boolean {
        NerpRunner.debug = !NerpRunner.debug
        return NerpRunner.debug
    }

    resetPreferences() {
        SaveGameManager.resetPreferences()
    }

    get preferences(): SaveGamePreferences {
        return this._preferences
    }

    set preferences(newPreferences: SaveGamePreferences) {
        this._preferences = this.createSetterCallbackProxy(newPreferences, (_prop, _newValue, _oldValue) => {
            SaveGameManager.savePreferences()
        })
    }

    protected createSetterCallbackProxy<T extends object>(target: T, onSet: (prop: keyof T, newValue: any, oldValue: any) => void): T {
        return new Proxy(target, {
            get(t, prop, receiver) {
                const value = Reflect.get(t, prop, receiver)
                if (typeof value === 'function') return value.bind(t) // If it's a function, bind to the original target to preserve `this`
                return value
            },
            set(t, prop, value, receiver) {
                const key = prop as keyof T
                const oldValue = (t as any)[key]
                const success = Reflect.set(t, prop, value, receiver)
                if (success) onSet(key, value, oldValue)
                return success
            }
        }) as T
    }
}
