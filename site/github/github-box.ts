import './github.css'
import GithubIcon from './github.png'

const rootElement = document.body.appendChild(document.createElement('div'))
rootElement.classList.add('github-box')

const link = rootElement.appendChild(document.createElement('a'))
link.href = 'https://github.com/scarabol/rock-raiders-web'

const img = link.appendChild(document.createElement('img'))
img.src = GithubIcon
img.classList.add('github-logo')
img.alt = 'Fork on GitHub'

const txt = link.appendChild(document.createElement('span'))
txt.textContent = img.alt
