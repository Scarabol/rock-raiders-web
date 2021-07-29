export class InitLoadingMessage {
    wad0FileUrl: string
    wad1FileUrl: string

    constructor(wad0FileUrl: string, wad1FileUrl: string) {
        this.wad0FileUrl = wad0FileUrl
        this.wad1FileUrl = wad1FileUrl
    }
}
