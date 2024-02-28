export class NerpScript {
    lines: string[] = [] // contains human readable script strings
    statements: any[] = [] // contains parsed statements for execution
    macrosByName: Map<string, { args: string[], lines: string[] }> = new Map()
    labelsByName: Map<string, number> = new Map()
}
