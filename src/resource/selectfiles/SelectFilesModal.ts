import './SelectFilesModal.css'
import { ZipFilesComponent } from './ZipFilesComponent'
import { WadFilesComponent } from './WadFilesComponent'
import { CabFilesComponent } from './CabFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'
import { IsoFilesComponent } from './IsoFilesComponent'

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
        hints.appendChild(document.createElement('div')).innerText = 'Select an option below to start:'
        const optionList = content.appendChild(document.createElement('div'))
        optionList.classList.add('select-files-accordion')
        ;[
            new ZipFilesComponent(),
            new IsoFilesComponent(),
            new WadFilesComponent(),
            new CabFilesComponent(),
        ].forEach((c, index) => {
            c.onFilesLoaded = this.onFilesLoaded.bind(this)
            this.addOption(optionList, c, index)
        })
    }

    private addOption(optionList: HTMLElement, c: { label: HTMLElement, panel: HTMLElement }, index: number) {
        const option = optionList.appendChild(document.createElement('div'))
        option.classList.add('select-files-accordion-option')
        const input = option.appendChild(document.createElement('input'))
        input.type = 'radio'
        input.name = 'select-files-accordion'
        input.id = `select-files-accordion-option-${index}`
        input.checked = index === 0
        input.style.display = 'none'
        const label = option.appendChild(document.createElement('label'))
        label.htmlFor = input.id
        label.appendChild(c.label)
        c.panel.classList.add('select-files-accordion-panel')
        option.appendChild(c.panel)
    }

    show(): void {
        this.rootElement.style.visibility = 'visible'
    }

    hide(): void {
        this.rootElement.style.visibility = 'hidden'
    }
}
