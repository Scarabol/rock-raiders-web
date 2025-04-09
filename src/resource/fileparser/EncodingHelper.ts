import { VFSEncoding } from './VirtualFileSystem'

export class EncodingHelper {
    private static currentEncoding: VFSEncoding = 'default'

    static setEncoding(encoding: VFSEncoding) {
        console.log(`Changing character encoding to "${encoding}"`)
        this.currentEncoding = encoding
    }

    static decodeString(encoded: string): string {
        return this.decode([...encoded].map((s) => s.charCodeAt(0)))
    }

    static decode(charCodes: number[]): string {
        if (this.currentEncoding !== 'default') {
            return new TextDecoder(this.currentEncoding).decode(new Uint8Array(charCodes))
        } else {
            return String.fromCharCode(...charCodes.map((c) => encodeChar[c]))
        }
    }
}

export const encodeChar: number[] = []

for (let c = 0; c < 256; c++) {
    encodeChar[c] = c
}
encodeChar[123] = 'Ä'.charCodeAt(0)
encodeChar[124] = 'Å'.charCodeAt(0)
encodeChar[125] = 'Á'.charCodeAt(0)
encodeChar[126] = 'À'.charCodeAt(0)
encodeChar[127] = 'Â'.charCodeAt(0)
encodeChar[128] = 'Ã'.charCodeAt(0)
encodeChar[129] = 'Ą'.charCodeAt(0)
encodeChar[130] = 'ä'.charCodeAt(0)
encodeChar[131] = 'å'.charCodeAt(0)
encodeChar[132] = 'á'.charCodeAt(0)
encodeChar[133] = 'à'.charCodeAt(0)
encodeChar[134] = 'â'.charCodeAt(0)
encodeChar[135] = 'ã'.charCodeAt(0)
encodeChar[136] = 'ą'.charCodeAt(0)
encodeChar[137] = 'Ë'.charCodeAt(0)
encodeChar[138] = 'E̊'.charCodeAt(0)
encodeChar[139] = 'É'.charCodeAt(0)
encodeChar[140] = 'È'.charCodeAt(0)
encodeChar[141] = 'Ê'.charCodeAt(0)
encodeChar[142] = 'Ę'.charCodeAt(0)
encodeChar[143] = 'ë'.charCodeAt(0)
encodeChar[144] = 'e̊'.charCodeAt(0)
encodeChar[145] = 'é'.charCodeAt(0)
encodeChar[146] = 'è'.charCodeAt(0)
encodeChar[147] = 'ê'.charCodeAt(0)
encodeChar[148] = 'ę'.charCodeAt(0)
encodeChar[149] = 'Ï'.charCodeAt(0)
encodeChar[150] = 'Í'.charCodeAt(0)
encodeChar[151] = 'Ì'.charCodeAt(0)
encodeChar[152] = 'Î'.charCodeAt(0)
encodeChar[153] = 'ï'.charCodeAt(0)
encodeChar[154] = 'í'.charCodeAt(0)
encodeChar[155] = 'ì'.charCodeAt(0)
encodeChar[156] = 'î'.charCodeAt(0)
encodeChar[157] = 'Ö'.charCodeAt(0)
encodeChar[158] = 'Ó'.charCodeAt(0)
encodeChar[159] = 'Ò'.charCodeAt(0)
encodeChar[160] = 'Ô'.charCodeAt(0)
encodeChar[161] = 'Õ'.charCodeAt(0)
encodeChar[162] = 'ö'.charCodeAt(0)
encodeChar[163] = 'ó'.charCodeAt(0)
encodeChar[164] = 'ò'.charCodeAt(0)
encodeChar[165] = 'ô'.charCodeAt(0)
encodeChar[166] = 'õ'.charCodeAt(0)
encodeChar[167] = 'Ü'.charCodeAt(0)
encodeChar[168] = 'Ú'.charCodeAt(0)
encodeChar[169] = 'Ù'.charCodeAt(0)
encodeChar[170] = 'Û'.charCodeAt(0)
encodeChar[171] = 'ü'.charCodeAt(0)
encodeChar[172] = 'ú'.charCodeAt(0)
encodeChar[173] = 'ù'.charCodeAt(0)
encodeChar[174] = 'û'.charCodeAt(0)
encodeChar[175] = 'Ç'.charCodeAt(0)
encodeChar[176] = 'Ć'.charCodeAt(0)
encodeChar[177] = 'ç'.charCodeAt(0)
encodeChar[178] = 'ć'.charCodeAt(0)
encodeChar[179] = 'Æ'.charCodeAt(0)
encodeChar[180] = 'æ'.charCodeAt(0)
encodeChar[181] = 'Ø'.charCodeAt(0)
encodeChar[182] = 'ø'.charCodeAt(0)
encodeChar[183] = 'Ł'.charCodeAt(0)
encodeChar[184] = 'ł'.charCodeAt(0)
encodeChar[185] = 'Œ'.charCodeAt(0)
encodeChar[186] = 'œ'.charCodeAt(0)
encodeChar[187] = '¿'.charCodeAt(0)
encodeChar[188] = '¡'.charCodeAt(0)
encodeChar[189] = 'Ź'.charCodeAt(0)
encodeChar[190] = 'Ż'.charCodeAt(0)
encodeChar[191] = 'ź'.charCodeAt(0)
encodeChar[192] = 'ż'.charCodeAt(0)
encodeChar[193] = 'Ś'.charCodeAt(0)
encodeChar[194] = 'ś'.charCodeAt(0)
encodeChar[195] = 'ß'.charCodeAt(0)
encodeChar[196] = ''.charCodeAt(0)
encodeChar[197] = '°'.charCodeAt(0)
encodeChar[198] = 'ᵃ'.charCodeAt(0)
encodeChar[199] = 'Ñ'.charCodeAt(0)
encodeChar[200] = 'Ń'.charCodeAt(0)
encodeChar[201] = 'ñ'.charCodeAt(0)
encodeChar[202] = 'ń'.charCodeAt(0)
