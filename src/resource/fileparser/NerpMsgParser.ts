interface NerpMessage {
    txt?: string
    sndNum?: string
    snd?: string
}

export class NerpMsgParser {
    static readonly txtMatcher = /(\\\[)?([^\\#]+)(\\])?\s*(#([^#]+)#)?/

    static parseNerpMessages(wadData: string): NerpMessage[] {
        // line formatting differs between wad0 and wad1 files!
        const result: NerpMessage[] = []
        wadData.split(/[\r\n]/).map((l) => l?.trim()).filter((l) => !!l && l !== '-')
            .forEach((line, index) => {
                const txtMatch = line.match(NerpMsgParser.txtMatcher)
                const sndMatch = line.match(/\$(\S+)\s+(\S+)/)
                if (txtMatch) {
                    result[index] = result[index] || {}
                    result[index].txt = txtMatch[2].replace(/_/g, ' ').trim()
                    if (txtMatch[4]) result[index].sndNum = txtMatch[4]
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
