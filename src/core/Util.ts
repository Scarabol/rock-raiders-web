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
