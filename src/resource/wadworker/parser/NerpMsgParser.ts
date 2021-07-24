interface NerpMessage {

    txt?: string
    snd?: string

}

export class NerpMsgParser {

    static parseNerpMessages(wad0Data: string, wad1Data: string): NerpMessage[] {
        // line formatting differs between wad0 and wad1 files!
        const txt0Matcher = /\\\[([^\\]+)\\]\s*(#([^#]+)#)?/
        const result = this.parseNerpMsgFile(wad0Data, txt0Matcher)
        const txt1Matcher = /^([^$][^#]+)(\s*#([^#]+)#)?/
        const msg1 = this.parseNerpMsgFile(wad1Data, txt1Matcher)
        for (let c = 0; c < msg1.length; c++) {
            result[c] = result[c] || {}
            const m1 = msg1[c]
            if (!m1) continue
            if (m1.txt) result[c].txt = m1.txt
            if (m1.snd) result[c].snd = m1.snd
        }
        return result
    }

    static parseNerpMsgFile(wadData: string, txtMatcher): NerpMessage[] {
        const result: NerpMessage[] = []
        wadData.split(/[\r\n]/).map((l) => l?.trim()).filter((l) => !!l && l !== '-')
            .forEach((line, c) => {
                const txtMatch = line.match(txtMatcher)
                const sndMatch = line.match(/\$(\S+)\s+(\S+)/)
                if (txtMatch) {
                    const index = txtMatch[3] !== undefined ? this.numericNameToNumber(txtMatch[3]) : c // THIS IS MADNESS! #number# at the end of line is OPTIONAL
                    result[index] = result[index] || {}
                    result[index].txt = txtMatch[1].replace(/_/g, ' ').trim()
                } else if (sndMatch?.length === 3) {
                    const index = this.numericNameToNumber(sndMatch[1])
                    result[index] = result[index] || {}
                    result[index].snd = sndMatch[2].replace(/\\/g, '/')
                } else {
                    throw new Error('Line in nerp message file did not match anything')
                }
            })
        return result
    }

    static numericNameToNumber(name: string): number {
        if (name === undefined) {
            throw new Error('Numeric name must not be undefined')
        }
        const digits = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9}
        const specials = {
            ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
            sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
            eightteen: 18, // typo seen in the wild
        }
        const tens = {twenty: 20, thirty: 30, forty: 40}
        let number = specials[name] || digits[name]
        if (number === undefined) {
            Object.keys(tens).forEach(ten => {
                if (name.startsWith(ten)) {
                    const digitName = name.replace(ten, '')
                    number = tens[ten] + (digitName ? digits[digitName] : 0)
                }
            })
        }
        if (number === undefined) {
            throw new Error(`Found unexpected numeric name ${name}`)
        }
        return number
    }

}
