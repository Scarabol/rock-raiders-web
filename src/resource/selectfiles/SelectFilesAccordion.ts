export class SelectFilesAccordion {
    readonly root: HTMLElement
    lastIndex: number = 0

    constructor() {
        this.root = document.createElement('div')
        this.root.classList.add('select-files-accordion')
    }

    addOption(labelHTML: string, panel: HTMLElement) {
        const option = this.root.appendChild(document.createElement('div'))
        option.classList.add('select-files-accordion-option')
        const input = option.appendChild(document.createElement('input'))
        input.type = 'radio'
        input.name = 'select-files-accordion'
        input.id = `select-files-accordion-option-${this.lastIndex}`
        input.checked = this.lastIndex === 0
        input.style.display = 'none'
        const label = option.appendChild(document.createElement('label'))
        label.htmlFor = input.id
        label.innerHTML = labelHTML
        panel.classList.add('select-files-accordion-panel')
        option.appendChild(panel)
        this.lastIndex++
    }
}
