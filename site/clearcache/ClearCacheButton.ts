import { ASSET_CACHE_DB_NAME } from '../../src/params'
import './ClearCacheButton.css'

export class ClearCacheButton {
    rootElement: HTMLButtonElement

    constructor() {
        this.rootElement = document.getElementById('game-container').appendChild(document.createElement('button'))
        this.rootElement.classList.add('clear-cache-btn')
        this.rootElement.innerText = 'Clear asset cache and restart'
        this.rootElement.onclick = () => {
            indexedDB.deleteDatabase(ASSET_CACHE_DB_NAME)
            location.reload()
        }
    }

    hide() {
        this.rootElement.style.visibility = 'hidden'
    }
}
