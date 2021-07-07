// The RockRaidersObjectNotation (RON) format is related to JSON

export class RonFileParser {

    static parse(content: string) {
        const lines: string[] = content.split(/[\r\n]+/g).map((l) => l
            .replace(/;.*|\/\/.*/, '') // strip comments from each line
            .trim(), // remove whitespace at start/end of lines
        )
        const root = {}
        this.parseObj(root, lines, 0)
        return root
    }

    private static parseObj(obj: {}, lines: string[], start): number {
        for (let c = start; c < lines.length; c++) {
            const line = lines[c]
            if (line === '') continue
            const [name, val] = line.split(/\s+/) // any number of whitespaces
            const key = name.toLowerCase()
            if (val === '{') {
                obj[key] = {}
                c = this.parseObj(obj[key], lines, c + 1)
            } else if (key === '}') {
                return c
            } else { // parse values
                let value: any = val.split(/:+/) // there is key::value
                    .map(v => v.split(',').map(v => v.split('|').map(v => this.parseValue(v))))
                while (value.length === 1) value = value[0] // flatten arrays with only one value
                obj[key] = value
            }
        }
        return lines.length
    }

    private static parseValue(value: string) {
        const num = Number(value)
        if (!isNaN(num)) return num
        const lv = value.toLowerCase()
        if (lv === 'false') {
            return false
        } else if (lv === 'true') {
            return true
        }
        return value
    }

}
