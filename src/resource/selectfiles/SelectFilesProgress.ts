export class SelectFilesProgress {
    readonly root: HTMLElement = document.createElement('div')
    readonly progressByUrl: Map<string, HTMLProgressElement> = new Map<string, HTMLProgressElement>()

    setProgress(name: string, done: number, total: number): void {
        const progress = this.progressByUrl.getOrUpdate(name, () => {
            const parent = this.root.appendChild(document.createElement('div'))
            parent.classList.add('select-files-progress')
            const label = parent.appendChild(document.createElement('label'))
            label.innerText = name
            return parent.appendChild(document.createElement('progress'))
        })
        progress.value = done
        progress.max = total
    }

    reset() {
        this.root.replaceChildren()
    }
}
