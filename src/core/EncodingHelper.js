export function encodeChar(charCode) { // encoding of the original files still remains a mystery
    if (charCode === 130) {
        return 'ä'.charCodeAt(0);
    } else if (charCode === 142) {
        return 'Ä'.charCodeAt(0);
    } else if (charCode === 162) {
        return 'ö'.charCodeAt(0);
    } else if (charCode === 167) {
        return 'Ü'.charCodeAt(0);
    } else if (charCode === 171) {
        return 'ü'.charCodeAt(0);
    } else if (charCode === 195) {
        return 'ß'.charCodeAt(0);
    }
    return charCode;
}
