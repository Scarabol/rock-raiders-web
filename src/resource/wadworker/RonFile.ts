// The RockRaidersObjectNotation (RON) format is related to JSON

export class RonFile {

    static parse(content: string) {
        const lines: string[][] = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => { // strip comments from each line
                const indDoubleSlash = l.indexOf('//')
                if (indDoubleSlash > -1) l = l.substring(0, indDoubleSlash)
                const indComment = l.indexOf(';')
                if (indComment > -1) l = l.substring(0, indComment)
                return l
            })
            .map((l) => { // remove whitespace at start/end of lines
                l = l.trim()
                return l
            })
            .filter(l => l !== '') // filter empty lines
            .map((v) => v.split(' ').filter(v => v !== ''))
        const root = {}
        RonFile.parseObj(root, lines, 0)
        return root
    }

    static parseObj(obj: {}, lines: string[][], start): number {
        for (let c = start; c < lines.length; c++) {
            const [name, val] = lines[c]
            const key = name.toLowerCase()
            if (val === '{') {
                obj[key] = {}
                c = this.parseObj(obj[key], lines, c + 1)
            } else if (key === '}') {
                return c
            } else {
                // parse values
                let value: any = val.split(':').filter(v => v !== '') // there is key::value
                    .map(v => v.split(',').map(v => v.split('|').map(v => this.parseValue(v))))
                while (value.length === 1) value = value[0] // replace arrays with only one value
                obj[key] = value
            }
        }
        return lines.length
    }

    static parseValue(value: string) {
        const num = Number(value)
        const lv = value.toLowerCase()
        if (!isNaN(num)) {
            return num
        } else if (lv === 'false') {
            return false
        } else if (lv === 'true') {
            return true
        } else {
            return value
        }
    }

}
