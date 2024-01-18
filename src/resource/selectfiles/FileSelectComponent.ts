export class FileSelectComponent {
    readonly label: HTMLLabelElement
    readonly input: HTMLInputElement

    constructor(filename: string) {
        this.label = document.createElement('label')
        this.label.innerHTML = `Select <b>${filename}</b> here:`
        this.input = this.label.appendChild(document.createElement('input'))
        this.input.classList.add('select-files-input')
        this.input.type = 'file'
        this.input.required = true
        this.input.accept = `.${filename.split('.').last()}`
    }
}
