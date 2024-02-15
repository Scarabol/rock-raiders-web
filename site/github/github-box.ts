import './github.css'
import GithubIcon from './github.png'

export class GithubBox {
    rootElement: HTMLDivElement

    constructor() {
        this.rootElement = document.getElementById('game-container').appendChild(document.createElement('div'))
        this.rootElement.classList.add('github-box')

        const link = this.rootElement.appendChild(document.createElement('a'))
        link.href = 'https://github.com/scarabol/rock-raiders-web'

        const img = link.appendChild(document.createElement('img'))
        img.src = GithubIcon
        img.classList.add('github-logo')
        img.alt = 'Fork on GitHub'

        const txt = link.appendChild(document.createElement('span'))
        txt.textContent = img.alt
    }

    hide() {
        this.rootElement.style.visibility = 'hidden'
    }
}
