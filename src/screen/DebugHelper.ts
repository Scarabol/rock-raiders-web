import Stats from 'stats.js'

export class DebugHelper {
    static readonly element: HTMLElement = document.getElementById('game-canvas-container').appendChild(document.createElement('div'))
    static {
        DebugHelper.element.classList.add('game-debug-layer')
        DebugHelper.element.style.display = 'none'
    }

    readonly stats: Stats

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

    static intersectConsoleLogging() {
        const nativeLog = console.log
        const nativeWarn = console.warn
        const nativeError = console.error
        console.log = (message?: any, ...optionalParams: any[]): void => {
            nativeLog(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ffffff')
        }
        console.warn = (message?: any, ...optionalParams: any[]): void => {
            nativeWarn(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ffff00')
        }
        console.error = (message?: any, ...optionalParams: any[]) => {
            nativeError(message, ...optionalParams)
            this.addDebugMessage(message, optionalParams, '#ff0000')
        }
    }

    static addDebugMessage(message: any, optionalParams: any[], color: string) {
        try {
            const msg = DebugHelper.element.appendChild(document.createElement('DIV'))
            msg.innerText = message
            optionalParams.forEach((p) => msg.innerText += `\n${JSON.stringify(p)}`)
            msg.style.padding = '0.1em'
            msg.style.color = color
            DebugHelper.element.scrollTop = DebugHelper.element.scrollHeight
        } catch (e) {
            // do nothing to avoid circular calls
        }
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
