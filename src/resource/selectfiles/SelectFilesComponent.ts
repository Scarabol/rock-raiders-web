import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'

export interface SelectFilesComponent {
    readonly label: HTMLElement
    readonly panel: HTMLElement

    onFilesLoaded: (vfs: VirtualFileSystem) => void
}
