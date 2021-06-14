import { ASSET_CACHE_DB_NAME } from '../../src/params'
import './clearCacheButton.css'

export class ClearCacheButton {

    rootElement: HTMLDivElement

    constructor(parentId: string) {
        this.rootElement = document.getElementById(parentId).appendChild(document.createElement('div'))
        this.rootElement.classList.add('clear-cache-box')

        const button = this.rootElement.appendChild(document.createElement('button'))
        button.classList.add('btn', 'btn-info')
        button.innerText = 'Clear asset cache and restart'
        button.onclick = () => {
            indexedDB.deleteDatabase(ASSET_CACHE_DB_NAME)
            location.reload()
        }
    }

    hide() {
        this.rootElement.style.visibility = 'hidden'
    }

}
