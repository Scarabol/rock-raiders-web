export interface Updatable {
    update(elapsedMs: number): void
}

export function updateSafe(updatable: Updatable, elapsedMs: number) {
    try {
        updatable.update(elapsedMs)
    } catch (e) {
        console.error(e)
    }
}
