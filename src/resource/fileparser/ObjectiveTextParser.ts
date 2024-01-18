export class LevelObjectiveTextEntry {
    key: string
    objective: string
    failure: string
    completion: string
    crystalFailure: string
}

export class ObjectiveTextParser {
    parseObjectiveTextFile(txtFileText: string) {
        const result: Record<string, LevelObjectiveTextEntry> = {}
        let state = PARSING_STATE.DROP
        let currentLevel: LevelObjectiveTextEntry = null
        let value = ''
        let line = ''
        for (let c = 0; c < txtFileText.length; c++) {
            let char = txtFileText.charAt(c)
            if (state === PARSING_STATE.DROP) {
                if (char === '[') {
                    if (currentLevel) result[currentLevel.key.toLowerCase()] = currentLevel
                    currentLevel = new LevelObjectiveTextEntry()
                    state = PARSING_STATE.KEY
                } else if (currentLevel && char === ':') {
                    const lLine = line.toLowerCase()
                    if (lLine === 'objective') {
                        line = ''
                        state = PARSING_STATE.OBJECTIVE
                    } else if (lLine === 'failure') {
                        line = ''
                        state = PARSING_STATE.FAILURE
                    } else if (lLine === 'completion') {
                        line = ''
                        state = PARSING_STATE.COMPLETION
                    } else if (lLine === 'crystalfailure') {
                        line = ''
                        state = PARSING_STATE.CRYSTAL_FAILURE
                    }
                    for (; c < txtFileText.length && txtFileText.charCodeAt(c + 1) === '\t'.charCodeAt(0); c++) {
                    }
                } else if (char === '\n' || char === '\r') {
                    line = ''
                } else {
                    line += char
                }
            } else if (state === PARSING_STATE.KEY) {
                if (char === ']') {
                    currentLevel.key = value
                    value = ''
                    state = PARSING_STATE.DROP
                } else if (char === '\n' || char === '\r') {
                    throw new Error('Malformed objective text file')
                } else {
                    value += char
                }
            } else if (state === PARSING_STATE.OBJECTIVE) {
                if (char === '\n' || char === '\r') {
                    currentLevel.objective = value
                    value = ''
                    state = PARSING_STATE.DROP
                } else {
                    value += char
                }
            } else if (state === PARSING_STATE.FAILURE) {
                if (char === '\n' || char === '\r') {
                    currentLevel.failure = value
                    value = ''
                    state = PARSING_STATE.DROP
                } else {
                    value += char
                }
            } else if (state === PARSING_STATE.COMPLETION) {
                if (char === '\n' || char === '\r') {
                    currentLevel.completion = value
                    value = ''
                    state = PARSING_STATE.DROP
                } else {
                    value += char
                }
            } else if (state === PARSING_STATE.CRYSTAL_FAILURE) {
                if (char === '\n' || char === '\r') {
                    currentLevel.crystalFailure = value
                    value = ''
                    state = PARSING_STATE.DROP
                } else {
                    value += char
                }
            }
        }
        if (currentLevel) result[currentLevel.key.toLowerCase()] = currentLevel
        currentLevel = null
        return result
    }
}

enum PARSING_STATE {
    DROP,
    KEY,
    OBJECTIVE,
    FAILURE,
    COMPLETION,
    CRYSTAL_FAILURE,
}
