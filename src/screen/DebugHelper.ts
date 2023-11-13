import Stats from 'stats.js'

export class DebugHelper {
    stats: Stats

    constructor() {
        this.stats = new Stats()
        this.stats.showPanel(0) // 0: fps, 1: ms

        this.stats.dom.style.position = 'absolute'
        this.stats.dom.style.left = 'auto'
        this.stats.dom.style.top = '0'

        const parent = document.getElementsByClassName('mobile-helper-toolbar').item(0)
        parent?.insertBefore(this.stats.dom, parent.firstChild)
        this.hide()
    }

    show() {
        this.stats.dom.style.visibility = 'visible'
    }

    hide() {
        this.stats.dom.style.visibility = 'hidden'
    }

    renderStart() {
        this.stats.begin()
    }

    renderDone() {
        this.stats.end()
    }
}
