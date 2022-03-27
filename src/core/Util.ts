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
    keys.forEach((keyName) => {
        obj = Object.keys(obj)
            .filter((key) => key.toLowerCase() === keyName.toLowerCase())
            .map((key) => obj[key])
        obj = obj ? obj[0] : obj
    })
    return obj
}

export function iSet(obj: any, key: string, value: any) {
    Object.keys(obj).forEach((keyName) => {
        if (keyName.toLowerCase() === key.toLowerCase()) obj[keyName] = value
    })
}

export function decodeString(data: BufferSource) {
    return new TextDecoder().decode(data).replace(/\0/g, '')
}

export function decodeFilepath(data: BufferSource) {
    return decodeString(data).replace(/\\/g, '/')
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

export function getElementByIdOrThrow(elementId: string): HTMLElement {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Fatal error: "' + elementId + '" not found!')
    return element
}
