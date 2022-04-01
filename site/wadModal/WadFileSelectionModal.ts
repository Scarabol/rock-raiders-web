import { Modal } from 'bootstrap'
import { getElementByIdOrThrow } from '../../src/core/Util'

export class WadFileSelectionModal {
    public onStart: (wad0Url: string, wad1Url: string) => any = null

    private readonly modal: Modal
    private readonly startButtons: HTMLButtonElement[] = []
    private readonly progressGroup: HTMLDivElement
    private readonly progressBars: HTMLDivElement[] = []

    constructor(parentId: string) {
        const rootElement = getElementByIdOrThrow(parentId).appendChild(document.createElement('div'))
        rootElement.classList.add('modal')
        rootElement.tabIndex = -1
        rootElement.setAttribute('role', 'dialog')
        rootElement.setAttribute('aria-hidden', 'true')

        const modalDialog = rootElement.appendChild(document.createElement('div'))
        modalDialog.classList.add('modal-dialog')
        rootElement.setAttribute('role', 'document')

        const modalContent = modalDialog.appendChild(document.createElement('div'))
        modalContent.classList.add('modal-content')

        const modalHeader = modalContent.appendChild(document.createElement('div'))
        modalHeader.classList.add('modal-header')
        const modalTitle = modalHeader.appendChild(document.createElement('h5'))
        modalTitle.classList.add('modal-title')
        modalTitle.innerText = 'Rock Raiders Web'
        modalTitle.id = 'wadfileSelectModalLabel'
        rootElement.setAttribute('aria-labelledby', modalTitle.id)

        const modalBody = modalContent.appendChild(document.createElement('div'))
        modalBody.classList.add('modal-body')

        const title = modalBody.appendChild(document.createElement('h6'))
        title.innerText = 'Select game files to start'

        const navTabs = modalBody.appendChild(document.createElement('nav'))
        const navTabList = navTabs.appendChild(document.createElement('div'))
        navTabList.id = 'nav-tab'
        navTabList.classList.add('nav', 'nav-tabs')
        navTabList.setAttribute('role', 'tablist')

        const urlTabActive = true
        const navUrlBtn = WadFileSelectionModal.appendNavButton(navTabList, urlTabActive, 'nav-url-tab', 'nav-url', 'Online from URL')
        const navFileBtn = WadFileSelectionModal.appendNavButton(navTabList, !urlTabActive, 'nav-file-tab', 'nav-file', 'Modded files from local')

        const navTabContent = modalBody.appendChild(document.createElement('div'))
        navTabContent.classList.add('tab-content')
        const navUrlTab = WadFileSelectionModal.appendNavTab(navTabContent, urlTabActive, 'nav-url', navUrlBtn.id)
        this.addUrlLangButton(navUrlTab, 'German', '🇩🇪', 'https://scarabol.github.io/wad-editor/de/wad/RR0.wad', 'https://scarabol.github.io/wad-editor/de/wad/RR1.wad')
        this.addUrlLangButton(navUrlTab, 'English', '🇺🇸', 'https://scarabol.github.io/wad-editor/en/wad/RR0.wad', 'https://scarabol.github.io/wad-editor/en/wad/RR1.wad')
        this.appendNavFileTab(navTabContent, !urlTabActive, navFileBtn.id)

        this.progressGroup = modalBody.appendChild(document.createElement('div'))
        this.progressGroup.style.display = 'none'

        const progressHint = this.progressGroup.appendChild(document.createElement('p'))
        progressHint.classList.add('mt-3')
        progressHint.innerText = 'Downloading... please wait'

        for (let c = 0; c < 2; c++) {
            const progress = this.progressGroup.appendChild(document.createElement('div'))
            progress.classList.add('progress', 'mt-3')

            const progressBar = progress.appendChild(document.createElement('div'))
            progressBar.classList.add('progress-bar')
            progressBar.setAttribute('role', 'progressbar')
            progressBar.setAttribute('aria-valuenow', '0')
            progressBar.setAttribute('aria-valuemin', '0')
            progressBar.setAttribute('aria-valuemax', '100')
            this.progressBars.push(progressBar)
        }

        // rootElement has to be a valid bootstrap HTML modal before we can instantiate it
        this.modal = new Modal(rootElement, {backdrop: 'static', keyboard: false})
    }

