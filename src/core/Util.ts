export function getPath(url: string) {
    if (!url) return url;
    let strUrl = url.toString().replace(/\\/g, '/');
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1);
    const lastInd = strUrl.lastIndexOf('/');
    strUrl = strUrl.substring(0, lastInd + 1);
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1);
    return strUrl;
}

export function getFilename(url: string) {
    if (!url) return url;
    let strUrl = url.toString().replace(/\\/g, '/');
    if (strUrl.startsWith('/')) strUrl = strUrl.substring(1);
    const lastInd = strUrl.lastIndexOf('/');
    return strUrl.substring(lastInd + 1);
}

export function iGet(obj, ...keys: string[]): any {
    keys.forEach((keyname) => {
        obj = Object.keys(obj)
            .filter((key) => key.toLowerCase() === keyname.toLowerCase())
            .map((key) => obj[key]);
        obj = obj ? obj[0] : obj;
    });
    return obj;
}

export function decodeString(data) {
    return new TextDecoder().decode(data).replace(/\0/g, '');
}

export function decodeFilepath(data) {
    return decodeString(data).replace(/\\/g, '/');
}

export function getRandomInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandom(max) {
    return getRandomInclusive(0, max);
}

export function getRandomSign() {
    return -1 + getRandomInclusive(0, 1) * 2;
}
