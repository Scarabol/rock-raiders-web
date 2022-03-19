export function getPath(url: string): string {
    if (!url) return url
    let strUrl = url.toString().replace(/\\/g, '/')
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1)
    const lastInd = strUrl.lastIndexOf('/')
    strUrl = strUrl.substring(0, lastInd + 1)
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1)
    return strUrl
}

export function getFilename(url: string): string {
    if (!url) return url
    let strUrl = url.toString().replace(/\\/g, '/')
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1)
    const lastInd = strUrl.lastIndexOf('/')
    return strUrl.substring(lastInd + 1)
}

export function iGet(obj: any, ...keys: string[]): any {
    keys.forEach((keyname) => {
        obj = Object.keys(obj)
            .filter((key) => key.toLowerCase() === keyname.toLowerCase())
            .map((key) => obj[key])
        obj = obj ? obj[0] : obj
    })
    return obj
}

export function iSet(obj: any, key: string, value: any) {
    Object.keys(obj).forEach((keyname) => {
        if (keyname.toLowerCase() === key.toLowerCase()) obj[keyname] = value
    })
}

export function decodeString(data: BufferSource) {
    return new TextDecoder().decode(data).replace(/\0/g, '')
}

export function decodeFilepath(data: BufferSource) {
    return decodeString(data).replace(/\\/g, '/')
}

export function getRandomInclusive(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getRandom(max: number) {
    return getRandomInclusive(0, max)
}

export function getRandomSign() {
    return -1 + getRandomInclusive(0, 1) * 2
}

export function clearTimeoutSafe(timeout: NodeJS.Timeout): null {
    if (timeout) clearTimeout(timeout)
    return null
}

export function clearIntervalSafe(interval: NodeJS.Timeout): null {
    if (interval) clearInterval(interval)
    return null
}

export function cancelAnimationFrameSafe(handle: number): null {
    if (handle) cancelAnimationFrame(handle)
    return null
}

export function asArray<T>(value: T | T[]): T[] {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
}

export function getElementByIdOrThrow(elementId: string): HTMLElement {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Fatal error: "' + elementId + '" not found!')
    return element
}

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

    interface Map<K, V> {
        getOrUpdate(key: K, updateCallback: () => V): V

        getOrDefault(key: K, fallback: V): V

        some(predicate: (value: V) => boolean): boolean
    }

    interface String {
        equalsIgnoreCase(other: string): boolean
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

Array.prototype.random = function <T>(): T {
    if (!this.length) return undefined
    return this[getRandom(this.length - 1)]
}

// noinspection JSUnusedGlobalSymbols
Map.prototype.getOrUpdate = function <K, V>(key: K, updateCallback: () => V): V {
    let value = this.get(key)
    if (value === undefined) {
        value = updateCallback()
        this.set(key, value)
    }
    return value
}

Map.prototype.getOrDefault = function <K, V>(key: K, fallback: V): V {
    return this.has(key) ? this.get(key) : fallback
}

Map.prototype.some = function <K, V>(predicate: (element: V) => boolean): boolean {
    for (const value of this.values()) {
        if (predicate(value)) return true
    }
    return false
}

String.prototype.equalsIgnoreCase = function (other: string): boolean {
    return this.toLowerCase() === other?.toLowerCase()
}
