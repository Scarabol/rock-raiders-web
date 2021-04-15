import { Modal } from 'bootstrap'

export class WadFileSelectionModal {

    public onStart: (wad0Url, wad1Url) => any = null

    private readonly modal: Modal

    constructor(parentId: string) {
        const rootElement = document.getElementById(parentId).appendChild(document.createElement('div'))
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
        modalTitle.innerText = 'Load .wad files'
        modalTitle.id = 'wadfileSelectModalLabel'
        rootElement.setAttribute('aria-labelledby', modalTitle.id)

        const modalBody = modalContent.appendChild(document.createElement('div'))
        modalBody.classList.add('modal-body')

        const hint = modalBody.appendChild(document.createElement('p'))
        hint.innerText = 'Assets not included! In order to play the game, please select the game files.'

        const navTabs = modalBody.appendChild(document.createElement('nav'))
        const navTabList = navTabs.appendChild(document.createElement('div'))
        navTabList.id = 'nav-tab'
        navTabList.classList.add('nav', 'nav-tabs')
        navTabList.setAttribute('role', 'tablist')

        const navFileBtn = WadFileSelectionModal.appendNavButton(navTabList, true, 'nav-file-tab', 'nav-file', 'Local files (recommended)')
        const navUrlBtn = WadFileSelectionModal.appendNavButton(navTabList, false, 'nav-url-tab', 'nav-url', 'Online from URL')

        const navTabContent = modalBody.appendChild(document.createElement('div'))
        navTabContent.classList.add('tab-content')
        this.appendNavFileTab(navTabContent, navFileBtn.id)
        this.appendNavUrlTab(navTabContent, navUrlBtn.id)

        // rootElement has to be a valid bootstrap HTML modal before we can instantiate it
        this.modal = new Modal(rootElement, {backdrop: 'static', keyboard: false})
    }

    private static appendNavButton(parent: HTMLDivElement, active: boolean, id: string, controlTarget: string, innerText: string) {
        const navBtn = parent.appendChild(document.createElement('button'))
        navBtn.classList.add('nav-link')
        if (active) navBtn.classList.add('active')
        navBtn.id = id
        navBtn.setAttribute('data-bs-toggle', 'tab')
        navBtn.setAttribute('data-bs-target', '#' + controlTarget)
        navBtn.type = 'button'
        navBtn.setAttribute('role', 'tab')
        navBtn.setAttribute('aria-controls', controlTarget)
        navBtn.setAttribute('aria-selected', String(active))
        navBtn.innerText = innerText
        return navBtn
    }

    private appendNavFileTab(parent: HTMLDivElement, labelledBy: string) {
        const navFileTab = WadFileSelectionModal.appendNavTab(parent, true, 'nav-file', labelledBy)

        const wad0File = WadFileSelectionModal.appendWadFileGroup(navFileTab, 'wad0-file', 'LegoRR0.wad')
        const wad1File = WadFileSelectionModal.appendWadFileGroup(navFileTab, 'wad1-file', 'LegoRR1.wad')

        const btnStartFile = navFileTab.appendChild(document.createElement('button'))
        btnStartFile.type = 'submit'
        btnStartFile.classList.add('btn', 'btn-primary', 'float-end')
        btnStartFile.id = 'button-start-file'
        btnStartFile.innerText = 'Start Game'
        btnStartFile.addEventListener('click', () => {
            btnStartFile.disabled = true
            const wad0FileUrl = URL.createObjectURL(wad0File.files[0])
            const wad1FileUrl = URL.createObjectURL(wad1File.files[0])
            this.onStart(wad0FileUrl, wad1FileUrl)
        })
    }

    private static appendWadFileGroup(parent: HTMLDivElement, id: string, filename: string) {
        const wadFileGroup = parent.appendChild(document.createElement('div'))
        wadFileGroup.classList.add('my-3')
        const wadFileLabel = wadFileGroup.appendChild(document.createElement('label'))
        wadFileLabel.setAttribute('for', id)
        wadFileLabel.classList.add('form-label')
        wadFileLabel.innerHTML = 'Select <span class="fw-bold">' + filename + '</span> here:'
        const wadFileInput = wadFileGroup.appendChild(document.createElement('input'))
        wadFileInput.type = 'file'
        wadFileInput.classList.add('form-control')
        wadFileInput.id = id
        wadFileInput.required = true
        return wadFileInput
    }

    private appendNavUrlTab(parent: HTMLDivElement, labelledBy: string) {
        const navUrlTab = WadFileSelectionModal.appendNavTab(parent, false, 'nav-url', labelledBy)

        const urlHint = navUrlTab.appendChild(document.createElement('div'))
        urlHint.classList.add('my-3')
        urlHint.innerText = 'Direct links with correct Allow-Origin-CORS-Headers required here.'

        const wad0Url = WadFileSelectionModal.appendWadUrlGroup(navUrlTab, 'wad0-url', 'LegoRR0.wad', 'https://drive.google.com/uc?export=download&id=11t9AJnGCWnEWlLxSsYQeB_Y4jrKfxVxQ')
        const wad1Url = WadFileSelectionModal.appendWadUrlGroup(navUrlTab, 'wad1-url', 'LegoRR1.wad', 'https://drive.google.com/uc?export=download&id=11t9AJnGCWnEWlLxSsYQeB_Y4jrKfxVxQ')

        const btnStartUrl = navUrlTab.appendChild(document.createElement('button'))
        btnStartUrl.type = 'submit'
        btnStartUrl.classList.add('btn', 'btn-primary', 'float-end')
        btnStartUrl.id = 'button-start-url'
        btnStartUrl.innerText = 'Start Game'
        btnStartUrl.addEventListener('click', () => {
            btnStartUrl.disabled = true
            // XXX show loading progress for WAD files
            this.onStart(wad0Url.value, wad1Url.value)
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

    private static appendWadUrlGroup(parent: HTMLDivElement, id: string, filename: string, example: string) {
        const wadUrlGroup = parent.appendChild(document.createElement('div'))
        wadUrlGroup.classList.add('my-3')
        const wadUrlLabel = wadUrlGroup.appendChild(document.createElement('label'))
        wadUrlLabel.setAttribute('for', id)
        wadUrlLabel.classList.add('form-label')
        wadUrlLabel.innerHTML = 'Enter url for <span class="fw-bold">' + filename + '</span> here:'
        const wadUrlInput = wadUrlGroup.appendChild(document.createElement('input'))
        wadUrlInput.type = 'url'
        wadUrlInput.classList.add('form-control')
        wadUrlInput.id = id
        wadUrlInput.required = true
        wadUrlInput.value = example
        return wadUrlInput
    }

    public show() {
        this.modal.show()
    }

    public hide() {
        this.modal.hide()
    }

}
