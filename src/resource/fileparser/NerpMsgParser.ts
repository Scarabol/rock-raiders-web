interface NerpMessage {
    txt?: string
    sndNum?: string
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

    static parseNerpMsgFile(wadData: string, txtMatcher: RegExp): NerpMessage[] {
        const result: NerpMessage[] = []
        wadData.split(/[\r\n]/).map((l) => l?.trim()).filter((l) => !!l && l !== '-')
            .forEach((line, index) => {
                const txtMatch = line.match(txtMatcher)
                const sndMatch = line.match(/\$(\S+)\s+(\S+)/)
                if (txtMatch) {
                    result[index] = result[index] || {}
                    result[index].txt = txtMatch[1].replace(/_/g, ' ').trim()
                    if (txtMatch[3]) result[index].sndNum = txtMatch[3]
                } else if (sndMatch?.length === 3) {
                    result.some((e) => {
                        if (e.sndNum === sndMatch[1]) {
                            e.snd = sndMatch[2].replace(/\\/g, '/')
                            return true
                        }
                        return false
                    })
                } else {
                    throw new Error('Line in nerp message file did not match anything')
                }
            })
        return result
    }
}
