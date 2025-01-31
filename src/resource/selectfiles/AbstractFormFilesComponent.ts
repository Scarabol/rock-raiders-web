import { SelectFilesComponent } from './SelectFilesComponent'
import { FileSelectComponent } from './FileSelectComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'

export abstract class AbstractFormFilesComponent implements SelectFilesComponent {
    readonly label: HTMLElement
    readonly panel: HTMLElement

    onFilesLoaded: (vfs: VirtualFileSystem) => void = () => {
    }

    protected constructor(args: { labelHTML: string, btnText: string, fileNames: string[] }) {
        this.label = document.createElement('div')
        this.label.innerHTML = args.labelHTML
        this.panel = document.createElement('form')
        this.panel.classList.add('select-files-option')
        const fileSelectInputs = args.fileNames.map((fileName) => {
            const fileSelect = new FileSelectComponent(fileName)
            this.panel.appendChild(fileSelect.label)
            return fileSelect.input
        })
        const btnStart = this.panel.appendChild(document.createElement('button'))
        btnStart.innerText = args.btnText
        this.panel.addEventListener('submit', async (e) => {
            try {
                e.preventDefault()
                btnStart.disabled = true
                const files = fileSelectInputs.map((f) => f.files?.[0]).filter((f) => !!f)
                const vfs = new VirtualFileSystem()
                await this.onFilesSelected(vfs, files)
                this.onFilesLoaded(vfs)
            } finally {
                btnStart.disabled = false
            }
        })
    }

    protected abstract onFilesSelected(vfs: VirtualFileSystem, files: File[]): Promise<void>
}