    public setProgress(progressBar: number, progress: number, total: number) {
        const progressLabel = `${Math.round(progress * 100 / total)}%`
        this.progressBars[progressBar].innerText = progressLabel
        this.progressBars[progressBar].style.width = progressLabel
    }

    private static appendNavButton(parent: HTMLDivElement, active: boolean, id: string, controlTarget: string, innerText: string) {
        const navBtn = parent.appendChild(document.createElement('button'))
        navBtn.classList.add('nav-link')
        if (active) navBtn.classList.add('active')
        navBtn.id = id
        navBtn.setAttribute('data-bs-toggle', 'tab')
        navBtn.setAttribute('data-bs-target', `#${controlTarget}`)
        navBtn.type = 'button'
        navBtn.setAttribute('role', 'tab')
        navBtn.setAttribute('aria-controls', controlTarget)
        navBtn.setAttribute('aria-selected', String(active))
        navBtn.innerText = innerText
        return navBtn
    }

    private appendNavFileTab(parent: HTMLDivElement, active: boolean, labelledBy: string) {
        const navFileTab = WadFileSelectionModal.appendNavTab(parent, active, 'nav-file', labelledBy)

        const wad0File = WadFileSelectionModal.appendWadFileGroup(navFileTab, 'wad0-file', 'RR0.wad')
        const wad1File = WadFileSelectionModal.appendWadFileGroup(navFileTab, 'wad1-file', 'RR1.wad')

        const btnStartFile = navFileTab.appendChild(document.createElement('button'))
        this.startButtons.push(btnStartFile)
        btnStartFile.type = 'submit'
        btnStartFile.classList.add('btn', 'btn-primary', 'float-end')
        btnStartFile.id = 'button-start-file'
        btnStartFile.innerText = 'Start Game'
        btnStartFile.addEventListener('click', () => {
            this.setButtonsDisabled(true)
            try {
                const wad0FileUrl = URL.createObjectURL(wad0File.files[0])
                const wad1FileUrl = URL.createObjectURL(wad1File.files[0])
                this.onStart(wad0FileUrl, wad1FileUrl)
            } catch (e) {
                console.error(e)
                this.setButtonsDisabled(false)
            }
        })
    }

    private setButtonsDisabled(disabled: boolean) {
        this.startButtons.forEach((b) => b.disabled = disabled)
    }

    private static appendWadFileGroup(parent: HTMLDivElement, id: string, filename: string) {
        const wadFileGroup = parent.appendChild(document.createElement('div'))
        wadFileGroup.classList.add('my-3')
        const wadFileLabel = wadFileGroup.appendChild(document.createElement('label'))
        wadFileLabel.setAttribute('for', id)
        wadFileLabel.classList.add('form-label')
        wadFileLabel.innerHTML = `Select <span class="fw-bold">${filename}</span> here:`
        const wadFileInput = wadFileGroup.appendChild(document.createElement('input'))
        wadFileInput.type = 'file'
        wadFileInput.classList.add('form-control')
        wadFileInput.id = id
        wadFileInput.required = true
        return wadFileInput
    }

    private addUrlLangButton(navUrlTab: HTMLDivElement, lang: string, flag: string, wad0Url: string, wad1Url: string) {
        const btnStartUrl = navUrlTab.appendChild(document.createElement('button'))
        this.startButtons.push(btnStartUrl)
        btnStartUrl.type = 'submit'
        btnStartUrl.classList.add('btn', 'btn-primary', 'mt-3')
        btnStartUrl.id = 'button-start-url'
        btnStartUrl.innerText = 'Start with ' + flag + ' ' + lang + ' game files'
        btnStartUrl.addEventListener('click', () => {
            this.setButtonsDisabled(true)
            this.progressGroup.style.display = 'block'
            this.onStart(wad0Url, wad1Url)
        })
    }

    private static appendNavTab(parent: HTMLDivElement, active: boolean, id: string, labelledBy: string) {
        const navTab = parent.appendChild(document.createElement('div'))
        navTab.classList.add('tab-pane', 'fade')
        if (active) navTab.classList.add('show', 'active')
        navTab.id = id
        navTab.setAttribute('role', 'tabpanel')
        navTab.setAttribute('aria-labelledby', labelledBy)
        return navTab
    }

    public show() {
        this.modal.show()
    }

    public hide() {
        this.modal.hide()
    }
}
