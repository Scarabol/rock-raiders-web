export {}

declare global {
    interface Array<T> {
        add(element: T): void

        remove(element: T): void

        removeLast(element: T): void

        last(): T

        count(callback: (element: T) => boolean): number

        partition(filter: (element: T) => boolean): [T[], T[]]

        random(): T
    }

    // noinspection JSUnusedGlobalSymbols
    interface ArrayConstructor {
        ensure<T>(value: T | T[]): T[]
    }
}

Array.prototype.add = function <T>(element: T): void {
    const index = this.indexOf(element)
    if (index === -1) this.push(element)
}

Array.prototype.remove = function <T>(element: T): void {
    const index = this.indexOf(element)
    if (index !== -1) this.splice(index, 1)
}

Array.prototype.removeLast = function <T>(element: T): void {
    const lastIndex = this.indexOf(element)
    if (lastIndex !== -1) this.splice(lastIndex, 1)
}

Array.prototype.last = function <T>(): T {
    return this.length > 0 ? this[this.length - 1] : undefined
}

Array.prototype.count = function <T>(callback: (element: T) => boolean): number {
    let counter = 0
    this.forEach((e: T) => callback(e) && counter++)
    return counter
}

Array.prototype.partition = function <T>(filter: (element: T) => boolean): [T[], T[]] {
    const left: T[] = [], right: T[] = []
    this.forEach((a: T) => filter(a) ? left.push(a) : right.push(a))
    return [left, right]
}

Array.prototype.random = function <T>(): T | undefined {
    if (!this.length) return undefined
    return this[Math.randomInclusive(this.length - 1)]
}

Array.ensure = function <T>(value: T | T[]): T[] {
    return (!value) ? [] : Array.isArray(value) ? value : [value]
}
