import { SelectFilesComponent } from './SelectFilesComponent'
import { FileSelectComponent } from './FileSelectComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'

export abstract class AbstractFormFilesComponent implements SelectFilesComponent {
    readonly element: HTMLElement

    onFilesLoaded: (vfs: VirtualFileSystem) => void = () => {
    }

    protected constructor(args: { labelText: string, btnText: string, fileNames: string[] }) {
        this.element = document.createElement('form')
        this.element.classList.add('select-files-option')
        const label = this.element.appendChild(document.createElement('div'))
        label.innerText = args.labelText
        const fileSelectInputs = args.fileNames.map((fileName) => {
            const fileSelect = new FileSelectComponent(fileName)
            this.element.appendChild(fileSelect.label)
            return fileSelect.input
        })
        const btnStart = this.element.appendChild(document.createElement('button'))
        btnStart.innerText = args.btnText
        this.element.addEventListener('submit', async (e) => {
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
