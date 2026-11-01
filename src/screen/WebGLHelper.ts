import { WebGLRenderer } from 'three'

export class WebGLHelper {
    static checkAvailability(): boolean {
        if (typeof WebGL2RenderingContext === 'undefined') {
            this.showMessage(
                'WebGL 2 is not available',
                'This browser does not support WebGL 2, which the game requires. Please use a browser that supports WebGL 2.'
            )
            return false
        }

        let renderer: WebGLRenderer
        try {
            renderer = new WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true })
        } catch (error) {
            console.warn('Could not initialize the WebGL renderer', error)
            this.showMessage(
                'WebGL is disabled',
                'The game could not enable WebGL. Check your browser settings and enable WebGL or hardware acceleration, then reload the page.'
            )
            return false
        }
        renderer.dispose()
        return true
    }

    private static showMessage(title: string, message: string): void {
        const notice = document.createElement('section')
        notice.classList.add('webgl-error')
        notice.setAttribute('role', 'alert')
        notice.setAttribute('aria-live', 'assertive')
        notice.appendChild(document.createElement('h1')).innerText = title
        notice.appendChild(document.createElement('p')).innerText = message
        document.body.appendChild(notice)
    }
}
