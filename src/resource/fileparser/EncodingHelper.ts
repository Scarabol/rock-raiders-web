export const encodeChar: number[] = []

for (let c = 0; c < 256; c++) {
    encodeChar[c] = c
}
encodeChar[123] = 0x00C4 // Ä
encodeChar[130] = 0x00E4 // ä
encodeChar[145] = 0x00E6 // æ
encodeChar[162] = 0x00F6 // ö
encodeChar[167] = 0x00DC // Ü
encodeChar[171] = 0x00FC // ü
encodeChar[182] = 0x00F8 // ø
encodeChar[195] = 0x00DF // ß
