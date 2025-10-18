export class LevelObjectiveTextEntry {
    levelKey: string = ''
    objective: string = ''
    failure: string = ''
    completion: string = ''
    crystalFailure: string = ''
}

export type LevelObjectiveTexts = Record<string, LevelObjectiveTextEntry>

export class ObjectiveTextParser {
    parseObjectiveTextFile(txtFileText: string): LevelObjectiveTexts {
        const result: LevelObjectiveTexts = {}
        let currentLevel: LevelObjectiveTextEntry
        txtFileText.split('\n').forEach((l) => {
            const line = l.trim()
            if (line.startsWith('[') && line.endsWith(']')) {
                currentLevel = new LevelObjectiveTextEntry()
                currentLevel.levelKey = line.slice(1, -1)
                result[currentLevel.levelKey.toLowerCase()] = currentLevel
            } else if (line.toLowerCase().startsWith('Objective:'.toLowerCase())) {
                currentLevel.objective = line.slice('Objective:'.length).trim()
            } else if (line.toLowerCase().startsWith('Failure:'.toLowerCase())) {
                currentLevel.failure = line.slice('Failure:'.length).trim()
            } else if (line.toLowerCase().startsWith('Completion:'.toLowerCase())) {
                currentLevel.completion = line.slice('Completion:'.length).trim()
            } else if (line.toLowerCase().startsWith('CrystalFailure:'.toLowerCase())) {
                currentLevel.crystalFailure = line.slice('CrystalFailure:'.length).trim()
            }
        })
        return result
    }
}
