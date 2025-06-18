export function getPath(url: string): string {
    if (!url) return url
    let strUrl = url.toString().replace(/\\/g, '/')
    if (strUrl.startsWith('/')) strUrl = strUrl.slice(1)
    const lastInd = strUrl.lastIndexOf('/')
    strUrl = strUrl.slice(0, lastInd + 1)
    if (strUrl.startsWith('/')) strUrl = strUrl.slice(1)
    return strUrl
}

export function getFilename(url: string): string {
    if (!url) return url
    let strUrl = url.toString().replace(/\\/g, '/')
    if (strUrl.startsWith('/')) strUrl = strUrl.slice(1)
    const lastInd = strUrl.lastIndexOf('/')
    return strUrl.slice(lastInd + 1)
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

export function clearTimeoutSafe(timeout?: NodeJS.Timeout): undefined {
    if (timeout) clearTimeout(timeout)
    return undefined
}

export function clearIntervalSafe(interval?: NodeJS.Timeout): undefined {
    if (interval) clearInterval(interval)
    return undefined
}

export function cancelAnimationFrameSafe(handle?: number): undefined {
    if (handle) cancelAnimationFrame(handle)
    return undefined
}

export function yieldToMainThread(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve))
}

export function isNum(value: any): value is number {
    return value !== undefined && value !== null && !isNaN(value)
}
