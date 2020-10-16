export function getPath(url: string) {
    if (!url) return url;
    let strUrl = url.toString();
    if (strUrl.includes('\\')) console.warn('URL contains backslash: \'' + url + '\'');
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1);
    const lastInd = strUrl.lastIndexOf('/');
    return strUrl.substring(0, lastInd);
}

export function getFilename(url: string) {
    if (!url) return url;
    let strUrl = url.toString();
    if (strUrl.includes('\\')) console.warn('URL contains backslash: \'' + url + '\'');
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1);
    const lastInd = strUrl.lastIndexOf('/');
    return strUrl.substring(lastInd + 1);
}

export function iGet(obj, keyname): any {
    const values = Object.keys(obj)
        .filter((key) => key.toLowerCase() === keyname.toLowerCase())
        .map((key) => obj[key]);
    return values ? values[0] : values;
}

export function decodeString(data) {
    return new TextDecoder().decode(data).replace(/\\0/g, '');
}

export function decodePath(data) {
    return decodeString(data).replace(/\\/, '/');
}
