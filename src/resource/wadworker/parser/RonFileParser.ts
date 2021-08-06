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
        const multiValues = []
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
            } else {
                const values = this.parseVal(val)
                this.assignValue(obj, key, multiValues, values)
            }
        }
        return lines.length
    }

    private static parseVal(val) {
        const r = val.split(/:/)
            .map(v => {
                const r = v.split(',').map(v => {
                    const r = v.split('|').map(v => this.parseValue(v))
                    return r.length === 1 ? r[0] : r
                })
                return r.length === 1 ? r[0] : r
            })
        return r.length === 1 ? r[0] : r
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

    private static assignValue(obj: {}, key: string, multiProperties: any[], value: any) {
        if (obj.hasOwnProperty(key)) {
            if (!multiProperties.includes(key)) {
                multiProperties.push(key)
                obj[key] = [obj[key]]
            }
            obj[key].push(value)
        } else {
            obj[key] = value
        }
    }
}
