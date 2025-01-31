import { SelectFilesComponent } from './SelectFilesComponent'
import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'
import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js'
import { cachePutData } from '../AssetCacheHelper'
import { VirtualFile } from '../fileparser/VirtualFile'

export class ZipFilesComponent implements SelectFilesComponent {
    static readonly languages: Record<string, string> = {
        '🏴󠁧󠁢󠁥󠁮󠁧󠁿 / 🇺🇸': 'English',
        '🇩🇪': 'German',
        '🇩🇰': 'Danish',
        '🇳🇱': 'Dutch',
        '🇮🇹': 'Italian',
        '🇳🇴': 'Norwegian',
        '🇪🇸': 'Spanish',
        '🇸🇪': 'Swedish',
        '🇫🇷': 'French',
    }

    readonly label: HTMLElement = document.createElement('div')
    readonly panel: HTMLElement = document.createElement('div')
    readonly progressByUrl: Map<string, HTMLProgressElement> = new Map<string, HTMLProgressElement>()
    readonly btnContainer: HTMLElement
    readonly buttons: HTMLButtonElement[] = []
    onFilesLoaded: (vfs: VirtualFileSystem) => void = () => {
    }

    constructor() {
        this.label.innerHTML = 'Use game files hosted on <a href="https://archive.org/details/LEGORockRaiders-gamefiles-Eng">archive.org</a> <b>(one-click-setup, no music/videos)</b>:'
        this.btnContainer = this.panel.appendChild(document.createElement('div'))
        this.btnContainer.classList.add('select-button-container')
        Object.entries(ZipFilesComponent.languages).forEach(([flag, language]) => {
            const btn = this.btnContainer.appendChild(document.createElement('button'))
            this.buttons.push(btn)
            btn.innerText = flag
            btn.title = language
            btn.setAttribute('download-name', language)
            btn.addEventListener('click', () => this.onLanguageSelected(language))
        })
    }

    async onLanguageSelected(language: string) {
        try {
            this.buttons.forEach((btn) => btn.disabled = true)
            this.panel.replaceChildren()
            const zipFileContent = await this.downloadZipFile(language)
            const vfs = new VirtualFileSystem()
            await this.readZipFile(vfs, zipFileContent)
            this.onFilesLoaded(vfs)
        } finally {
            this.buttons.forEach((btn) => btn.disabled = false)
            this.panel.replaceChildren(this.btnContainer)
        }
    }

    async downloadZipFile(language: string) {
        const urls = [0, 1].map((n) => {
            return `https://scarabol.github.io/wad-editor/mirror-archive.org/Rock%20Raiders%20%28${language}%29%20small.zip.part${n}`
        })
        urls.forEach((url) => {
            const fileName = decodeURIComponent(url.split('/').last())
            this.setProgress(fileName, 0, 100)
        })
        const buffers = await Promise.all(urls.map((url) => this.loadFileFromUrl(url)))
        const zipFileLength = buffers.reduce((prev, file) => prev + file.byteLength, 0)
        const joined = new Uint8Array(zipFileLength)
        let offset = 0
        buffers.forEach((b) => {
            joined.set(new Uint8Array(b), offset)
            offset += b.byteLength
        })
        console.log('Download complete')
        return joined
    }

    setProgress(name: string, done: number, total: number): void {
        const progress = this.progressByUrl.getOrUpdate(name, () => {
            const parent = this.panel.appendChild(document.createElement('div'))
            parent.classList.add('select-files-progress')
            const label = parent.appendChild(document.createElement('label'))
            label.innerText = name
            return parent.appendChild(document.createElement('progress'))
        })
        progress.value = done
        progress.max = total
    }

    async loadFileFromUrl(url: string): Promise<ArrayBuffer> {
        const fileName = decodeURIComponent(url.split('/').last())
        return new Promise((resolve, reject) => {
            console.log(`Loading file from ${url}`)
            const xhr = new XMLHttpRequest()
            xhr.open('GET', url)
            xhr.responseType = 'arraybuffer'
            xhr.onprogress = (event) => this.setProgress(fileName, event.loaded, event.total)
            xhr.onerror = (event) => reject(event)
            xhr.onload = () => {
                if (xhr.status !== 200) {
                    reject(new Error(`Could not fetch file from "${url}"! Got status ${xhr.status} - ${xhr.statusText}`))
                } else if (!xhr.response) {
                    reject(new Error(`No response content for request received, please restart browser`))
                } else {
                    resolve(xhr.response)
                }
            }
            xhr.send()
        })
    }

    async readZipFile(vfs: VirtualFileSystem, zipFileContent: Uint8Array): Promise<VirtualFileSystem> {
        console.log('Reading ZIP file...')
        const zipReader = new ZipReader(new Uint8ArrayReader(zipFileContent))
        try {
            const zipEntries = await zipReader.getEntries({
                onprogress: (progress: number, total: number): undefined => {
                    this.setProgress(`Reading ZIP file entries...`, progress, total)
                }
            })
            const wadEntries = zipEntries.filter((e) => !e.directory && !!e.filename.match(/.+\.wad/i))
            await Promise.all(wadEntries.map(async (e) => {
                const lFileName = e.filename.replace('Rock Raiders/', '').toLowerCase()
                const buffer = (await e.getData?.(new Uint8ArrayWriter(), {
                    onprogress: (progress: number, total: number): undefined => {
                        this.setProgress(`Extracting "${e.filename}"...`, progress, total)
                    }
                }))?.buffer as ArrayBuffer // Workaround forhttps://github.com/gildas-lormeau/zip.js/issues/549
                if (!buffer) throw new Error(`Could not read file buffer for ${lFileName}`)
                vfs.registerFile(VirtualFile.fromBuffer(lFileName, buffer))
                await cachePutData(lFileName, buffer)
            }))
            const dataEntries = zipEntries.filter((e) => !e.directory && !!e.filename.match(/Rock Raiders\/Data/i))
            let progress = 0
            await Promise.all(dataEntries.map(async (e) => {
                const lFileName = e.filename.replace('Rock Raiders/', '').toLowerCase()
                const buffer = (await e.getData?.(new Uint8ArrayWriter()))?.buffer as ArrayBuffer // Workaround forhttps://github.com/gildas-lormeau/zip.js/issues/549
                if (!buffer) throw new Error(`Could not read file buffer for ${lFileName}`)
                vfs.registerFile(VirtualFile.fromBuffer(lFileName, buffer))
                await cachePutData(lFileName, buffer)
                progress++
                this.setProgress(`Extracting files...`, progress, dataEntries.length)
            }))
            console.log('ZIP file content processed')
            return vfs
        } finally {
            await zipReader.close()
        }
    }
}
