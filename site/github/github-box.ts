import GithubIcon from './github.png';
import './github.css';

const element = document.body.appendChild(document.createElement('div'));
element.classList.add('github-box');

const link = element.appendChild(document.createElement('a'));
link.href = 'https://github.com/scarabol/rock-raiders-web';

const img = link.appendChild(document.createElement('img'));
img.src = GithubIcon;
img.classList.add('github-logo');
img.alt = 'Fork on GitHub';

const txt = link.appendChild(document.createElement('span'));
txt.textContent = img.alt;
