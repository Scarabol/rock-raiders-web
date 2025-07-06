import { FileSelectComponent } from './FileSelectComponent'

export class SelectFilesForm {
    readonly root: HTMLElement

    constructor(btnText: string, fileNames: string[], onSubmit: (files: File[]) => Promise<void>) {
        this.root = document.createElement('form')
        this.root.classList.add('select-files-option')
        const fileSelectInputs = fileNames.map((fileName) => {
            const fileSelect = new FileSelectComponent(fileName)
            this.root.appendChild(fileSelect.label)
            return fileSelect.input
        })
        const btnStart = this.root.appendChild(document.createElement('button'))
        btnStart.innerText = btnText
        this.root.addEventListener('submit', async (e) => {
            try {
                e.preventDefault()
                btnStart.disabled = true
                const files = fileSelectInputs.flatMap((f) => Array.from(f.files ?? [])).filter((f) => !!f)
                await onSubmit(files)
            } finally {
                btnStart.disabled = false
            }
        })
    }
}
