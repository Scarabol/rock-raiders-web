import './SelectFilesModal.css'

export class SelectFilesModal {
    readonly progressByUrl: Map<string, HTMLProgressElement> = new Map<string, HTMLProgressElement>()
    readonly rootElement: HTMLElement
    readonly container: HTMLElement

    constructor(parentId: string, onFilesSelected: (headerUrl: string, volumeUrl1: string, volumeUrl2: string) => void) {
        this.rootElement = document.getElementById(parentId).appendChild(document.createElement('div'))
        this.rootElement.classList.add('select-files-modal')
        this.rootElement.style.visibility = 'hidden'
        const heading = this.rootElement.appendChild(document.createElement('h5'))
        heading.classList.add('select-files-heading')
        heading.innerText = 'Rock Raiders Web'
        const content = this.rootElement.appendChild(document.createElement('div'))
        content.classList.add('select-files-content')
        const btnStartVanilla = content.appendChild(document.createElement('button'))
        btnStartVanilla.innerText = 'Start game with vanilla files'
        btnStartVanilla.addEventListener('click', () => {
            btnStartVanilla.disabled = true
            btnStartModded.disabled = true
            this.container.replaceChildren()
            const headerUrl = 'https://scarabol.github.io/wad-editor/data1.hdr'
            const volumeUrl1 = 'https://scarabol.github.io/wad-editor/data1.cab.part1'
            const volumeUrl2 = 'https://scarabol.github.io/wad-editor/data1.cab.part2'
            this.setProgress(headerUrl, 0, 100)
            this.setProgress(volumeUrl1, 0, 100)
            this.setProgress(volumeUrl2, 0, 100)
            onFilesSelected(headerUrl, volumeUrl1, volumeUrl2)
        })
        this.container = content.appendChild(document.createElement('div'))
        this.container.classList.add('select-files-container')
        const modLabel = this.container.appendChild(document.createElement('h6'))
        modLabel.innerText = 'Modded files from local'
        const headerLabel = this.container.appendChild(document.createElement('label'))
        headerLabel.innerHTML = 'Select <b>data1.hdr</b> here:'
        const headerInput = this.container.appendChild(document.createElement('input'))
        headerInput.classList.add('select-files-input')
        headerInput.type = 'file'
        const volumeLabel = this.container.appendChild(document.createElement('label'))
        volumeLabel.innerHTML = 'Select <b>data1.cab</b> here:'
        const volumeInput = this.container.appendChild(document.createElement('input'))
        volumeInput.classList.add('select-files-input')
        volumeInput.type = 'file'
        const btnStartModded = this.container.appendChild(document.createElement('button'))
        btnStartModded.innerText = 'Start game with modded files'
        btnStartModded.addEventListener('click', () => {
            btnStartVanilla.disabled = true
            btnStartModded.disabled = true
            const headerFile = headerInput.files[0]
            const volumeFile = volumeInput.files[0]
            if (headerFile && volumeFile) {
                const headerUrl = URL.createObjectURL(headerFile)
                const volumeUrl1 = URL.createObjectURL(volumeFile)
                onFilesSelected(headerUrl, volumeUrl1, '')
            }
        })
    }

    show(): void {
        this.rootElement.style.visibility = 'visible'
    }

    hide(): void {
        this.rootElement.style.visibility = 'hidden'
    }

    setProgress(url: string, done: number, total: number): void {
        let progress = this.progressByUrl.get(url)
        if (!progress) {
            const parent = this.container.appendChild(document.createElement('div'))
            parent.classList.add('select-files-progress')
            const label = parent.appendChild(document.createElement('label'))
            const urlParts = url.split('/')
            label.innerText = urlParts[urlParts.length - 1]
            progress = parent.appendChild(document.createElement('progress'))
            this.progressByUrl.set(url, progress)
        }
        progress.value = done
        progress.max = total
    }
}
