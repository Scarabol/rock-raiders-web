export {}

declare global {
    interface Array<T> {
        add(...element: T[]): void

        remove(element: T): void

        removeLast(element: T): void

        removeAll(predicate: (e: T) => boolean): void

        last(): T

        count(callback: (element: T) => boolean): number

        partition(filter: (element: T) => boolean): [T[], T[]]

        random(): T | undefined

        shuffle(): this
    }

    // noinspection JSUnusedGlobalSymbols
    interface ArrayConstructor {
        ensure<T>(value: T | T[]): T[]

        random<T>(value: [T, ...T[]]): T
    }
}

Array.prototype.add = function <T>(...items: T[]): void {
    items?.forEach((item) => {
        const index = this.indexOf(item)
        if (index === -1) this.push(item)
    })
}

Array.prototype.remove = function <T>(element: T): void {
    const index = this.indexOf(element)
    if (index !== -1) this.splice(index, 1)
}

Array.prototype.removeLast = function <T>(element: T): void {
    const lastIndex = this.indexOf(element)
    if (lastIndex !== -1) this.splice(lastIndex, 1)
}

Array.prototype.removeAll = function <T>(predicate: (e: T) => boolean): void {
    let index = -1
    while ((index = this.findIndex(predicate)) >= 0) {
        this.splice(index, 1)
    }
}

Array.prototype.last = function <T>(): T {
    return this[this.length > 1 ? this.length - 1 : 0]
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
    if (this.length < 1) return undefined
    return this[Math.randomInclusive(this.length - 1)]
}

Array.prototype.shuffle = function <T>(): T[] {
    let currentIndex = this.length
    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--;
        [this[currentIndex], this[randomIndex]] = [this[randomIndex], this[currentIndex]]
    }
    return this
}

Array.ensure = function <T>(value: T | T[]): T[] {
    return (!value) ? [] : Array.isArray(value) ? value : [value]
}

Array.random = function <T>(value: [T, ...T[]]): T {
    return value.random()!
}
