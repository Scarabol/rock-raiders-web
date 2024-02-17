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
                if (line.startsWith('$')) {
                    const sndMatch = line.match(/\$(\S+)\s+(\S+)/)
                    if (sndMatch.length !== 3) throw new Error('Line in nerp message file did not match')
                    result.some((e) => {
                        if (e.sndNum === sndMatch[1]) {
                            e.snd = sndMatch[2].replace(/\\/g, '/').toLowerCase()
                            if (!e.snd.endsWith('.wav')) e.snd += '.wav'
                            return true
                        }
                        return false
                    })
                } else {
                    const txtMatch = line.match(NerpMsgParser.txtMatcher)
                    if (txtMatch.length !== 6) throw new Error('Line in nerp message file did not match')
                    result[index] = result[index] || {}
                    result[index].txt = txtMatch[2].replace(/_/g, ' ').trim()
                    result[index].sndNum = txtMatch[5]
                }
            })
        return result
    }
}
