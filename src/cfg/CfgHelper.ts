export function parseLabel(label?: string[] | string): string {
    if (!label) return ''
    const result = Array.isArray(label) ? label.join(',') : label // cfg parser does split(',')
    return result.replace(/_/g, ' ')
}
