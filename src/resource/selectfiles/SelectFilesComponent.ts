import { VirtualFileSystem } from '../fileparser/VirtualFileSystem'

export interface SelectFilesComponent {
    readonly element: HTMLElement

    onFilesLoaded: (vfs: VirtualFileSystem) => void
}
