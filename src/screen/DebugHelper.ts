import Stats from 'stats.js'

export class DebugHelper {
    stats

    constructor() {
        this.stats = new Stats()
        this.stats.setMode(0) // 0: fps, 1: ms

        this.stats.domElement.style.position = 'absolute'
        this.stats.domElement.style.left = 'auto'
        this.stats.domElement.style.top = '0'

        const parent = document.getElementsByClassName('mobile-helper-toolbar').item(0)
        parent?.insertBefore(this.stats.domElement, parent.firstChild)
        this.hide()
    }

    show() {
        this.stats.domElement.style.visibility = 'visible'
    }

    hide() {
        this.stats.domElement.style.visibility = 'hidden'
    }

    renderStart() {
        this.stats.begin()
    }

    renderDone() {
        this.stats.end()
    }
}
