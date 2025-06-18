declare global {
    interface String {
        equalsIgnoreCase(other?: string): boolean
    }
}

String.prototype.equalsIgnoreCase = function (other?: string): boolean {
    return this.toLowerCase() === other?.toLowerCase()
}

export {}
