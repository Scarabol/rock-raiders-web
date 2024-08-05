import './SelectFilesModal.css'
import { ZipFilesComponent } from './ZipFilesComponent'
import { WadFilesComponent } from './WadFilesComponent'
import { CabFilesComponent } from './CabFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'

export class SelectFilesModal {
    readonly rootElement: HTMLElement

    constructor(parent: HTMLElement, readonly onFilesLoaded: (vfs: VirtualFileSystem) => void) {
        this.rootElement = parent.appendChild(document.createElement('div'))
        this.rootElement.classList.add('select-files-modal')
        this.rootElement.style.visibility = 'hidden'
        const heading = this.rootElement.appendChild(document.createElement('h5'))
        heading.classList.add('select-files-heading')
        heading.innerText = 'Rock Raiders Web'
        const content = this.rootElement.appendChild(document.createElement('div'))
        content.classList.add('select-files-content')
        const hints = content.appendChild(document.createElement('div'))
        hints.appendChild(document.createElement('b')).innerText = 'Game resources not included!'
        hints.appendChild(document.createElement('div')).innerText = 'Provide game resources to start using one option below.'
        const optionList = content.appendChild(document.createElement('ol'))
        ;[
            new ZipFilesComponent(),
            new WadFilesComponent(),
            new CabFilesComponent(),
        ].forEach((c) => {
            const option = optionList.appendChild(document.createElement('li'))
            c.onFilesLoaded = this.onFilesLoaded.bind(this)
            option.appendChild(c.element)
        })
    }

    show(): void {
        this.rootElement.style.visibility = 'visible'
    }

    hide(): void {
        this.rootElement.style.visibility = 'hidden'
    }
}
