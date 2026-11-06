export interface NerpMessage {
    txt: string
    sndNum: string
    snd: string
}

export class NerpMsgParser {
    // text line formatting differs between wad0 and wad1 files!
    static readonly txtMatcher = /(\\\[)?([^\\#]+)(\\])?\s*(#([^#]+)#)?/

    static parseNerpMessages(wadData: string): NerpMessage[] {
        const result: NerpMessage[] = []
        // lone dash lines are placeholders, that keep the 1-based message numbers of the scripts aligned
        const lines = wadData.split(/[\r\n]/).map((l) => l?.trim()).filter((l) => !!l)
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index]
            if (line === '-') {
                result[index] = result[index] || { txt: '', sndNum: '', snd: '' }
            } else if (line.startsWith('$')) {
                const sndMatch = line.match(/\$(\S+)\s+(\S+)/)
                if (!sndMatch) continue
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
                if (!txtMatch) continue
                result[index] = result[index] || { txt: '', sndNum: '', snd: '' }
                result[index].txt = txtMatch[2].replace(/_/g, ' ').trim()
                result[index].sndNum = txtMatch[5]
            }
        }
        return result
    }
}
